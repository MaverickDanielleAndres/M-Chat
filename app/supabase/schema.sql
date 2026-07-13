-- ============================================================
-- M-Chat Normalized & Scalable Schema
-- ============================================================
-- The canonical schema lives in supabase/migrations/.
-- This file mirrors that migration for one-shot execution.
-- Run this in Supabase SQL Editor if you don't want to use the CLI.
--
-- Design goals:
--   1. Fully normalized — every business concept lives in its own table.
--   2. Scalable — composite & partial indexes for hot paths; JSONB only where
--      shape is truly opaque (settings, AI metadata).
--   3. RLS-first — every user-owned table has explicit policies.
--   4. Auditable — append-only tables (credit_transactions, usage_logs,
--      audit_events) capture every state change.
-- ============================================================

\i supabase/migrations/20260714000000_initial_normalized_schema.sql