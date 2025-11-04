// Optimized getTeamMembers function - replaces slow recursive version
// This reduces 100+ queries to just 1 query!

export const getTeamMembers = async (userId?: string) => {
  try {
    const targetUserId = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!targetUserId) throw new Error('User not authenticated');

    console.log('🔍 Fetching team members for user:', targetUserId);

    // OPTIMIZED: Single query with recursive CTE to get ALL downline
    const { data: teamMembers, error } = await supabase.rpc('get_team_members', {
      user_id: targetUserId
    });

    if (error) {
      console.error('❌ Error fetching team members:', error);

      // FALLBACK: Use simple query if RPC function doesn't exist
      console.log('⚠️  Falling back to simple query...');

      const { data: allUsers, error: fallbackError } = await supabase
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

      if (fallbackError) throw fallbackError;

      // Build team hierarchy in memory
      const userMap = new Map(allUsers.map(u => [u.id, u]));
      const teamSet = new Set<string>();

      // Recursive function to find all downline
      const addDownline = (userId: string) => {
        allUsers.forEach(user => {
          if (user.sponsor_id === userId && !teamSet.has(user.id)) {
            teamSet.add(user.id);
            addDownline(user.id);
          }
        });
      };

      addDownline(targetUserId);

      // Convert Set to array of users
      const team = Array.from(teamSet)
        .map(id => userMap.get(id))
        .filter(Boolean);

      console.log(`✅ Found ${team.length} team members (fallback method)`);
      return team;
    }

    console.log(`✅ Found ${teamMembers?.length || 0} team members`);
    return teamMembers || [];

  } catch (error: any) {
    console.error('❌ Get team members error:', error.message);
    toast.error('Failed to load team members');
    return [];
  }
};
