ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read of app_content_changes topic" ON realtime.messages;

CREATE POLICY "Allow read of app_content_changes topic"
ON realtime.messages
FOR SELECT
TO anon, authenticated
USING (
  realtime.topic() = 'app_content_changes'
  AND extension = 'postgres_changes'
);