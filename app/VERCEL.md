# Deploying M-Chat to Vercel

The app is a Vite SPA. The included `vercel.json` configures Vercel to:
- Run `npm run build` (which does `tsc -b && vite build`)
- Serve the `dist/` output
- Rewrite every route to `/index.html` so client-side routing works on direct loads (e.g. `/chat`, `/dashboard`)
- Set sensible security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`)
- Cache hashed assets for one year (Vite already emits content-hashed filenames)

## Required environment variables

Set these in **Vercel → Project Settings → Environment Variables**. The
client builds at deploy time, so values are baked into the bundle —
do NOT commit production keys.

| Variable | Required | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | yes | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | yes | Supabase anon key (JWT) — safe to ship in browser |
| `VITE_GEMINI_API_KEY` | optional | If unset, app falls back to demo mode. Domain-restrict the key in Google AI Studio. |
| `VITE_GEMINI_API_KEYS` | optional | Comma-separated rotation pool |
| `VITE_GEMINI_MODEL` | optional | Defaults to `gemini-2.5-flash` |
| `VITE_GEMINI_PROXY_URL` | optional | Server-side proxy URL (recommended — see SECURITY.md) |
| `VITE_PORTFOLIO_URL` | optional | Shown in the limit modal |
| `VITE_CONTACT_URL` | optional | Shown in the limit modal |

## Build settings

- **Framework preset:** Vite (auto-detected from `vite.config.ts`)
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Install command:** `npm install`

These match the `vercel.json` defaults, so no override is required.

## Supabase setup checklist

Before deploying, make sure the Supabase project has:

1. The schema from `supabase/migrations/` applied (run them in SQL editor
   or via `supabase db push` from the CLI).
2. Google OAuth enabled under **Authentication → Providers** (if you
   want Google sign-in). Set the redirect URL to
   `https://<your-vercel-domain>/` so it lands back on the app.
3. Storage buckets `attachments` (private) and `avatars` (public).
4. The `gemini-proxy` edge function deployed, if you opted for it:
   ```bash
   supabase functions deploy gemini-proxy
   supabase secrets set GEMINI_API_KEY=...
   ```

## Deploying

1. Push to `main` (or whichever branch Vercel watches).
2. Vercel auto-detects the Vite framework, runs `npm run build`, and
   deploys `dist/`.
3. Verify with `vercel --prod` locally first if you want a dry-run.

## SPA routing caveat

The app uses `HashRouter` (URLs like `/chat#/c=…`), so deep-linking works
without server-side rewrites. The `rewrites` rule in `vercel.json` is
defense-in-depth — it lets non-hash URLs like `/chat` still resolve
correctly if you ever switch to `BrowserRouter`.

## Common issues

- **"supabase_url is required"**: missing `VITE_SUPABASE_URL`. Vite needs
  it at build time, not runtime, so a redeploy after adding the env var
  is required.
- **OAuth callback goes to a 404**: add your Vercel domain to the
  Supabase Auth → URL Configuration allowlist (both the bare domain and
  any preview URLs).
- **"Failed to fetch" on sendMessage**: the Gemini key is invalid /
  domain-restricted, or the `VITE_GEMINI_PROXY_URL` is wrong. Check the
  browser console and the proxy's logs.