-- Fix: Allow anonymous (unauthenticated) users to read public platform_settings
-- The landing page runs client-side with the anon key, so the previous policy
-- (TO authenticated) blocked config reads for public visitors.

DROP POLICY IF EXISTS "Anyone can view public settings" ON public.platform_settings;

CREATE POLICY "Anyone can view public settings"
  ON public.platform_settings FOR SELECT
  TO public
  USING (is_public = true);

-- Ensure landing_page_config is marked as public so visitors can read it
UPDATE public.platform_settings
  SET is_public = true
  WHERE key IN ('landing_page_config', 'platform_logo')
    AND is_public = false;
