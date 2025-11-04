// OPTIMIZED getTeamMembers - Replace in mlm.service.ts line 1556
// Reduces 100+ queries to just 1 query!

export const getTeamMembers = async (userId?: string) => {
  try {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetUserId) throw new Error('User not authenticated');

    console.log('🔍 Fetching team members for user:', targetUserId);
    console.time('⏱️  Team fetch time');

    // OPTIMIZATION: Get ALL users in ONE query instead of recursive queries
    const { data: allUsers, error } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        email,
        total_investment,
        created_at,
        level,
        sponsor_id,
        position,
        is_active,
        left_volume,
        right_volume,
        direct_count,
        team_count
      `);

    if (error) {
      console.error('❌ Error fetching users:', error);
      throw error;
    }

    if (!allUsers || allUsers.length === 0) {
      console.log('⚠️  No users found in database');
      return [];
    }

    console.log(`📊 Loaded ${allUsers.length} total users from database`);

    // Build user map for O(1) lookups
    const userMap = new Map(allUsers.map(u => [u.id, u]));

    // Find all team members using BFS (Breadth-First Search)
    const teamMembers: any[] = [];
    const queue = [targetUserId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;

      if (visited.has(currentId)) continue;
      visited.add(currentId);

      // Find all direct referrals of current user
      allUsers.forEach(user => {
        if (user.sponsor_id === currentId && !visited.has(user.id)) {
          teamMembers.push({
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            total_investment: user.total_investment || 0,
            created_at: user.created_at,
            level: user.level || 1,
            sponsor_id: user.sponsor_id,
            position: user.position || 'left',
            is_active: user.is_active !== false,
            left_volume: user.left_volume || 0,
            right_volume: user.right_volume || 0,
            directReferrals: user.direct_count || 0,
            teamSize: user.team_count || 0
          });

          queue.push(user.id);
        }
      });
    }

    console.timeEnd('⏱️  Team fetch time');
    console.log(`✅ Found ${teamMembers.length} team members`);

    return teamMembers;

  } catch (error: any) {
    console.error('❌ Get team members error:', error.message);
    toast.error('Failed to load team members');
    return [];
  }
};
