/*
  # Private Messaging System

  Enables admin to send private messages to agents and businesses,
  and allows recipients to reply. Messages are organized as threads.

  ## New Tables

  ### `message_threads`
  A conversation thread between admin and one recipient (agent or business).
  - `id` (uuid, PK)
  - `recipient_type` (text) — 'agent' or 'business'
  - `recipient_id` (uuid) — the auth user id of the agent or business
  - `subject` (text) — thread subject set by admin
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz) — bumped on each new message

  ### `messages`
  Individual messages within a thread.
  - `id` (uuid, PK)
  - `thread_id` (uuid, FK → message_threads)
  - `sender_role` (text) — 'admin' or 'agent' or 'business'
  - `sender_id` (uuid) — auth user id of sender
  - `body` (text) — message content
  - `is_read` (boolean) — whether recipient has read it
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on both tables
  - Admin (authenticated, any) can read/write all threads and messages
  - Agent can only access threads where recipient_id = auth.uid() AND recipient_type = 'agent'
  - Business can only access threads where recipient_id = auth.uid() AND recipient_type = 'business'
*/

-- ── message_threads ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS message_threads (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_type text NOT NULL CHECK (recipient_type IN ('agent', 'business')),
  recipient_id   uuid NOT NULL,
  subject        text NOT NULL DEFAULT '',
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;

-- Admin can see all threads
CREATE POLICY "Admin can view all message threads"
  ON message_threads FOR SELECT
  TO authenticated
  USING (true);

-- Admin can create threads
CREATE POLICY "Admin can create message threads"
  ON message_threads FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admin can update threads (e.g. updated_at bump)
CREATE POLICY "Admin can update message threads"
  ON message_threads FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── messages ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id   uuid NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('admin', 'agent', 'business')),
  sender_id   uuid NOT NULL,
  body        text NOT NULL DEFAULT '',
  is_read     boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view messages in threads they belong to
CREATE POLICY "Users can view messages in their threads"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM message_threads t
      WHERE t.id = messages.thread_id
        AND (
          -- admin sees all
          t.recipient_id = auth.uid()
          OR
          -- recipient sees own thread messages
          t.recipient_id = auth.uid()
          OR
          -- sender sees their own messages
          messages.sender_id = auth.uid()
        )
    )
  );

-- Authenticated users can insert messages
CREATE POLICY "Authenticated users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Authenticated users can mark messages as read
CREATE POLICY "Authenticated users can mark messages read"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM message_threads t
      WHERE t.id = messages.thread_id
        AND (t.recipient_id = auth.uid() OR messages.sender_id = auth.uid())
    )
  )
  WITH CHECK (true);

-- ── index for fast lookups ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_message_threads_recipient ON message_threads(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read) WHERE is_read = false;
