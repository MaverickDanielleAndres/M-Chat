-- ============================================================
-- M-Chat Normalized & Scalable Schema
-- Migration: 20260714000000_initial_normalized_schema.sql
-- ============================================================
-- Design goals:
--   1. Fully normalized — every business concept lives in its own table.
--   2. Scalable — composite & partial indexes for hot paths; JSONB only where
--      shape is truly opaque (settings, AI metadata).
--   3. RLS-first — every user-owned table has explicit policies.
--   4. Auditable — append-only tables (credit_transactions, usage_logs,
--      audit_events) capture every state change.
--   5. Idempotent — safe to re-run.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('guest','user','pro','premium','admin','developer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM ('free','registered','pro','premium');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('trialing','active','past_due','paused','cancelled','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE billing_interval AS ENUM ('monthly','yearly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE message_role AS ENUM ('user','assistant','system','tool');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE message_status AS ENUM ('sending','streaming','complete','error','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE attachment_kind AS ENUM ('image','video','audio','document','code','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE credit_txn_type AS ENUM ('grant','purchase','spend','refund','adjust','reset','bonus','expiry');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE theme_mode AS ENUM ('light','dark','system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE font_size_pref AS ENUM ('small','medium','large','xl');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- USER PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                CITEXT, -- extended in a separate migration; keep as text here
  display_name         TEXT,
  username             TEXT UNIQUE,
  avatar_url           TEXT,
  bio                  TEXT,
  role                 user_role NOT NULL DEFAULT 'user',
  subscription_tier    subscription_tier NOT NULL DEFAULT 'free',
  subscription_status  subscription_status,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen_at         TIMESTAMPTZ,
  metadata             JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- email kept as text since citext extension isn't always enabled
ALTER TABLE public.user_profiles
  ALTER COLUMN email TYPE TEXT USING email::text;

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier ON public.user_profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles(created_at DESC);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_user_profiles_select_own ON public.user_profiles;
CREATE POLICY p_user_profiles_select_own ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS p_user_profiles_update_own ON public.user_profiles;
CREATE POLICY p_user_profiles_update_own ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.user_profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS p_user_profiles_select_admin ON public.user_profiles;
CREATE POLICY p_user_profiles_select_admin ON public.user_profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.role IN ('admin','developer'))
  );

DROP POLICY IF EXISTS p_user_profiles_update_admin ON public.user_profiles;
CREATE POLICY p_user_profiles_update_admin ON public.user_profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.role IN ('admin','developer'))
  );

-- ============================================================
-- FOLDERS — user-defined groups for conversations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.folders (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  color       TEXT,
  icon        TEXT,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders(user_id, position);

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_folders_owner_all ON public.folders;
CREATE POLICY p_folders_owner_all ON public.folders
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE, -- nullable for guest local
  folder_id   UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  title       TEXT NOT NULL DEFAULT 'New Conversation',
  system_prompt TEXT,
  model       TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
  temperature NUMERIC(3,2) NOT NULL DEFAULT 0.7,
  pinned      BOOLEAN NOT NULL DEFAULT FALSE,
  archived    BOOLEAN NOT NULL DEFAULT FALSE,
  is_shared   BOOLEAN NOT NULL DEFAULT FALSE,
  share_slug  TEXT UNIQUE,
  message_count INTEGER NOT NULL DEFAULT 0,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_updated
  ON public.conversations(user_id, updated_at DESC)
  WHERE archived = FALSE;

CREATE INDEX IF NOT EXISTS idx_conversations_user_pinned
  ON public.conversations(user_id, pinned, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_folder
  ON public.conversations(folder_id) WHERE folder_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_share_slug
  ON public.conversations(share_slug) WHERE share_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_last_active
  ON public.conversations(last_active_at DESC);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_conversations_owner_all ON public.conversations;
CREATE POLICY p_conversations_owner_all ON public.conversations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS p_conversations_select_shared ON public.conversations;
CREATE POLICY p_conversations_select_shared ON public.conversations
  FOR SELECT USING (is_shared = TRUE);

DROP POLICY IF EXISTS p_conversations_admin_all ON public.conversations;
CREATE POLICY p_conversations_admin_all ON public.conversations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.role IN ('admin','developer'))
  );

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  parent_id    UUID REFERENCES public.messages(id) ON DELETE SET NULL, -- thread support
  role         message_role NOT NULL,
  content      TEXT NOT NULL DEFAULT '',
  status       message_status NOT NULL DEFAULT 'complete',
  liked        BOOLEAN,
  disliked     BOOLEAN NOT NULL DEFAULT FALSE,
  tokens_input INTEGER NOT NULL DEFAULT 0,
  tokens_output INTEGER NOT NULL DEFAULT 0,
  latency_ms   INTEGER NOT NULL DEFAULT 0,
  model        TEXT,
  finish_reason TEXT,
  metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,
  edited       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON public.messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_status
  ON public.messages(conversation_id, status) WHERE status <> 'complete';

