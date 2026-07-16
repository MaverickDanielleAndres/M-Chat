# M-Chat — Project Overview

> A premium AI workspace built around one core idea: chat should be the surface where everything — text, code, documents, images, voice, search — comes together.

---

## What it is

**M-Chat** is a multi-tenant, multi-modal AI chat application. The user types or speaks into one composer, attaches files (PDFs, images, code, spreadsheets), picks a persona, and gets an answer from Google Gemini that can reason over everything in context.

It's not a wrapper around one model. It's a full product surface — auth, persistence, billing, sharing, and deployment — designed to compete with ChatGPT, Claude, and Gemini's own UIs on responsiveness and ergonomics.

---

## What it does

### Core surface
- **Multi-turn chat** with streaming responses, regenerated answers, and persistent history
- **Personas** — switch the AI's voice and expertise mid-conversation (Senior Developer, Copywriter, Data Analyst, Translator, General Assistant)
- **Document upload + AI analysis** — drop a PDF, CSV, image, or code file; the model reads it inline
- **Image generation** — request an image with natural language, see it inline
- **Voice input** (Web Speech API STT) + **read-aloud** (TTS) for accessibility
- **Web search toggle** — opt-in grounding for fresh facts
- **Conversation management** — sidebar with search, pin, rename, duplicate, share, archive, delete

### Supporting systems
- **Authentication** — email/password, magic link, Google OAuth, profile editor (display name + bio)
- **Quota + billing** — daily prompt quota, credit wallet, four subscription tiers, upgrade flow
- **Settings** — theme, accent color, font, density, animations, sound, default model, custom instructions
- **Notifications** — in-app notification panel with mark-all-read and clear
- **Marketing site** — landing page with hero, capabilities, pricing, FAQ, footer
- **Admin dashboard** — user management, subscription plans, audit log, system config

---

## How it's built

### Stack
| Layer | Tech |
|---|---|
| **Frontend** | Vite + React 19 + TypeScript + Tailwind + shadcn/ui |
| **State** | Zustand (with selector pattern to avoid unnecessary re-renders) |
| **Routing** | React Router 7 (hash router for static hosting) |
| **Animation** | Framer Motion |
| **Markdown** | react-markdown + remark-gfm + react-syntax-highlighter |
| **Database** | Supabase (PostgreSQL) — fully normalized, RLS on every user-owned table |
| **Auth** | Supabase Auth (JWT, PKCE flow) |
| **Storage** | Supabase Storage (private attachments bucket, public avatars) |
| **AI** | Google Gemini via `@google/genai` (2.5 Flash default, key rotation, demo fallback) |
| **Server AI proxy** | Supabase Edge Function (`gemini-proxy`) — keeps API key off the browser |
| **Deployment** | Vercel (framework preset: Vite, SPA rewrites) |

### Architecture highlights
- **DB-authoritative everything.** Quota checks (`check_user_can_prompt`), prompt increments (`record_prompt_usage`), and message counting all happen in Postgres functions. The client UI just reflects what the DB says.
- **RLS everywhere.** Every user-owned table has policies scoped to `auth.uid()`. Cross-user data leaks are structurally impossible.
- **Two ID systems, both real UUIDs.** Client-side `crypto.randomUUID()` for offline/guest flows; server-side `uuid_generate_v4()` for authed flows. No more "invalid input syntax for type uuid" errors.
- **rAF-batched streaming.** AI response chunks are batched via `requestAnimationFrame` so the chat doesn't re-render 60+ times per second. No more typing/scroll lag during long responses.
- **Lazy-loaded admin surfaces.** AdminDashboard, UserDashboard, and DeveloperPanel pull in `recharts` (~250kB) only when their route is visited. Main chat bundle stays small.

