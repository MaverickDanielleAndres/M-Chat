CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.invoke_webhook_on_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier THEN
    PERFORM net.http_post(
      url:='https://mtcugjtuiuxjgoyvzzvf.supabase.co/functions/v1/webhook-handler',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10Y3VnanR1aXV4amdveXZ6enZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MzI1MTAsImV4cCI6MjA5ODQwODUxMH0.HM0th_IykwAyK2smIbV96LmQ2oEpwPIPjchZaj8STYI"}'::jsonb,
      body:=jsonb_build_object(
        'type', 'UPDATE',
        'table', 'user_profiles',
        'old_record', row_to_json(OLD),
        'record', row_to_json(NEW)
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS webhook_on_profile_update ON public.user_profiles;
CREATE TRIGGER webhook_on_profile_update
AFTER UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.invoke_webhook_on_profile_update();
