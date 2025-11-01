/**
 * Admin Rank Service
 * Manages MLM ranks, achievements, and rewards
 */

import { supabase } from './supabase.client';
import { requireAdmin } from '../middleware/admin.middleware';

export interface Rank {
  name: string;
  level: number;
  min_directs: number;
  min_team_volume: number;
  min_personal_volume: number;
  reward_amount: number;
  benefits: string[];
  color: string;
  icon: string;
}

export interface UserRankAchievement {
  user_id: string;
  user_name: string;
  user_email: string;
  current_rank: string;
  achieved_at: string;
  direct_referrals: number;
  team_volume: number;
  personal_volume: number;
  next_rank: string | null;
  progress_percentage: number;
}

/**
 * Get all rank definitions
 */
export const getAllRanks = (): Rank[] => {
  return [
    {
      name: 'Starter',
      level: 1,
      min_directs: 0,
      min_team_volume: 0,
      min_personal_volume: 0,
      reward_amount: 0,
      benefits: ['Access to basic features', 'Level 1-5 commission'],
      color: '#9ca3af',
      icon: '🌱',
    },
    {
      name: 'Bronze',
      level: 2,
      min_directs: 5,
      min_team_volume: 1000,
      min_personal_volume: 100,
      reward_amount: 500,
      benefits: ['Level 1-10 commission', 'Bronze badge', '$500 reward'],
      color: '#cd7f32',
      icon: '🥉',
    },
    {
      name: 'Silver',
      level: 3,
      min_directs: 10,
      min_team_volume: 5000,
      min_personal_volume: 500,
      reward_amount: 1500,
      benefits: ['Level 1-15 commission', 'Silver badge', '$1,500 reward', 'Priority support'],
      color: '#c0c0c0',
      icon: '🥈',
    },
    {
      name: 'Gold',
      level: 4,
      min_directs: 20,
      min_team_volume: 20000,
      min_personal_volume: 1000,
      reward_amount: 5000,
      benefits: ['Level 1-20 commission', 'Gold badge', '$5,000 reward', 'Monthly bonus', 'VIP support'],
      color: '#ffd700',
      icon: '🥇',
    },
    {
      name: 'Platinum',
      level: 5,
      min_directs: 50,
      min_team_volume: 100000,
      min_personal_volume: 5000,
      reward_amount: 15000,
      benefits: ['Level 1-25 commission', 'Platinum badge', '$15,000 reward', 'Car bonus', 'Leadership training'],
      color: '#e5e4e2',
      icon: '💎',
    },
    {
      name: 'Diamond',
      level: 6,
      min_directs: 100,
      min_team_volume: 500000,
      min_personal_volume: 10000,
      reward_amount: 50000,
      benefits: ['Full 30-level commission', 'Diamond badge', '$50,000 reward', 'Luxury car', 'International trips', 'Equity shares'],
      color: '#b9f2ff',
      icon: '💠',
    },
  ];
};

/**
 * Get user rank achievements
 */
