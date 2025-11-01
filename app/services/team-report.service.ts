/**
 * Team Report Service
 * Handles team structure reporting with level-wise breakdown
 * Distinguishes between Direct Members (Level 1) and Total Team (All Levels)
 */

import { supabase } from './supabase.client';
import { getTeamMembers } from './mlm.service';

export interface TeamMemberDetail {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  total_investment: number;
  wallet_balance: number;
  is_active: boolean;
  current_rank: string;
  kyc_status: string;
  sponsor_id: string;
  sponsor_name?: string;
  direct_count: number;
  team_count: number;
  level: number;
}

export interface LevelStats {
  level: number;
  member_count: number;
  percentage: number;
  total_investment: number;
  total_balance: number;
  active_count: number;
  inactive_count: number;
  members?: TeamMemberDetail[];
}

export interface TeamReportData {
  direct_members_count: number;
  total_team_count: number;
  total_investment: number;
  total_balance: number;
  levels: LevelStats[];
  max_depth: number;
}

/**
 * Build team tree recursively to get all downline members with their levels
 */
async function buildTeamTree(
  userId: string,
  currentLevel: number = 1,
  maxLevel: number = 30,
  visited: Set<string> = new Set()
): Promise<Map<number, TeamMemberDetail[]>> {
  const levelMap = new Map<number, TeamMemberDetail[]>();

  if (currentLevel > maxLevel || visited.has(userId)) {
    return levelMap;
  }

  visited.add(userId);

  // Get direct referrals at this level
  console.log(`🔍 Level ${currentLevel}: Querying users where sponsor_id = ${userId.substring(0, 8)}...`);

  const { data: directMembers, error } = await supabase
    .from('users')
    .select(`
      id,
      full_name,
      email,
      created_at,
      total_investment,
      wallet_balance,
      is_active,
      current_rank,
      kyc_status,
      sponsor_id,
      direct_count,
      team_count
    `)
    .eq('sponsor_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`❌ Error fetching level ${currentLevel}:`, error);
    return levelMap;
  }

  console.log(`📊 Level ${currentLevel}: Found ${directMembers?.length || 0} members`);

  if (!directMembers || directMembers.length === 0) {
    return levelMap;
  }

  directMembers.forEach(member => {
    console.log(`  - ${member.full_name} (${member.email})`);
  });

  // Add current level members
  const membersWithLevel = directMembers.map(member => ({
    ...member,
    level: currentLevel,
    total_investment: member.total_investment || 0,
    wallet_balance: member.wallet_balance || 0,
    current_rank: member.current_rank || 'starter',
  }));

  levelMap.set(currentLevel, membersWithLevel);

  // Recursively get deeper levels
  for (const member of directMembers) {
    const subTree = await buildTeamTree(member.id, currentLevel + 1, maxLevel, visited);

    // Merge subtree into main level map
    subTree.forEach((members, level) => {
      const existing = levelMap.get(level) || [];
      levelMap.set(level, [...existing, ...members]);
    });
  }

  return levelMap;
}

/**
 * Get sponsor name for a member
 */
async function getSponsorName(sponsorId: string): Promise<string> {
  const { data, error } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', sponsorId)
    .single();

  if (error || !data) return 'Unknown';
  return data.full_name;
}

/**
 * Get comprehensive team report with level-wise breakdown
 * Uses MLM service to get team members (same as "My Team" page)
 */