### Database schema (PostgreSQL via Supabase)
```
auth.users                    ← Supabase-managed
  └─ public.user_profiles    (role, subscription_tier, display_name, bio, avatar_url, ...)
       ├─ conversations       (title, model, system_prompt, pinned, archived, message_count, ...)
       │   └─ messages        (role, content, status, tokens_input/output, ...)
       │       └─ attachments (file_name, mime_type, storage_path, public_url, ...)
       ├─ app_settings       (theme, accent_color, font_size, density, default_model, web_search_enabled, ...)
       ├─ credit_wallets     (balance, daily_quota, daily_used, daily_reset_at, ...)
       ├─ credit_transactions (append-only ledger)
       └─ folders / tags / folder_assignments / conversation_tags
  subscription_plans         (free, registered, pro, premium — catalog)
  feature_flags              (global toggles)
  audit_events               (admin trail)
```

Triggers handle denormalized counters (`message_count`, `last_active_at`) and the `handle_new_user` trigger auto-creates profile + wallet + settings on signup.

---

## Pricing model

| Tier | Daily prompts | Features |
|---|---|---|
| **Free** | 10 | Basic chat, local history |
| **Registered** (default after signup) | 50 | Cloud sync, document upload, image analysis |
| **Pro** | unlimited | Image generation, voice, 50MB uploads, 10GB storage |
| **Premium** | unlimited | Team workspace, API access, white-label |

The DB enforces the quota via `check_user_can_prompt()`; the client UI gates on it but can't bypass it.

---

## Performance

- **Bundle:** 1.54 MB main chunk (gzip 407 kB), 47 kB lazy chunks for admin/dev panels
- **Streaming:** rAF-batched AI chunks → max 60 renders/sec, no scroll lag
- **Selectors:** Zustand field-by-field reads instead of full destructure → components only re-render when their slice changes
- **Caching:** Vite-hashed assets get 1-year immutable cache via `vercel.json` headers
- **Image gen:** Multi-model fallback (Gemini 2.5 Flash Image → 2.0 Flash Exp → Imagen 3) so a single deprecation doesn't break the feature

---

## Security model

- **Authentication:** Supabase JWT with PKCE flow; tokens stored by `@supabase/supabase-js`, never in our state
- **Authorization:** Row-Level Security on every user-owned table; cross-user data access is structurally impossible
- **Quota enforcement:** Authoritative in DB via SECURITY DEFINER functions — the client UI is just decoration
- **API keys:** `VITE_GEMINI_API_KEY` ships in the browser bundle (Vite's `VITE_*` prefix). For production, deploy the included `gemini-proxy` edge function and set `VITE_GEMINI_PROXY_URL` — the key never ships to the browser.
- **Storage:** Attachments bucket is private and scoped per-user via `(storage.foldername(name))[1] = auth.uid()::text`
- **Hardening migration:** `20260717000000_phase2_hardening.sql` heals drifted counts, adds indexes, and tightens storage RLS

See [SECURITY.md](SECURITY.md) for the full model.

---

## Deployment

```bash
# Local dev
npm install
npm run dev

# Production build
npm run build     # tsc -b && vite build → dist/

# Deploy to Vercel
# 1. Connect MaverickDanielleAndres/M-Chat repo
# 2. Set Root Directory = app, Framework = Vite
# 3. Build Command = npm run build, Output = dist
# 4. Set env vars in Vercel → Settings → Environment Variables
# 5. Push to main → auto-deploys
```

See [VERCEL.md](VERCEL.md) for the full checklist and [supabase/migrations/](supabase/migrations/) for the schema migrations.

---

## What makes it different

Most AI chat wrappers ship a one-screen interface and call it done. M-Chat ships:

1. **A real product surface** — settings, accounts, billing, admin, marketing, docs
2. **DB-authoritative state** — quota, message counts, persona sync, all come from Postgres functions, not local state
3. **Multi-modal from day one** — images, PDFs, voice, image generation, web search, all routed through one composer
4. **Production-grade security** — RLS, JWT, server-side proxy for the AI key, defense-in-depth storage policies
5. **Performance that survives streaming** — rAF batching, selector-based Zustand, lazy admin chunks
6. **Mobile-first responsive** — overlays, drawer, safe-area insets, hidden sm:flex patterns, all the small things that make a chat app usable on a phone

The aim isn't to be a thinner or prettier shell on top of Gemini. The aim is to be a product you can actually run a business on.