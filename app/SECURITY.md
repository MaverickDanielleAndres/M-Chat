# Security Notes — M-Chat

This document tracks the security model of M-Chat and the protections
in place as of the current release.

## Authentication & Authorization

- All Supabase tables use **Row-Level Security (RLS)** with explicit policies.
- `user_profiles`, `conversations`, `messages`, `attachments`, `app_settings`,
  `credit_wallets`, `credit_transactions`, `folders`, `tags`, etc. are
  scoped to `auth.uid() = user_id` (or via conversation ownership for
  messages/attachments).
- Admin/developer overrides exist only for entities that genuinely need
  cross-user access (audit_events, subscription_plans).

## Spending & Quota Enforcement

- `record_prompt_usage(p_user_id, p_amount)` is a SECURITY DEFINER function
  that atomically increments `credit_wallets.daily_used` and (for paid
  tiers) decrements `balance`. It raises `QUOTA_EXHAUSTED` or
  `INSUFFICIENT_CREDITS` when the user can't prompt.
- `check_user_can_prompt(p_user_id)` is the pre-flight gate the client
  calls before sending a message.
- The client UI cannot bypass these — even if the JS bundle is tampered
  with, the DB-authoritative check will reject overspends.

## API Key Handling

`VITE_GEMINI_API_KEY` (and `VITE_GEMINI_API_KEYS`) ship in the browser
bundle when present. Vite's `VITE_*` prefix means the variable is **always
embedded in client JS**, where it is publicly extractable. To mitigate:

1. **Use a domain-restricted key** in Google AI Studio so abuse is limited
   to your deployment's origin.
2. **Recommended**: deploy the included `supabase/functions/gemini-proxy`
   edge function and set `VITE_GEMINI_PROXY_URL` in `.env.local`. The
   proxy holds the key as a server-side secret and requires a valid
   Supabase JWT, so anonymous browsers can never read the key.

   ```bash
   supabase functions deploy gemini-proxy
   supabase secrets set GEMINI_API_KEY=...
   # then in .env.local:
   # VITE_GEMINI_PROXY_URL=https://<project>.supabase.co/functions/v1/gemini-proxy
   ```

3. **Never** commit `.env.local` or production keys to git. The repo's
   `.env.example` documents expected keys without including values.

## Storage

- `attachments` bucket: private; only the owning user (via the first
  folder segment of the storage path) can read/write.
- `avatars` bucket: public read, owner-only write.
- `attachments_owner_via_message` defense-in-depth policy in
  `20260717000000_phase2_hardening.sql` re-validates ownership against the
  messages → conversations chain.

## Client-Side Storage

- Zustand persists `conversations`, `activeConversationId`, `promptCount`,
  `settings`, `sidebarOpen`, `userId`, `isAuthed`, `wallet` to
  `localStorage` (key `m-chat-storage-v2`).
- This includes `userId` for UX (skip the bootstrap query) — *no tokens
  or secrets are persisted*. Supabase Auth tokens live in their own
  storage key (`m-chat-auth`) managed by `@supabase/supabase-js`.

## Markdown / User-Supplied Content

- The chat renderer uses `react-markdown` with no `rehype-raw`, so HTML
  in model output is rendered as text by default.
- Anchors always get `rel="noopener noreferrer"` and `target="_blank"`.
- The only `dangerouslySetInnerHTML` in the app is in
  `components/ui/chart.tsx` and is fed a *static* object literal of CSS
  variables — no user input.

## Known Limitations / Follow-ups

- Rate-limiting is per-tab today. The proxy (when deployed) provides
  server-side rate limiting and per-user quotas, which is the recommended
  path for production.
- `daily_used` is a denormalized counter; concurrent updates from
  multiple tabs are reconciled by Postgres's row-level locking inside
  `record_prompt_usage`. No client-side coalescing is needed.
- The free tier allows 20 prompts/day locally even when offline; the
  DB-authoritative check is only consulted when `userId` is set.
  Anonymous abuse is bounded by Gemini's per-key quota.