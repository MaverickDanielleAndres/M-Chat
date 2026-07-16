// supabase/functions/gemini-proxy/index.ts
// =============================================================
// M-Chat Gemini API Proxy
// =============================================================
// This Edge Function keeps the Gemini API key server-side. The browser
// calls this function with the JWT; the function attaches the key from
// Supabase Secrets and forwards to the Gemini streaming endpoint.
//
// Why this matters:
//   - The browser bundle is publicly inspectable. If VITE_GEMINI_API_KEY is
//     embedded in the client, anyone can extract and abuse it.
//   - Quotas, abuse detection, and rate-limiting belong on the server.
//   - Using `verify_jwt: true` ensures only authenticated users can call it.
//
// Deploy:
//   supabase functions deploy gemini-proxy --no-verify-jwt=false
//   supabase secrets set GEMINI_API_KEY=... (one or more keys, comma-separated)
//
// Once deployed, set VITE_GEMINI_PROXY_URL in .env.local to
//   `${VITE_SUPABASE_URL}/functions/v1/gemini-proxy`
// and the client will route through this proxy automatically.
// =============================================================

// @ts-nocheck — Deno runtime; types are provided by supabase-functions.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

const MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-exp",
  "gemini-1.5-flash",
];

function buildKeyPool(): string[] {
  const raw = Deno.env.get("GEMINI_API_KEYS") || Deno.env.get("GEMINI_API_KEY") || "";
  return raw
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length >= 20 && !k.includes("your-key"));
}

function classifyError(status: number): string {
  if (status === 429) return "RATE_LIMITED";
  if (status === 401 || status === 403) return "AUTH_FAILED";
  if (status >= 500) return "UPSTREAM_ERROR";
  return "BAD_REQUEST";
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("method_not_allowed", { status: 405 });
  }

  // Auth: validate the JWT against Supabase Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "missing_authorization" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: "invalid_token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Rate-limit guard (cheap in-memory check; replace with redis/upstash for prod)
  // (omitted for brevity — could be added here)

  const body = await req.json().catch(() => ({}));
  const {
    messages,
    attachments, // [{ mimeType, data: base64 }]
    model,
    systemInstruction,
    stream = true,
  } = body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: "missing_messages" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const pool = buildKeyPool();
  if (pool.length === 0) {
    return new Response(JSON.stringify({ error: "no_api_key_configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const tried = new Set<string>();
  let lastStatus = 500;
  let lastText = "";

  for (const modelName of MODEL_CANDIDATES) {
    if (model && model !== modelName) continue;
    for (const key of pool) {
      if (tried.has(key)) continue;
      tried.add(key);

      // Build Gemini request
      const contents = messages.map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }));

      // Last user message gets the attachments
      const last = contents[contents.length - 1];
      if (Array.isArray(attachments) && attachments.length && last?.role === "user") {
        for (const a of attachments) {
          if (a?.data && a?.mimeType) {
            last.parts.push({ inlineData: { data: a.data, mimeType: a.mimeType } });
          }
        }
      }

      const url = `${GEMINI_BASE}/models/${modelName}:${
        stream ? "streamGenerateContent" : "generateContent"
      }?alt=sse&key=${key}`;

      const upstream = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: systemInstruction
            ? { parts: [{ text: systemInstruction }] }
            : undefined,
          generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.7,
            topP: 0.95,
          },
        }),
      }).catch((err) => {
        return new Response(JSON.stringify({ error: "fetch_failed", detail: String(err) }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        });
      });

      lastStatus = upstream.status;
      lastText = await upstream.text();

      if (upstream.ok) break;
      // On quota / rate-limit, try next key. On auth, break (no point retrying).
      const kind = classifyError(upstream.status);
      if (kind === "AUTH_FAILED") break;
      // else continue with next key
    }
    if (lastStatus < 400) break;
  }

  if (lastStatus >= 400) {
    return new Response(
      JSON.stringify({ error: classifyError(lastStatus), detail: lastText.slice(0, 500) }),
      { status: lastStatus, headers: { "Content-Type": "application/json" } }
    );
  }

  // Stream the SSE upstream response back to the client
  return new Response(lastText, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
});