CREATE INDEX IF NOT EXISTS idx_messages_role ON public.messages(role);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_messages_via_conversation ON public.messages;
CREATE POLICY p_messages_via_conversation ON public.messages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND c.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND c.user_id = auth.uid())
  );

DROP POLICY IF EXISTS p_messages_select_shared_conversation ON public.messages;
CREATE POLICY p_messages_select_shared_conversation ON public.messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND c.is_shared = TRUE)
  );

DROP POLICY IF EXISTS p_messages_admin_all ON public.messages;
CREATE POLICY p_messages_admin_all ON public.messages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.role IN ('admin','developer'))
  );

-- ============================================================
-- ATTACHMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.attachments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id    UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  kind          attachment_kind NOT NULL DEFAULT 'other',
  file_name     TEXT NOT NULL,
  mime_type     TEXT NOT NULL,
  size_bytes    BIGINT NOT NULL DEFAULT 0,
  storage_path  TEXT NOT NULL,        -- path inside Supabase storage
  public_url    TEXT,
  thumbnail_url TEXT,
  width         INTEGER,
  height        INTEGER,
  duration_ms   INTEGER,              -- for audio/video
  extracted_text TEXT,                -- OCR/PDF text content
  metadata      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON public.attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_attachments_user_id ON public.attachments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attachments_kind ON public.attachments(kind);

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_attachments_owner_all ON public.attachments;
CREATE POLICY p_attachments_owner_all ON public.attachments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS p_attachments_select_shared ON public.attachments;
CREATE POLICY p_attachments_select_shared ON public.attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE m.id = attachments.message_id AND c.is_shared = TRUE
    )
  );

-- ============================================================
-- CREDIT WALLETS — one per user (1:1 with user)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.credit_wallets (
  user_id           UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  balance           INTEGER NOT NULL DEFAULT 0,
  lifetime_granted  INTEGER NOT NULL DEFAULT 0,
  lifetime_spent    INTEGER NOT NULL DEFAULT 0,
  daily_quota       INTEGER NOT NULL DEFAULT 20,
  daily_used        INTEGER NOT NULL DEFAULT 0,
  daily_reset_at    TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 day'),
  last_grant_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.credit_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_credit_wallets_select_own ON public.credit_wallets;
CREATE POLICY p_credit_wallets_select_own ON public.credit_wallets
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- CREDIT TRANSACTIONS — append-only ledger
-- ============================================================
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL,           -- +credit, -debit
  type        credit_txn_type NOT NULL,
  description TEXT,
  reference_id UUID,                      -- optional link to message / order
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_txn_user_created
  ON public.credit_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_txn_type
  ON public.credit_transactions(type);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_credit_txn_select_own ON public.credit_transactions;
CREATE POLICY p_credit_txn_select_own ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Inserts happen via service-role only (security definer fns below)

-- ============================================================
-- SUBSCRIPTION PLANS — catalog
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug                 TEXT NOT NULL UNIQUE,
  name                 TEXT NOT NULL,
  description          TEXT,
  tagline               TEXT,
  price_monthly        NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_yearly         NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency             TEXT NOT NULL DEFAULT 'USD',
  features             JSONB NOT NULL DEFAULT '[]'::jsonb,
  max_prompts_daily    INTEGER NOT NULL DEFAULT 20,  -- -1 = unlimited
  max_storage_mb       INTEGER NOT NULL DEFAULT 0,
  max_file_size_mb     INTEGER NOT NULL DEFAULT 5,
  max_conversations    INTEGER NOT NULL DEFAULT -1,
  monthly_credits      INTEGER NOT NULL DEFAULT 0,
  includes_image_gen   BOOLEAN NOT NULL DEFAULT FALSE,
  includes_voice       BOOLEAN NOT NULL DEFAULT FALSE,
  includes_api         BOOLEAN NOT NULL DEFAULT FALSE,
  includes_web_search  BOOLEAN NOT NULL DEFAULT FALSE,
  includes_custom_gpts BOOLEAN NOT NULL DEFAULT FALSE,
  priority_level       INTEGER NOT NULL DEFAULT 0,
  highlight            BOOLEAN NOT NULL DEFAULT FALSE,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order           INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_active_sort
  ON public.subscription_plans(is_active, sort_order);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_plans_select_active ON public.subscription_plans;
CREATE POLICY p_plans_select_active ON public.subscription_plans
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS p_plans_admin_all ON public.subscription_plans;
CREATE POLICY p_plans_admin_all ON public.subscription_plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.role IN ('admin','developer'))
  );

