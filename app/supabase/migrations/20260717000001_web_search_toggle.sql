-- ============================================================
-- M-Chat Web Search Toggle
-- Migration: 20260717000001_web_search_toggle.sql
-- ============================================================
-- Adds a per-user web_search_enabled flag on app_settings so the
-- chat composer can toggle Gemini grounding on/off and persist
-- that preference. Idempotent — safe to re-run.
-- ============================================================

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS web_search_enabled BOOLEAN NOT NULL DEFAULT FALSE;