export const getUserRankAchievements = async (): Promise<UserRankAchievement[]> => {
  try {
        // Verify admin access
    await requireAdmin();

const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        email,
        rank,
        total_investment,
        created_at
      `)
      .order('total_investment', { ascending: false })
      .limit(100);

    if (error) throw error;

    const achievements: UserRankAchievement[] = [];

    for (const user of users || []) {
      // Get direct referrals count
      const { count: directCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('sponsor_id', user.id);

      // Get team volume (sum of all downline investments)
      const { data: teamData } = await supabase
        .from('users')
        .select('total_investment')
        .eq('sponsor_id', user.id);

      const teamVolume = teamData?.reduce((sum, u) => sum + (u.total_investment || 0), 0) || 0;

      const currentRank = user.rank || 'Starter';
      const ranks = getAllRanks();
      const currentRankIndex = ranks.findIndex(r => r.name === currentRank);
      const nextRank = currentRankIndex < ranks.length - 1 ? ranks[currentRankIndex + 1] : null;

      let progressPercentage = 100;
      if (nextRank) {
        const directsProgress = (directCount || 0) / nextRank.min_directs;
        const volumeProgress = teamVolume / nextRank.min_team_volume;
        const personalProgress = (user.total_investment || 0) / nextRank.min_personal_volume;
        progressPercentage = Math.min(100, Math.round((directsProgress + volumeProgress + personalProgress) / 3 * 100));
      }

      achievements.push({
        user_id: user.id,
        user_name: user.full_name || 'Unknown',
        user_email: user.email,
        current_rank: currentRank,
        achieved_at: user.created_at,
        direct_referrals: directCount || 0,
        team_volume: teamVolume,
        personal_volume: user.total_investment || 0,
        next_rank: nextRank?.name || null,
        progress_percentage: progressPercentage,
      });
    }

    return achievements;
  } catch (error: any) {
    console.error('Error getting rank achievements:', error);
    return [];
  }
};

/**
 * Update user rank
 */
export const updateUserRank = async (
  userId: string,
  newRank: string,
  awardReward: boolean = true
): Promise<void> => {
  try {
        // Verify admin access
    await requireAdmin();

// Update user rank
    const { error: updateError } = await supabase
      .from('users')
      .update({ rank: newRank })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Award rank reward if specified
    if (awardReward) {
      const ranks = getAllRanks();
      const rank = ranks.find(r => r.name === newRank);

      if (rank && rank.reward_amount > 0) {
        // Get user wallet
        const { data: wallet } = await supabase
          .from('wallets')
          .select('available_balance, total_balance')
          .eq('user_id', userId)
          .single();

        if (wallet) {
          // Update wallet with rank reward
          await supabase
            .from('wallets')
            .update({
              available_balance: wallet.available_balance + rank.reward_amount,
              total_balance: wallet.total_balance + rank.reward_amount,
            })
            .eq('user_id', userId);

          // Create transaction record
          await supabase
            .from('mlm_transactions')
            .insert([{
              user_id: userId,
              transaction_type: 'rank_reward',
              amount: rank.reward_amount,
              description: `Rank achievement reward: ${newRank}`,
              status: 'completed',
            }]);
        }
      }
    }

    // Log admin action
    await supabase
      .from('admin_actions')
      .insert([{
        action_type: 'rank_update',
        target_id: userId,
        details: {
          new_rank: newRank,
          reward_awarded: awardReward,
        },
      }]);

    console.log(`User ${userId} rank updated to ${newRank}`);
  } catch (error: any) {
    console.error('Error updating user rank:', error);
    throw new Error(error.message || 'Failed to update user rank');
  }
};

/**
 * Get rank statistics
 */
export const getRankStats = async () => {
  try {
        // Verify admin access
    await requireAdmin();

const ranks = getAllRanks();
    const stats: any = {
      by_rank: {},
      total_rewards_paid: 0,
    };

    for (const rank of ranks) {
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('rank', rank.name);

      stats.by_rank[rank.name] = count || 0;
    }

    // Get total rank rewards paid
    const { data: rewardTransactions } = await supabase
      .from('mlm_transactions')
      .select('amount')
      .eq('transaction_type', 'rank_reward');

    stats.total_rewards_paid = rewardTransactions?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

    return stats;
  } catch (error: any) {
    console.error('Error getting rank stats:', error);
    return { by_rank: {}, total_rewards_paid: 0 };
  }
};

/**
 * Calculate rank eligibility for a user
 */
export const calculateRankEligibility = async (userId: string) => {
  try {
        // Verify admin access
    await requireAdmin();

// Get user data
    const { data: user } = await supabase
      .from('users')
      .select('id, full_name, rank, total_investment')
      .eq('id', userId)
      .single();

    if (!user) {
      throw new Error('User not found');
    }

    // Get direct referrals
    const { count: directCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('sponsor_id', userId);

    // Get team volume
    const { data: teamData } = await supabase
      .from('users')
      .select('total_investment')
      .eq('sponsor_id', userId);

    const teamVolume = teamData?.reduce((sum, u) => sum + (u.total_investment || 0), 0) || 0;

    // Check eligibility for each rank
    const ranks = getAllRanks();
    const eligibleRanks = ranks.filter(rank => {
      return (
        (directCount || 0) >= rank.min_directs &&
        teamVolume >= rank.min_team_volume &&
        (user.total_investment || 0) >= rank.min_personal_volume
      );
    });

    const highestEligibleRank = eligibleRanks.length > 0
      ? eligibleRanks[eligibleRanks.length - 1]
      : ranks[0];

    return {
      current_rank: user.rank || 'Starter',
      eligible_rank: highestEligibleRank.name,
      should_upgrade: highestEligibleRank.level > (ranks.find(r => r.name === (user.rank || 'Starter'))?.level || 1),
      direct_referrals: directCount || 0,
      team_volume: teamVolume,
      personal_volume: user.total_investment || 0,
    };
  } catch (error: any) {
    console.error('Error calculating rank eligibility:', error);
    throw new Error(error.message || 'Failed to calculate rank eligibility');
  }
};
