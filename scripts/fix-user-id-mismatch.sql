-- ═══════════════════════════════════════════════════════════════
-- FIX: Update seeded data to use current logged-in auth user ID
-- Replace old user ID with new auth user ID
-- ═══════════════════════════════════════════════════════════════

DO $$
DECLARE
  old_user_id UUID := '4a6ee960-ddf0-4daf-a029-e2e5a13d8f87';
  new_user_id UUID := '03dda15f-0f28-4f26-a250-836d2397f219';
BEGIN
  RAISE NOTICE 'Migrating data from % to %', old_user_id, new_user_id;

  -- Update users table - change the root user's ID
  UPDATE users
  SET id = new_user_id
  WHERE id = old_user_id;

  -- Update all sponsor_id references
  UPDATE users
  SET sponsor_id = new_user_id
  WHERE sponsor_id = old_user_id;

  -- Update referrals table
  UPDATE referrals
  SET referrer_id = new_user_id
  WHERE referrer_id = old_user_id;

  UPDATE referrals
  SET referee_id = new_user_id
  WHERE referee_id = old_user_id;

  -- Update referral_codes table
  UPDATE referral_codes
  SET user_id = new_user_id
  WHERE user_id = old_user_id;

  -- Update binary_tree table
  UPDATE binary_tree
  SET user_id = new_user_id
  WHERE user_id = old_user_id;

  UPDATE binary_tree
  SET parent_id = new_user_id
  WHERE parent_id = old_user_id;

  UPDATE binary_tree
  SET left_child_id = new_user_id
  WHERE left_child_id = old_user_id;

  UPDATE binary_tree
  SET right_child_id = new_user_id
  WHERE right_child_id = old_user_id;

  -- Update user_packages table
  UPDATE user_packages
  SET user_id = new_user_id
  WHERE user_id = old_user_id;

  -- Update mlm_transactions table
  UPDATE mlm_transactions
  SET user_id = new_user_id
  WHERE user_id = old_user_id;

  UPDATE mlm_transactions
  SET from_user_id = new_user_id
  WHERE from_user_id = old_user_id;

  -- Update level_incomes table
  UPDATE level_incomes
  SET user_id = new_user_id
  WHERE user_id = old_user_id;

  UPDATE level_incomes
  SET from_user_id = new_user_id
  WHERE from_user_id = old_user_id;

  RAISE NOTICE 'Migration complete!';

  -- Show team count
  SELECT COUNT(*) as team_members
  FROM users
  WHERE sponsor_id = new_user_id;
END $$;

-- Verify the migration
SELECT
  'users' as table_name,
  COUNT(*) as records
FROM users
WHERE id = '03dda15f-0f28-4f26-a250-836d2397f219'
UNION ALL
SELECT
  'team_members' as table_name,
  COUNT(*) as records
FROM users
WHERE sponsor_id = '03dda15f-0f28-4f26-a250-836d2397f219';
