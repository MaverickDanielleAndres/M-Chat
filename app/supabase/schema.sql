-- M-Chat Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USER PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('guest', 'user', 'pro', 'premium', 'admin', 'developer')),
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'registered', 'pro', 'premium')),
  subscription_status TEXT CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'trialing', 'paused')),
  prompt_count INTEGER NOT NULL DEFAULT 0,
  daily_prompt_count INTEGER NOT NULL DEFAULT 0,
  daily_prompt_reset TIMESTAMPTZ DEFAULT NOW(),
  storage_used BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, display_name, role, subscription_tier)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'user',
    'free'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- CHATS
-- ============================================================
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  folder_id UUID,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own chats" ON chats
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all chats" ON chats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- CHAT MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'assistant' CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'complete' CHECK (status IN ('sending', 'streaming', 'complete', 'error')),
  liked BOOLEAN,
  attachments JSONB,
  tokens_used INTEGER,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own messages" ON chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM chats WHERE chats.id = chat_messages.chat_id AND chats.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- SUBSCRIPTION PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  max_prompts_daily INTEGER NOT NULL DEFAULT 20,
  max_storage_mb INTEGER NOT NULL DEFAULT 0,
  max_file_size_mb INTEGER NOT NULL DEFAULT 5,
  includes_image_gen BOOLEAN NOT NULL DEFAULT FALSE,
  includes_voice BOOLEAN NOT NULL DEFAULT FALSE,
  includes_api BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans" ON subscription_plans
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage plans" ON subscription_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing', 'paused')),
  billing_interval TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'yearly')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 month'),
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage subscriptions" ON subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- USAGE LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  chat_id UUID,
  message_id UUID,
  model TEXT NOT NULL DEFAULT 'qwen-max',
  tokens_input INTEGER NOT NULL DEFAULT 0,
  tokens_output INTEGER NOT NULL DEFAULT 0,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all usage" ON usage_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- FEATURE FLAGS
-- ============================================================
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view feature flags" ON feature_flags
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins can manage feature flags" ON feature_flags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at DESC);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Insert default subscription plans
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, features, max_prompts_daily, max_storage_mb, max_file_size_mb, includes_image_gen, includes_voice, includes_api, is_active)
VALUES
  ('Free', 'free', 'Perfect for trying out M-Chat', 0, 0, '["20 prompts per day","Basic AI chat","Local chat history","Text & code support","Community support"]'::jsonb, 20, 0, 5, false, false, false, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, features, max_prompts_daily, max_storage_mb, max_file_size_mb, includes_image_gen, includes_voice, includes_api, is_active)
VALUES
  ('Registered', 'registered', 'Sign up to get more', 0, 0, '["50 prompts per day","Cloud sync","Save conversations","Document upload","Image analysis","Email support"]'::jsonb, 50, 100, 10, false, false, false, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, features, max_prompts_daily, max_storage_mb, max_file_size_mb, includes_image_gen, includes_voice, includes_api, is_active)
VALUES
  ('Pro', 'pro', 'For power users', 9.99, 7.99, '["Unlimited prompts","Priority responses","Longer context window","Image generation","Voice conversations","Larger uploads (50MB)","Cloud storage (10GB)","Priority support"]'::jsonb, -1, 10240, 50, true, true, false, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, features, max_prompts_daily, max_storage_mb, max_file_size_mb, includes_image_gen, includes_voice, includes_api, is_active)
VALUES
  ('Premium', 'premium', 'For teams and businesses', 29.99, 24.99, '["Everything in Pro","Early access features","Advanced AI models","Unlimited storage","Projects & folders","Team workspace","API access","White-label options","Dedicated support"]'::jsonb, -1, -1, 100, true, true, true, true)
ON CONFLICT (slug) DO NOTHING;

-- Insert default feature flags
INSERT INTO feature_flags (key, enabled, description)
VALUES
  ('image_generation', false, 'Enable AI image generation feature'),
  ('voice_conversations', false, 'Enable voice input and output'),
  ('document_upload', true, 'Enable document upload and analysis'),
  ('code_interpreter', true, 'Enable code execution capabilities'),
  ('advanced_models', false, 'Enable access to advanced AI models'),
  ('team_workspace', false, 'Enable team collaboration features'),
  ('api_access', false, 'Enable API key generation and access'),
  ('web_search', false, 'Enable web search integration')
ON CONFLICT (key) DO NOTHING;
