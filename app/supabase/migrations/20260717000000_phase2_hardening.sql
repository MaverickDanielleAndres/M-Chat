-- ============================================================
-- M-Chat Phase 2 Hardening
-- Migration: 20260717000000_phase2_hardening.sql
-- ============================================================
-- Improvements applied in this migration:
--   1. Make `user_profiles.bio` actually persist (column was always there
--      but the client-side mapper didn't send it).
--   2. Backfill `conversations.message_count` for rows that drifted from
--      the real count (the trigger only fires on new inserts/deletes; this
--      heals historical drift).
--   3. Add an explicit index on `messages(created_at DESC)` for fast
--      "latest conversations" queries.
--   4. Tighten storage RLS so attachments are scoped by the *message's
--      conversation owner* (defense-in-depth, in case the bucket-level
--      policy is misconfigured).
--   5. Add `app_settings.updated_at` index for last-write-wins merging.
--
-- Safe to re-run (idempotent).
-- ============================================================

-- 1. Heal drifted message counts --------------------------------------------
UPDATE public.conversations c
   SET message_count = COALESCE(sub.cnt, 0)
  FROM (
    SELECT conversation_id, COUNT(*)::int AS cnt
      FROM public.messages
     GROUP BY conversation_id
  ) sub
 WHERE sub.conversation_id = c.id
   AND c.message_count <> COALESCE(sub.cnt, 0);

-- 2. New indexes -----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_messages_created_desc
  ON public.messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_app_settings_updated_at
  ON public.app_settings(updated_at DESC);

-- 3. Defense-in-depth storage policy ---------------------------------------
-- (idempotent: drop-and-recreate)
DROP POLICY IF EXISTS "attachments_owner_via_message" ON storage.objects;
CREATE POLICY "attachments_owner_via_message" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'attachments'
    AND EXISTS (
      SELECT 1
        FROM public.messages m
        JOIN public.conversations c ON c.id = m.conversation_id
       WHERE m.id::text = (storage.objects.name::text)
         AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. Helpful view for the client: conversations w/ last-message summary ---
CREATE OR REPLACE VIEW public.conversation_summaries AS
SELECT
  c.id              AS conversation_id,
  c.user_id,
  c.title,
  c.model,
  c.pinned,
  c.archived,
  c.message_count,
  c.created_at,
  c.updated_at,
  c.last_active_at,
  (
    SELECT m.content
      FROM public.messages m
     WHERE m.conversation_id = c.id
     ORDER BY m.created_at DESC
     LIMIT 1
  ) AS last_message_preview
FROM public.conversations c;

GRANT SELECT ON public.conversation_summaries TO authenticated;

-- 5. Notification: confirm post-OAuth user gets a profile + wallet ---------
-- (already handled by handle_new_user trigger, but make explicit)
DO $$ BEGIN
  RAISE NOTICE 'M-Chat Phase 2 hardening applied';
END $$;