export const getTeamReport = async (): Promise<TeamReportData> => {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('User not authenticated');

    console.log('📊 Building team report for user:', user.id);

    // Get team members using MLM service (same as "My Team" page)
    const teamMembers = await getTeamMembers(user.id);
    console.log(`✅ Found ${teamMembers.length} team members from MLM service`);

    // Group members by level
    const levelMap = new Map<number, TeamMemberDetail[]>();
    let totalInvestment = 0;
    let totalBalance = 0;

    for (const member of teamMembers) {
      const level = member.level || 1;

      // Convert MLM member format to TeamMemberDetail format
      const teamMember: TeamMemberDetail = {
        id: member.id,
        full_name: member.name,
        email: member.email,
        created_at: member.joinDate,
        total_investment: member.totalInvestment || 0,
        wallet_balance: 0, // Not available in MLM service, would need separate query
        is_active: member.status === 'active',
        current_rank: 'starter', // Not available in MLM service
        kyc_status: 'not_submitted', // Not available in MLM service
        sponsor_id: member.parentId || '',
        direct_count: member.directReferrals || 0,
        team_count: member.teamSize || 0,
        level: level,
      };

      const existing = levelMap.get(level) || [];
      levelMap.set(level, [...existing, teamMember]);

      totalInvestment += member.totalInvestment || 0;
    }

    // Calculate statistics per level
    const levels: LevelStats[] = [];
    const sortedLevels = Array.from(levelMap.keys()).sort((a, b) => a - b);
    const totalMembers = teamMembers.length;
    const maxDepth = sortedLevels.length > 0 ? Math.max(...sortedLevels) : 0;

    for (const level of sortedLevels) {
      const members = levelMap.get(level) || [];
      const activeCount = members.filter(m => m.is_active).length;
      const levelInvestment = members.reduce((sum, m) => sum + (m.total_investment || 0), 0);
      const levelBalance = members.reduce((sum, m) => sum + (m.wallet_balance || 0), 0);

      levels.push({
        level,
        member_count: members.length,
        percentage: totalMembers > 0 ? (members.length / totalMembers) * 100 : 0,
        total_investment: levelInvestment,
        total_balance: levelBalance,
        active_count: activeCount,
        inactive_count: members.length - activeCount,
      });

      totalBalance += levelBalance;
    }

    // Count direct members (Level 1)
    const directMembersCount = levels.find(l => l.level === 1)?.member_count || 0;

    console.log(`✅ Team report built: ${directMembersCount} direct, ${totalMembers} total, ${maxDepth} levels deep`);

    return {
      direct_members_count: directMembersCount,
      total_team_count: totalMembers,
      total_investment: totalInvestment,
      total_balance: totalBalance,
      levels,
      max_depth: maxDepth,
    };
  } catch (error: any) {
    console.error('Error generating team report:', error);
    throw new Error(error.message || 'Failed to generate team report');
  }
};

/**
 * Get detailed members for a specific level
 * Uses MLM service to get team members
 */
export const getLevelMembers = async (level: number): Promise<TeamMemberDetail[]> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('User not authenticated');

    console.log(`📋 Fetching level ${level} members for user:`, user.id);

    // Get all team members from MLM service
    const teamMembers = await getTeamMembers(user.id);

    // Filter members for the requested level
    const levelMembers = teamMembers
      .filter(member => member.level === level)
      .map(member => ({
        id: member.id,
        full_name: member.name,
        email: member.email,
        created_at: member.joinDate,
        total_investment: member.totalInvestment || 0,
        wallet_balance: 0,
        is_active: member.status === 'active',
        current_rank: 'starter',
        kyc_status: 'not_submitted',
        sponsor_id: member.parentId || '',
        direct_count: member.directReferrals || 0,
        team_count: member.teamSize || 0,
        level: member.level || 1,
      }));

    // Enrich with sponsor names
    const enrichedMembers = await Promise.all(
      levelMembers.map(async (member) => {
        const sponsor_name = member.sponsor_id ? await getSponsorName(member.sponsor_id) : undefined;
        return {
          ...member,
          sponsor_name,
        };
      })
    );

    console.log(`✅ Found ${enrichedMembers.length} members at level ${level}`);

    return enrichedMembers;
  } catch (error: any) {
    console.error(`Error fetching level ${level} members:`, error);
    throw new Error(error.message || `Failed to fetch level ${level} members`);
  }
};

/**
 * Get direct members (Level 1 only)
 */
export const getDirectMembers = async (): Promise<TeamMemberDetail[]> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('User not authenticated');

    const { data: directMembers, error } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        email,
        created_at,
        total_investment,
        wallet_balance,
        is_active,
        current_rank,
        kyc_status,
        sponsor_id,
        direct_count,
        team_count
      `)
      .eq('sponsor_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const members = (directMembers || []).map(member => ({
      ...member,
      level: 1,
      total_investment: member.total_investment || 0,
      wallet_balance: member.wallet_balance || 0,
      current_rank: member.current_rank || 'starter',
    }));

    return members;
  } catch (error: any) {
    console.error('Error fetching direct members:', error);
    throw new Error(error.message || 'Failed to fetch direct members');
  }
};

/**
 * Export team report data for a specific level
 */
export const exportLevelReport = async (level: number): Promise<string> => {
  try {
    const members = await getLevelMembers(level);

    // Generate CSV
    const headers = ['Name', 'Email', 'Joined', 'Investment', 'Balance', 'Status', 'Rank', 'KYC', 'Sponsor'];
    const rows = members.map(m => [
      m.full_name,
      m.email,
      new Date(m.created_at).toLocaleDateString(),
      `$${m.total_investment.toLocaleString()}`,
      `$${m.wallet_balance.toLocaleString()}`,
      m.is_active ? 'Active' : 'Inactive',
      m.current_rank,
      m.kyc_status,
      m.sponsor_name || 'N/A',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csv;
  } catch (error: any) {
    console.error(`Error exporting level ${level} report:`, error);
    throw new Error(error.message || `Failed to export level ${level} report`);
  }
};