-- ============================================================
-- SUBSCRIPTIONS — user subscriptions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  plan_id              UUID NOT NULL REFERENCES public.subscription_plans(id),
  status               subscription_status NOT NULL DEFAULT 'active',
  billing_interval     billing_interval NOT NULL DEFAULT 'monthly',
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end   TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
  trial_ends_at        TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  cancelled_at         TIMESTAMPTZ,
  payment_provider     TEXT,                       -- 'stripe', 'lemonsqueezy', etc.
  external_id          TEXT,
  metadata             JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
  ON public.subscriptions(user_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS uq_subscriptions_active_per_user
  ON public.subscriptions(user_id) WHERE status IN ('active','trialing');

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_subscriptions_select_own ON public.subscriptions;
CREATE POLICY p_subscriptions_select_own ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS p_subscriptions_admin_all ON public.subscriptions;
CREATE POLICY p_subscriptions_admin_all ON public.subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.role IN ('admin','developer'))
  );

-- ============================================================
-- APP SETTINGS — per-user UI / personalization
-- ============================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  user_id              UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  theme                theme_mode NOT NULL DEFAULT 'system',
  accent_color         TEXT NOT NULL DEFAULT '#6366f1',
  font_size            font_size_pref NOT NULL DEFAULT 'medium',
  font_family          TEXT NOT NULL DEFAULT 'sans',
  density              TEXT NOT NULL DEFAULT 'comfortable', -- compact|comfortable|spacious
  language             TEXT NOT NULL DEFAULT 'en',
  animations_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
  sound_enabled        BOOLEAN NOT NULL DEFAULT TRUE,
  enter_to_send        BOOLEAN NOT NULL DEFAULT TRUE,
  stream_responses     BOOLEAN NOT NULL DEFAULT TRUE,
  show_token_counts    BOOLEAN NOT NULL DEFAULT FALSE,
  developer_mode       BOOLEAN NOT NULL DEFAULT FALSE,
  default_model        TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
  custom_instructions  TEXT,
  shortcuts            JSONB NOT NULL DEFAULT '{}'::jsonb,
  privacy              JSONB NOT NULL DEFAULT '{}'::jsonb,
  notifications        JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_app_settings_owner_all ON public.app_settings;
