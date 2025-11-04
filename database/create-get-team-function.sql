-- Create efficient function to get all team members in one query
-- This replaces 100+ queries with a single recursive CTE

CREATE OR REPLACE FUNCTION get_team_members(user_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  total_investment DECIMAL(20,8),
  created_at TIMESTAMP WITH TIME ZONE,
  level INTEGER,
  sponsor_id UUID,
  position VARCHAR(10),
  is_active BOOLEAN,
  left_volume DECIMAL(20,8),
  right_volume DECIMAL(20,8),
  direct_count INTEGER,
  team_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE team_hierarchy AS (
    -- Base case: Direct referrals of the user
    SELECT
      u.id,
      u.full_name,
      u.email,
      u.total_investment,
      u.created_at,
      u.level,
      u.sponsor_id,
      u.position,
      u.is_active,
      u.left_volume,
      u.right_volume,
      u.direct_count,
      u.team_count,
      1 AS depth
    FROM users u
    WHERE u.sponsor_id = user_id

    UNION ALL

    -- Recursive case: Get downline of each team member
    SELECT
      u.id,
      u.full_name,
      u.email,
      u.total_investment,
      u.created_at,
      u.level,
      u.sponsor_id,
      u.position,
      u.is_active,
      u.left_volume,
      u.right_volume,
      u.direct_count,
      u.team_count,
      th.depth + 1
    FROM users u
    INNER JOIN team_hierarchy th ON u.sponsor_id = th.id
    WHERE th.depth < 30  -- Prevent infinite recursion
  )
  SELECT
    th.id,
    th.full_name,
    th.email,
    th.total_investment,
    th.created_at,
    th.level,
    th.sponsor_id,
    th.position,
    th.is_active,
    th.left_volume,
    th.right_volume,
    th.direct_count,
    th.team_count
  FROM team_hierarchy th
  ORDER BY th.depth, th.created_at;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_team_members(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_team_members(UUID) TO anon;

-- Test the function
-- SELECT * FROM get_team_members('4a6ee960-ddf0-4daf-a029-e2e5a13d8f87');
