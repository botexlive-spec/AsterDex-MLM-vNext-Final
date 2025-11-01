-- =====================================================
-- FIX #1: AUTO LEVEL UNLOCK TRIGGER
-- =====================================================
-- This trigger automatically unlocks income levels when
-- a user's direct referral count increases
-- =====================================================

-- Create trigger function to auto-unlock levels
CREATE OR REPLACE FUNCTION auto_unlock_user_levels()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if direct_count increased
  IF NEW.direct_count > OLD.direct_count THEN
    -- Call the existing unlock_levels function
    PERFORM unlock_levels(NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on users table
DROP TRIGGER IF EXISTS trigger_auto_unlock_levels ON public.users;

CREATE TRIGGER trigger_auto_unlock_levels
  AFTER UPDATE OF direct_count ON public.users
  FOR EACH ROW
  WHEN (NEW.direct_count > OLD.direct_count)
  EXECUTE FUNCTION auto_unlock_user_levels();

-- Add comment
COMMENT ON TRIGGER trigger_auto_unlock_levels ON public.users IS
  'Automatically unlocks income levels when user gains direct referrals';

-- =====================================================
-- TESTING THE TRIGGER
-- =====================================================
-- Test case: Update a user's direct_count
-- UPDATE users SET direct_count = direct_count + 1 WHERE id = 'test-user-id';
-- Expected: levels_unlocked should automatically update

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================
-- DROP TRIGGER IF EXISTS trigger_auto_unlock_levels ON public.users;
-- DROP FUNCTION IF EXISTS auto_unlock_user_levels();