CREATE POLICY p_app_settings_owner_all ON public.app_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- USAGE LOGS — analytics / cost tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  message_id      UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  model           TEXT NOT NULL,
  feature         TEXT NOT NULL DEFAULT 'chat',
  tokens_input    INTEGER NOT NULL DEFAULT 0,
  tokens_output   INTEGER NOT NULL DEFAULT 0,
  credits_used    INTEGER NOT NULL DEFAULT 0,
  latency_ms      INTEGER NOT NULL DEFAULT 0,
  success         BOOLEAN NOT NULL DEFAULT TRUE,
  error_code      TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_created
  ON public.usage_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_logs_conversation
  ON public.usage_logs(conversation_id) WHERE conversation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_usage_logs_model_created
  ON public.usage_logs(model, created_at DESC);

ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_usage_logs_select_own ON public.usage_logs;
CREATE POLICY p_usage_logs_select_own ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- FEATURE FLAGS — global toggles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key         TEXT PRIMARY KEY,
  enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_feature_flags_select_all ON public.feature_flags;
CREATE POLICY p_feature_flags_select_all ON public.feature_flags
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS p_feature_flags_admin_all ON public.feature_flags;
CREATE POLICY p_feature_flags_admin_all ON public.feature_flags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.role IN ('admin','developer'))
  );

-- ============================================================
-- TAGS — free-form conversation tagging
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tags (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_tags_user ON public.tags(user_id);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_tags_owner_all ON public.tags;
CREATE POLICY p_tags_owner_all ON public.tags
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.conversation_tags (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  tag_id          UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_tags_tag ON public.conversation_tags(tag_id);

ALTER TABLE public.conversation_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_conversation_tags_owner_all ON public.conversation_tags;
CREATE POLICY p_conversation_tags_owner_all ON public.conversation_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_tags.conversation_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_tags.conversation_id AND c.user_id = auth.uid()
    )
  );

-- ============================================================
-- AUDIT EVENTS — security / admin trail
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_events (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id   UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  entity     TEXT NOT NULL,
  entity_id  UUID,
  payload    JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_actor_created
  ON public.audit_events(actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_events_entity
  ON public.audit_events(entity, entity_id);

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_audit_events_admin_select ON public.audit_events;
CREATE POLICY p_audit_events_admin_select ON public.audit_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_profiles up WHERE up.id = auth.uid() AND up.role IN ('admin','developer'))
  );

-- ============================================================
-- TRIGGERS — updated_at maintenance
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'user_profiles','folders','conversations','messages',
      'credit_wallets','subscription_plans','subscriptions',
      'app_settings','feature_flags'
    ])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON public.%I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t, t);
  END LOOP;
END $$;

-- ============================================================
-- TRIGGER — increment message_count + bump last_active_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.bump_conversation_on_message() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.conversations
       SET message_count = message_count + 1,
           last_active_at = NOW(),
           updated_at = NOW()
     WHERE id = NEW.conversation_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.conversations
       SET message_count = GREATEST(message_count - 1, 0),
           updated_at = NOW()
     WHERE id = OLD.conversation_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_bump_conversation_on_message ON public.messages;
CREATE TRIGGER trg_bump_conversation_on_message
  AFTER INSERT OR DELETE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_conversation_on_message();

