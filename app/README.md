# M-Chat — Setup & Architecture Notes

A multi-modal AI workspace: chat, generate, analyze. Built with React 19, TypeScript, Tailwind, shadcn/ui, Supabase, and the Google Gemini API.

## Quick start

```bash
# 1. Configure env
cp .env.example .env  # then fill VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_GEMINI_API_KEY

# 2. Apply the database schema (see supabase/schema.sql and supabase/migrations/)
#    Either paste supabase/schema.sql in the Supabase SQL editor, or run:
#       npx supabase db push

# 3. Start dev
npm run dev

# 4. Build for production
npm run build
```

## Database

The schema lives at `supabase/migrations/20260714000000_initial_normalized_schema.sql`. It is **normalized, RLS-first, and append-only-friendly** — see the migration header for design notes.

### Tables (14)

| Table | Purpose |
| --- | --- |
| `user_profiles` | Identity, role, tier, last seen, onboarding flag |
| `folders` | User-defined groups of conversations |
| `conversations` | Chat threads (with title, model, system prompt, share slug, archived/pinned flags) |
| `messages` | Individual messages inside a conversation (role, status, tokens, latency, model) |
| `attachments` | Files uploaded per message, with extracted text and storage paths |
| `credit_wallets` | One wallet per user (balance, daily quota, lifetime counters) |
| `credit_transactions` | Append-only ledger of every credit movement |
| `subscription_plans` | Catalog of plans (Free, Personal, Pro, Premium) |
| `subscriptions` | Active user subscriptions with billing interval & period |
| `app_settings` | Per-user UI / personalization (theme, font, density, language, default model, custom instructions) |
| `usage_logs` | Append-only analytics of every AI call |
| `feature_flags` | Global toggles (image gen, voice, web search, etc.) |
| `tags` + `conversation_tags` | Free-form conversation tagging (many-to-many) |
| `audit_events` | Admin / security trail |

### Functions (3 security-definer RPCs)

- `spend_credits(user_id, amount, ...)` — atomic debit, raises `INSUFFICIENT_CREDITS` on failure
- `grant_credits(user_id, amount, type, ...)` — atomic credit issuance
- `touch_conversation(id)` — bumps `updated_at` and `last_active_at`

### Triggers

- `set_updated_at()` — keeps `updated_at` fresh on 9 tables
- `bump_conversation_on_message()` — auto-increments `message_count` and `last_active_at`
- `handle_new_user()` — on signup, creates `user_profiles`, `credit_wallets`, and `app_settings` rows

### Storage

- `attachments` bucket — private, keyed by `<user_id>/<timestamp>-<rand>.<ext>`
- `avatars` bucket — public reads, owner-only writes

## App architecture

```
src/
  lib/
    supabase.ts        # client (env-aware, runtime-typed)
    conversations.ts   # all DB queries + RPCs
  store/
    useStore.ts        # zustand store with Supabase sync, credits, persistence
  hooks/
    useSupabaseAuth.ts # session + profile
    useTheme.ts        # applies data-font-size / data-font-family / dark class
  pages/
    Home.tsx           # M-Chat landing — composer + 21 quick actions + logonobg
    ChatWorkspace.tsx  # sidebar + chat area + footer + modals
    LoginPage / SignupPage / ForgotPasswordPage / ResetPasswordPage
    UserDashboard.tsx  # account / plan / settings shortcut
    AdminDashboard.tsx # admin
  components/
    sidebar/Sidebar.tsx          # new chat, search, pinned, recents, menu, wallet, user
    chat/ChatArea.tsx            # header, messages, status, share
    chat/ChatInput.tsx           # composer, attachments, drag/drop, voice stub
    chat/ChatMessage.tsx         # bubble, actions, attachment chips
    chat/EmptyState.tsx          # 10 starter cards
    modals/SettingsModal.tsx     # 5 tabs: General / Appearance / Chat / Account / Data
    modals/LimitModal.tsx        # upgrade prompt
    ui/Footer.tsx                # contextual footer
    ui/ToastSystem.tsx           # toast queue
    ui/DeveloperPanel.tsx        # dev-mode overlay
```

## Features delivered

- **Sign up / log in** with email-password, magic-link, or Google OAuth
- **Conversations**: list, search, pin, rename (inline), duplicate, archive (stub), share link, delete (with confirm)
- **Messages**: streaming, copy / like / dislike / delete, auto-title on first exchange
- **File uploads**: drag/drop or button, image previews, 10MB cap, persisted to Supabase Storage + `attachments` table
- **Credit wallet**: `spend_credits` RPC atomic, free tier shows daily quota + balance
- **Settings**:
  - Theme: Light / Dark / System
  - Accent color (10 presets)
  - Font size (small / medium / large / XL)
  - Font family (sans / serif / mono)
  - Density (compact / comfortable / spacious)
  - Default model (gemini-2.0-flash / 1.5-pro / 1.5-flash)
  - Enter-to-send, stream responses, show token counts, developer mode
  - Custom instructions (per-user)
  - Language picker (10 languages)
  - Export / Import JSON, reset settings, reset everything (with confirm)
- **Responsive**: sidebar collapses to drawer on `<1024px`, mobile overlay, touch targets
- **Persistence**: zustand `persist` + Supabase row sync (best-effort, conflict-free merge)

## Environment variables

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_GEMINI_API_KEY=...
VITE_PORTFOLIO_URL=https://...
VITE_CONTACT_URL=https://...
```

## Migrations

The canonical migration is `supabase/migrations/20260714000000_initial_normalized_schema.sql`.
The mirror at `supabase/schema.sql` is convenient for a one-shot paste into the Supabase SQL editor.

Apply via Supabase CLI:

```bash
supabase link --project-ref <your-ref>
supabase db push
```