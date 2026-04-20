-- Create app_content table: one row per admin-managed content type
CREATE TABLE public.app_content (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_content ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can read mosque content
CREATE POLICY "Public can read app_content"
  ON public.app_content FOR SELECT
  USING (true);

-- No direct writes from clients; writes only via edge function with service role
CREATE POLICY "No direct writes to app_content"
  ON public.app_content FOR ALL
  USING (false)
  WITH CHECK (false);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER app_content_set_updated_at
  BEFORE UPDATE ON public.app_content
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Enable realtime so all clients get push updates when admin saves
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_content;
ALTER TABLE public.app_content REPLICA IDENTITY FULL;