-- ============================================================
-- TRIGGER — new auth user → profile + wallet + settings
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name, username, role, subscription_tier)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || SUBSTRING(NEW.id::text, 1, 8),
    'user',
    'registered'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.credit_wallets (user_id, balance, lifetime_granted, daily_quota, daily_used)
  VALUES (NEW.id, 50, 50, 50, 0)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.app_settings (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SECURITY DEFINER — spend credits atomically
-- ============================================================
CREATE OR REPLACE FUNCTION public.spend_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_description TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS INTEGER AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  IF p_amount <= 0 THEN
    RETURN (SELECT balance FROM public.credit_wallets WHERE user_id = p_user_id);
  END IF;

  -- Reset daily quota if expired
  UPDATE public.credit_wallets
     SET daily_used = 0,
         daily_reset_at = NOW() + INTERVAL '1 day'
   WHERE user_id = p_user_id
     AND daily_reset_at < NOW();

  -- Try to debit; balance is only checked if user has no unlimited tier
  UPDATE public.credit_wallets
     SET balance = balance - p_amount,
         daily_used = daily_used + p_amount,
         lifetime_spent = lifetime_spent + p_amount,
         updated_at = NOW()
   WHERE user_id = p_user_id
     AND (balance >= p_amount OR EXISTS (
       SELECT 1 FROM public.user_profiles up
        WHERE up.id = p_user_id
          AND up.subscription_tier IN ('pro','premium','admin','developer')
     ))
  RETURNING balance INTO v_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
  END IF;

  INSERT INTO public.credit_transactions (user_id, amount, type, description, reference_id, metadata)
  VALUES (p_user_id, -p_amount, 'spend', p_description, p_reference_id, p_metadata);

  RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SECURITY DEFINER — grant credits
-- ============================================================
CREATE OR REPLACE FUNCTION public.grant_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type credit_txn_type DEFAULT 'grant',
  p_description TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS INTEGER AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  INSERT INTO public.credit_wallets (user_id, balance, lifetime_granted, last_grant_at)
  VALUES (p_user_id, p_amount, p_amount, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET balance = public.credit_wallets.balance + p_amount,
        lifetime_granted = public.credit_wallets.lifetime_granted + p_amount,
        last_grant_at = NOW(),
        updated_at = NOW()
  RETURNING balance INTO v_balance;

  INSERT INTO public.credit_transactions (user_id, amount, type, description, reference_id, metadata)
  VALUES (p_user_id, p_amount, p_type, p_description, p_reference_id, p_metadata);

  RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SECURITY DEFINER — auto-title generation helper
-- ============================================================
CREATE OR REPLACE FUNCTION public.touch_conversation(p_conversation_id UUID) RETURNS VOID AS $$
BEGIN
  UPDATE public.conversations
     SET updated_at = NOW(),
         last_active_at = NOW()
   WHERE id = p_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- check_user_can_prompt(p_user_id)
--   Returns whether the user can send a prompt right now.
--   Used by the frontend BEFORE every sendMessage to gate the
--   action at the database level so the client cannot bypass it.
--
--   Result columns:
--     can_send       BOOLEAN  - true if user may send a prompt
--     reason         TEXT     - 'ok' | 'quota_exhausted' | 'no_credits' | 'unlimited'
--     tier           TEXT     - subscription tier
--     daily_used     INTEGER  - prompts used today
--     daily_quota    INTEGER  - max prompts per day (-1 = unlimited)
--     balance        INTEGER  - wallet balance (only consulted on paid tiers)
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_user_can_prompt(p_user_id UUID)
RETURNS TABLE (
  can_send BOOLEAN,
  reason TEXT,
  tier TEXT,
  daily_used INTEGER,
  daily_quota INTEGER,
  balance INTEGER
) AS $$
DECLARE
  v_tier subscription_tier;
  v_daily_used INTEGER;
  v_daily_quota INTEGER;
  v_balance INTEGER;
BEGIN
  -- Profile lookup (defaults to free when missing)
  SELECT COALESCE(subscription_tier, 'free'::subscription_tier)
    INTO v_tier
    FROM public.user_profiles
   WHERE id = p_user_id;

  IF v_tier IS NULL THEN
    v_tier := 'free'::subscription_tier;
  END IF;

  -- Unlimited tiers bypass quota entirely
  IF v_tier IN ('pro'::subscription_tier, 'premium'::subscription_tier, 'admin'::subscription_tier, 'developer'::subscription_tier) THEN
    RETURN QUERY SELECT TRUE, 'unlimited'::TEXT, v_tier::TEXT, 0, -1, 0;
    RETURN;
  END IF;

  -- Wallet lookup + daily reset
  SELECT cw.daily_used, cw.daily_quota, cw.balance
    INTO v_daily_used, v_daily_quota, v_balance
    FROM public.credit_wallets cw
   WHERE cw.user_id = p_user_id;

  IF v_daily_quota IS NULL THEN
    v_daily_quota := 20;
  END IF;
  IF v_daily_used IS NULL THEN
    v_daily_used := 0;
  END IF;
  IF v_balance IS NULL THEN
    v_balance := 0;
  END IF;

  -- Reset daily counter if expired
  UPDATE public.credit_wallets
     SET daily_used = 0,
         daily_reset_at = NOW() + INTERVAL '1 day'
   WHERE user_id = p_user_id
     AND daily_reset_at < NOW()
  RETURNING daily_used INTO v_daily_used;

  -- Check daily quota
  IF v_daily_quota <> -1 AND v_daily_used >= v_daily_quota THEN
    RETURN QUERY SELECT FALSE, 'quota_exhausted'::TEXT, v_tier::TEXT,
                         v_daily_used, v_daily_quota, v_balance;
    RETURN;
  END IF;

  -- Free-tier fallback: balance must be positive
  IF v_balance <= 0 THEN
    RETURN QUERY SELECT FALSE, 'no_credits'::TEXT, v_tier::TEXT,
                         v_daily_used, v_daily_quota, v_balance;
    RETURN;
  END IF;

  RETURN QUERY SELECT TRUE, 'ok'::TEXT, v_tier::TEXT,
                       v_daily_used, v_daily_quota, v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- record_prompt_usage(p_user_id, p_amount, p_metadata)
--   Atomically increments daily_used (and decrements balance if p_amount > 0).
--   Raises QUOTA_EXHAUSTED or INSUFFICIENT_CREDITS if the user has no headroom.
--   This is the authoritative write-side of the prompt counter.
-- ============================================================
CREATE OR REPLACE FUNCTION public.record_prompt_usage(
  p_user_id UUID,
  p_amount INTEGER DEFAULT 1,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS TABLE (new_daily_used INTEGER, new_balance INTEGER) AS $$
DECLARE
  v_can BOOLEAN;
  v_reason TEXT;
  v_tier TEXT;
  v_daily_used INTEGER;
  v_daily_quota INTEGER;
  v_balance INTEGER;
BEGIN
  -- Pre-flight via check_user_can_prompt
  SELECT * INTO v_can, v_reason, v_tier, v_daily_used, v_daily_quota, v_balance
    FROM public.check_user_can_prompt(p_user_id)
   LIMIT 1;

  IF NOT v_can THEN
    IF v_reason = 'quota_exhausted' THEN
      RAISE EXCEPTION 'QUOTA_EXHAUSTED';
    ELSE
      RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
    END IF;
  END IF;

  -- Increment daily_used (always)
  -- Decrement balance only when user is on a metered (non-unlimited, non-quota-only) tier
  -- For free users balance never goes negative.
  UPDATE public.credit_wallets
     SET daily_used = daily_used + 1,
         lifetime_spent = lifetime_spent + GREATEST(p_amount, 0),
         balance = CASE
           WHEN v_tier IN ('pro'::subscription_tier, 'premium'::subscription_tier,
                           'admin'::subscription_tier, 'developer'::subscription_tier)
             THEN GREATEST(0, balance - GREATEST(p_amount, 0))
           ELSE GREATEST(0, balance - 0)  -- free: balance untouched by daily prompts
         END,
         updated_at = NOW()
   WHERE user_id = p_user_id
  RETURNING daily_used, balance INTO v_daily_used, v_balance;

  -- Log it
  INSERT INTO public.credit_transactions (user_id, amount, type, description, metadata)
  VALUES (
    p_user_id,
    -GREATEST(p_amount, 0),
    'spend',
    'Chat prompt',
    p_metadata
  );

  RETURN QUERY SELECT v_daily_used, v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.check_user_can_prompt(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_prompt_usage(UUID, INTEGER, JSONB) TO authenticated;

-- ============================================================
-- STORAGE BUCKETS (idempotent)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('attachments', 'attachments', FALSE),
  ('avatars', 'avatars', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: a user can manage their own files under attachments/
DROP POLICY IF EXISTS "attachments_owner_all" ON storage.objects;
CREATE POLICY "attachments_owner_all" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_read_all" ON storage.objects;
CREATE POLICY "avatars_read_all" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_owner_write" ON storage.objects;
CREATE POLICY "avatars_owner_write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
CREATE POLICY "avatars_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- SEED DATA — subscription plans
-- ============================================================
INSERT INTO public.subscription_plans (
  slug, name, description, tagline, price_monthly, price_yearly, currency, features,
  max_prompts_daily, max_storage_mb, max_file_size_mb, max_conversations, monthly_credits,
  includes_image_gen, includes_voice, includes_api, includes_web_search, includes_custom_gpts,
  priority_level, highlight, is_active, sort_order
) VALUES
  (
    'free', 'Free', 'Try M-Chat at no cost', 'Get started in seconds',
    0, 0, 'USD',
    '["10 prompts per day","Basic AI chat","Local chat history","Text & code support","Community support"]'::jsonb,
    10, 0, 5, 50, 0,
    FALSE, FALSE, FALSE, FALSE, FALSE,
    0, FALSE, TRUE, 0
  ),
  (
    'registered', 'Personal', 'For everyday productivity', 'Cloud sync + more prompts',
    0, 0, 'USD',
    '["50 prompts per day","Cloud sync across devices","Save unlimited conversations","Document upload (10MB)","Image analysis","Email support"]'::jsonb,
    50, 100, 10, -1, 50,
    FALSE, FALSE, FALSE, FALSE, FALSE,
    1, FALSE, TRUE, 1
  ),
  (
    'pro', 'Pro', 'For power users and creators', 'Unlimited prompts + GPTs',
    19, 190, 'USD',
    '["Unlimited prompts","Priority responses","Longer context window","Image generation","Voice conversations","Larger uploads (50MB)","Cloud storage (10GB)","Custom GPTs","Priority support"]'::jsonb,
    -1, 10240, 50, -1, 2000,
    TRUE, TRUE, FALSE, TRUE, TRUE,
    2, TRUE, TRUE, 2
  ),
  (
    'premium', 'Premium', 'For teams and businesses', 'Everything in Pro + API',
    49, 490, 'USD',
    '["Everything in Pro","Early access features","Advanced AI models","Unlimited storage","Projects & folders","Team workspace","API access","White-label options","Dedicated support"]'::jsonb,
    -1, -1, 100, -1, 10000,
    TRUE, TRUE, TRUE, TRUE, TRUE,
    3, FALSE, TRUE, 3
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  tagline = EXCLUDED.tagline,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  max_prompts_daily = EXCLUDED.max_prompts_daily,
  max_storage_mb = EXCLUDED.max_storage_mb,
  max_file_size_mb = EXCLUDED.max_file_size_mb,
  max_conversations = EXCLUDED.max_conversations,
  monthly_credits = EXCLUDED.monthly_credits,
  includes_image_gen = EXCLUDED.includes_image_gen,
  includes_voice = EXCLUDED.includes_voice,
  includes_api = EXCLUDED.includes_api,
  includes_web_search = EXCLUDED.includes_web_search,
  includes_custom_gpts = EXCLUDED.includes_custom_gpts,
  priority_level = EXCLUDED.priority_level,
  highlight = EXCLUDED.highlight,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- ============================================================
-- SEED DATA — feature flags
-- ============================================================
INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('image_generation',       FALSE, 'Enable AI image generation'),
  ('voice_conversations',    FALSE, 'Enable voice input and output'),
  ('document_upload',        TRUE,  'Enable document upload and analysis'),
  ('code_interpreter',       TRUE,  'Enable code execution capabilities'),
  ('advanced_models',        FALSE, 'Enable access to advanced AI models'),
  ('team_workspace',         FALSE, 'Enable team collaboration'),
  ('api_access',             FALSE, 'Enable API key generation'),
  ('web_search',             TRUE,  'Enable web search integration'),
  ('shared_conversations',   TRUE,  'Allow sharing conversation links'),
  ('custom_instructions',    TRUE,  'Allow per-user custom instructions'),
  ('memory_workspace',       TRUE,  'Allow long-term memory'),
  ('data_export',            TRUE,  'Allow user data export')
ON CONFLICT (key) DO UPDATE SET
  enabled = EXCLUDED.enabled,
  description = EXCLUDED.description,
  updated_at = NOW();