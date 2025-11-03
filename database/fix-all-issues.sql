-- ============================================================================
-- COMPREHENSIVE DATABASE FIX SCRIPT
-- Fixes all schema issues for Team & Genealogy functionality
-- ============================================================================

-- 1. Add missing total_withdrawal column to users
-- ============================================================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS total_withdrawal DECIMAL(20,8) DEFAULT 0.00000000;

COMMENT ON COLUMN users.total_withdrawal IS 'Total amount withdrawn by user';


-- 2. Create binary_nodes table for genealogy tree
-- ============================================================================
CREATE TABLE IF NOT EXISTS binary_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  left_child_id UUID REFERENCES users(id) ON DELETE SET NULL,
  right_child_id UUID REFERENCES users(id) ON DELETE SET NULL,
  position VARCHAR(10) CHECK (position IN ('left', 'right', 'root')),
  left_volume DECIMAL(20,8) DEFAULT 0.00000000,
  right_volume DECIMAL(20,8) DEFAULT 0.00000000,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_binary_nodes_user_id ON binary_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_binary_nodes_parent_id ON binary_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_binary_nodes_left_child ON binary_nodes(left_child_id);
CREATE INDEX IF NOT EXISTS idx_binary_nodes_right_child ON binary_nodes(right_child_id);

COMMENT ON TABLE binary_nodes IS 'Binary tree structure for genealogy visualization';


-- 3. Create commissions table
-- ============================================================================
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('direct', 'binary', 'roi', 'rank', 'matching')),
  amount DECIMAL(20,8) NOT NULL,
  level INTEGER DEFAULT 1,
  package_id UUID,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commissions_user_id ON commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_from_user ON commissions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_type ON commissions(type);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_created_at ON commissions(created_at);

COMMENT ON TABLE commissions IS 'Tracks all commission earnings for users';


-- 4. Populate binary_nodes from existing users
-- ============================================================================
DO $$
DECLARE
  user_record RECORD;
  parent_user_id UUID;
  parent_left UUID;
  parent_right UUID;
  user_position VARCHAR(10);
BEGIN
  -- Insert root user (user@finaster.com)
  INSERT INTO binary_nodes (user_id, parent_id, position, level)
  SELECT id, NULL, 'root', 1
  FROM users
  WHERE email = 'user@finaster.com'
  ON CONFLICT (user_id) DO NOTHING;

  -- Insert all other users based on sponsor relationships
  FOR user_record IN
    SELECT u.id, u.sponsor_id, u.level
    FROM users u
    WHERE u.email != 'user@finaster.com'
    ORDER BY u.level, u.created_at
  LOOP
    IF user_record.sponsor_id IS NOT NULL THEN
      -- Get parent's binary node
      SELECT parent_id, left_child_id, right_child_id
      INTO parent_user_id, parent_left, parent_right
      FROM binary_nodes
      WHERE user_id = user_record.sponsor_id;

      -- Determine position (left or right)
      IF parent_left IS NULL THEN
        user_position := 'left';

        -- Update parent's left child
        UPDATE binary_nodes
        SET left_child_id = user_record.id,
            updated_at = NOW()
        WHERE user_id = user_record.sponsor_id;

      ELSIF parent_right IS NULL THEN
        user_position := 'right';

        -- Update parent's right child
        UPDATE binary_nodes
        SET right_child_id = user_record.id,
            updated_at = NOW()
        WHERE user_id = user_record.sponsor_id;

      ELSE
        -- Both positions filled, put under left child
        user_position := 'left';
        parent_user_id := parent_left;
      END IF;

      -- Insert user's binary node
      INSERT INTO binary_nodes (user_id, parent_id, position, level)
      VALUES (user_record.id, user_record.sponsor_id, user_position, COALESCE(user_record.level, 1))
      ON CONFLICT (user_id) DO UPDATE SET
        parent_id = EXCLUDED.parent_id,
        position = EXCLUDED.position,
        level = EXCLUDED.level,
        updated_at = NOW();
    END IF;
  END LOOP;

  RAISE NOTICE 'Binary nodes populated successfully';
END $$;


-- 5. Enable Row Level Security on new tables
-- ============================================================================
ALTER TABLE binary_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for binary_nodes
CREATE POLICY "Users can view all binary nodes"
  ON binary_nodes FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert binary nodes"
  ON binary_nodes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update binary nodes"
  ON binary_nodes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for commissions
CREATE POLICY "Users can view their own commissions"
  ON commissions FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only system can insert commissions"
  ON commissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- 6. Verification queries
-- ============================================================================
DO $$
DECLARE
  users_count INTEGER;
  binary_nodes_count INTEGER;
  referrals_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO users_count FROM users;
  SELECT COUNT(*) INTO binary_nodes_count FROM binary_nodes;
  SELECT COUNT(*) INTO referrals_count FROM referrals;

  RAISE NOTICE '✅ Users: %', users_count;
  RAISE NOTICE '✅ Binary Nodes: %', binary_nodes_count;
  RAISE NOTICE '✅ Referrals: %', referrals_count;

  IF binary_nodes_count < users_count THEN
    RAISE WARNING '⚠️  Some users are missing from binary_nodes table';
  END IF;
END $$;


-- 7. Update existing referrals table to add level and improve structure
-- ============================================================================
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS sponsor_id UUID REFERENCES users(id);

-- Populate new columns from existing data
UPDATE referrals SET
  user_id = referee_id,
  sponsor_id = referrer_id
WHERE user_id IS NULL AND sponsor_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_referrals_sponsor_id ON referrals(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_referrals_user_id ON referrals(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_level ON referrals(level);


-- DONE!
SELECT '✅ All database fixes applied successfully!' AS status;
