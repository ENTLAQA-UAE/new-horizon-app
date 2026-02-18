-- Ensure notifications table has proper RLS policies for mark-as-read
-- This migration is idempotent and safe to re-run

-- Enable RLS (idempotent)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Ensure read_at column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'read_at'
  ) THEN
    ALTER TABLE notifications ADD COLUMN read_at TIMESTAMPTZ;
  END IF;
END $$;

-- Drop and recreate UPDATE policy to ensure correct definition
-- The UPDATE policy must allow authenticated users to update their own notifications
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Ensure SELECT policy exists
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Ensure INSERT policy exists
DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);
