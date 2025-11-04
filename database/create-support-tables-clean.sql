/* Support Management Tables - Clean Version for Supabase */

/* 1. Create sequence for ticket IDs */
CREATE SEQUENCE IF NOT EXISTS ticket_id_seq START 1;

/* 2. Support Tickets Table */
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id TEXT UNIQUE NOT NULL DEFAULT 'TKT-' || LPAD(nextval('ticket_id_seq')::TEXT, 6, '0'),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('technical', 'billing', 'account', 'general', 'kyc', 'withdrawal')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'closed')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  messages_count INTEGER DEFAULT 0,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_reply_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/* 3. Ticket Messages Table */
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/* 4. Canned Responses Table */
CREATE TABLE IF NOT EXISTS canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  shortcut TEXT,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/* 5. Chat Sessions Table */
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('active', 'waiting', 'closed')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  messages_count INTEGER DEFAULT 0,
  waiting_time INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/* 6. Chat Messages Table */
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/* 7. Create Indexes for better performance */
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON ticket_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_canned_responses_category ON canned_responses(category);
CREATE INDEX IF NOT EXISTS idx_canned_responses_usage_count ON canned_responses(usage_count DESC);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_assigned_to ON chat_sessions(assigned_to);

CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

/* 8. Enable Row Level Security (RLS) */
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE canned_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

/* 9. Drop existing policies if they exist */
DROP POLICY IF EXISTS admin_support_tickets_select ON support_tickets;
DROP POLICY IF EXISTS admin_support_tickets_insert ON support_tickets;
DROP POLICY IF EXISTS admin_support_tickets_update ON support_tickets;
DROP POLICY IF EXISTS user_support_tickets_select ON support_tickets;
DROP POLICY IF EXISTS user_support_tickets_insert ON support_tickets;

DROP POLICY IF EXISTS admin_ticket_messages_all ON ticket_messages;
DROP POLICY IF EXISTS user_ticket_messages_select ON ticket_messages;
DROP POLICY IF EXISTS user_ticket_messages_insert ON ticket_messages;

DROP POLICY IF EXISTS admin_canned_responses_all ON canned_responses;

DROP POLICY IF EXISTS admin_chat_sessions_all ON chat_sessions;
DROP POLICY IF EXISTS user_chat_sessions_select ON chat_sessions;
DROP POLICY IF EXISTS user_chat_sessions_insert ON chat_sessions;

DROP POLICY IF EXISTS admin_chat_messages_all ON chat_messages;
DROP POLICY IF EXISTS user_chat_messages_select ON chat_messages;
DROP POLICY IF EXISTS user_chat_messages_insert ON chat_messages;

/* 10. RLS Policies for Support Tickets */
CREATE POLICY admin_support_tickets_select ON support_tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY admin_support_tickets_insert ON support_tickets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY admin_support_tickets_update ON support_tickets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY user_support_tickets_select ON support_tickets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY user_support_tickets_insert ON support_tickets
  FOR INSERT WITH CHECK (user_id = auth.uid());

/* 11. RLS Policies for Ticket Messages */
CREATE POLICY admin_ticket_messages_all ON ticket_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY user_ticket_messages_select ON ticket_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_messages.ticket_id
      AND support_tickets.user_id = auth.uid()
    ) AND is_internal = FALSE
  );

CREATE POLICY user_ticket_messages_insert ON ticket_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_messages.ticket_id
      AND support_tickets.user_id = auth.uid()
    ) AND sender_id = auth.uid()
  );

/* 12. RLS Policies for Canned Responses (Admin only) */
CREATE POLICY admin_canned_responses_all ON canned_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

/* 13. RLS Policies for Chat Sessions */
CREATE POLICY admin_chat_sessions_all ON chat_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY user_chat_sessions_select ON chat_sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY user_chat_sessions_insert ON chat_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

/* 14. RLS Policies for Chat Messages */
CREATE POLICY admin_chat_messages_all ON chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY user_chat_messages_select ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.chat_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY user_chat_messages_insert ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.chat_id
      AND chat_sessions.user_id = auth.uid()
    ) AND sender_id = auth.uid()
  );

/* 15. Seed some default canned responses */
INSERT INTO canned_responses (title, content, category, shortcut, usage_count) VALUES
  ('Welcome Message', 'Hello {{USER_NAME}}, thank you for contacting support. How can I help you today?', 'General', '/welcome', 0),
  ('KYC Pending', 'Your KYC verification is currently under review. Our team typically processes verification within 24-48 hours. You will receive an email notification once it is approved.', 'KYC', '/kyc-pending', 0),
  ('Withdrawal Processing Time', 'Withdrawal requests are typically processed within 24-48 hours after approval. Please ensure your KYC verification is complete and all withdrawal requirements are met.', 'Withdrawal', '/withdrawal-time', 0),
  ('Account Verification Required', 'For security reasons, we need to verify your account. Please provide a government-issued ID and a recent utility bill showing your address.', 'Account', '/verify-account', 0)
ON CONFLICT DO NOTHING;

/* 16. Add trigger to update support_tickets.updated_at */
CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_support_tickets_updated_at_trigger ON support_tickets;

CREATE TRIGGER update_support_tickets_updated_at_trigger
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_tickets_updated_at();

/* Migration Complete! */
