import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../utils/api-client';
import toast from 'react-hot-toast';

interface Rank {
  id: string;
  rank_name: string;
  rank_order: number;
  min_personal_sales: number;
  min_team_volume: number;
  min_direct_referrals: number;
  min_active_directs: number;
  reward_amount: number;
  is_active: boolean;
  progress: {
    overall: number;
    personalInvestment: number;
    teamVolume: number;
    directReferrals: number;
    activeDirects: number;
  };
  isUnlocked: boolean;
  isCurrent: boolean;
}

interface UserStats {
  personalInvestment: number;
  teamVolume: number;
  directReferrals: number;
  activeDirects: number;
}

export const Ranks: React.FC = () => {
  const navigate = useNavigate();
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRanksData();
  }, []);

  const loadRanksData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<{
        ranks: Rank[];
        currentUserStats: UserStats;
        achievements: any[];
      }>('/user/ranks');

      if (response.data) {
        setRanks(response.data.ranks || []);
        setUserStats(response.data.currentUserStats || null);
      }
    } catch (err: any) {
      console.error('Error loading ranks:', err);
      setError(err.message || 'Failed to load ranks data');
      toast.error('Failed to load ranks data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏅</div>
        <p style={{ fontSize: '18px', color: '#666' }}>Loading ranks data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <button onClick={() => navigate('/dashboard')} style={{ marginBottom: '20px', padding: '10px 20px', cursor: 'pointer' }}>
          ← Back to Dashboard
        </button>
        <div style={{ padding: '40px', background: '#ffebee', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
          <p style={{ fontSize: '18px', color: '#c62828', marginBottom: '20px' }}>{error}</p>
          <button
            onClick={loadRanksData}
            style={{
              padding: '12px 24px',
              background: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const currentRank = ranks.find(r => r.isCurrent);
  const nextRank = ranks.find(r => r.rank_order === (currentRank ? currentRank.rank_order + 1 : 1));
  const unlockedRanks = ranks.filter(r => r.isUnlocked);

  // Helper function to get color for rank
  const getRankColor = (rankName: string): string => {
    const colors: Record<string, string> = {
      'STARTER': '#9e9e9e',
      'BRONZE': '#cd7f32',
      'SILVER': '#c0c0c0',
      'GOLD': '#ffd700',
      'PLATINUM': '#e5e4e2',
      'DIAMOND': '#b9f2ff',
      'RUBY': '#e0115f',
      'EMERALD': '#50c878',
      'SAPPHIRE': '#0f52ba',
      'CROWN': '#667eea',
    };
    return colors[rankName.toUpperCase()] || '#667eea';
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          marginBottom: '20px',
          padding: '10px 20px',
          cursor: 'pointer',
          background: '#f5f5f5',
          border: '1px solid #ddd',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '600'
        }}
      >
        ← Back to Dashboard
      </button>

      <h1 style={{ margin: '0 0 10px 0', fontSize: '32px', fontWeight: '700' }}>Rank Advancement</h1>
      <p style={{ margin: '0 0 30px 0', fontSize: '16px', color: '#666' }}>Track your progress and unlock rewards</p>

      {currentRank && (
        <div style={{
          marginBottom: '30px',
          background: `linear-gradient(135deg, ${getRankColor(currentRank.rank_name)} 0%, #764ba2 100%)`,
          borderRadius: '12px',
          padding: '40px',
          color: 'white',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '36px' }}>🏅</h2>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '20px', opacity: 0.9 }}>Your Current Rank</h2>
            <h1 style={{ margin: '0', fontSize: '48px', fontWeight: 'bold' }}>{currentRank.rank_name}</h1>
          </div>

          {userStats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', marginTop: '40px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '5px' }}>👥</div>
                <p style={{ margin: '0', opacity: 0.9, fontSize: '14px' }}>Direct Referrals</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>{userStats.directReferrals}</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '12px', opacity: 0.8' }}>Active: {userStats.activeDirects}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '5px' }}>💰</div>
                <p style={{ margin: '0', opacity: 0.9, fontSize: '14px' }}>Personal Investment</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>${userStats.personalInvestment.toLocaleString()}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '5px' }}>📊</div>
                <p style={{ margin: '0', opacity: 0.9, fontSize: '14px' }}>Team Volume</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>${userStats.teamVolume.toLocaleString()}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '5px' }}>🎁</div>
                <p style={{ margin: '0', opacity: 0.9, fontSize: '14px' }}>Rank Reward</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>${currentRank.reward_amount.toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {nextRank && userStats && (
        <div style={{ marginBottom: '30px', background: '#fff', borderRadius: '12px', border: '1px solid #ddd', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: '700' }}>
            Next Rank: {nextRank.rank_name}
            <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#666', marginLeft: '12px' }}>
              (Reward: ${nextRank.reward_amount.toLocaleString()})
            </span>
          </h3>

          <div style={{ marginBottom: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: '600' }}>👥 Direct Referrals</span>
              <span style={{ color: '#667eea', fontWeight: '600' }}>
                {userStats.directReferrals} / {nextRank.min_direct_referrals}
              </span>
            </div>
            <div style={{ height: '12px', background: '#f5f5f5', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{
                width: `${nextRank.progress.directReferrals}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: '600' }}>💰 Personal Investment</span>
              <span style={{ color: '#667eea', fontWeight: '600' }}>
                ${userStats.personalInvestment.toLocaleString()} / ${nextRank.min_personal_sales.toLocaleString()}
              </span>
            </div>
            <div style={{ height: '12px', background: '#f5f5f5', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{
                width: `${nextRank.progress.personalInvestment}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: '600' }}>📊 Team Volume</span>
              <span style={{ color: '#667eea', fontWeight: '600' }}>
                ${userStats.teamVolume.toLocaleString()} / ${nextRank.min_team_volume.toLocaleString()}
              </span>
            </div>
            <div style={{ height: '12px', background: '#f5f5f5', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{
                width: `${nextRank.progress.teamVolume}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: '600' }}>✓ Active Directs</span>
              <span style={{ color: '#667eea', fontWeight: '600' }}>
                {userStats.activeDirects} / {nextRank.min_active_directs}
              </span>
            </div>
            <div style={{ height: '12px', background: '#f5f5f5', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{
                width: `${nextRank.progress.activeDirects}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          <div style={{ padding: '20px', background: '#e8f5e9', borderRadius: '8px', border: '1px solid #4caf50' }}>
            <strong style={{ fontSize: '16px' }}>🎁 Unlock Reward:</strong>
            <p style={{ margin: '10px 0 0 0', fontSize: '14px', lineHeight: '1.6' }}>
              Achieve {nextRank.rank_name} rank to earn a <strong>${nextRank.reward_amount.toLocaleString()}</strong> bonus
              and unlock additional benefits! You're <strong>{nextRank.progress.overall}%</strong> of the way there.
            </p>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '30px', background: '#fff', borderRadius: '12px', border: '1px solid #ddd', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '24px', fontWeight: '700' }}>
          All Ranks ({unlockedRanks.length}/{ranks.length} Unlocked)
        </h3>
        <div style={{ display: 'grid', gap: '15px' }}>
          {ranks.map((rank, index) => (
            <div
              key={rank.id}
              style={{
                padding: '20px',
                background: rank.isCurrent ? '#f5f5ff' : rank.isUnlocked ? '#f5f5f5' : '#fafafa',
                border: `2px solid ${rank.isCurrent ? getRankColor(rank.rank_name) : rank.isUnlocked ? '#4caf50' : '#ddd'}`,
                borderRadius: '12px',
                display: 'grid',
                gridTemplateColumns: '100px 1fr 120px 150px 150px 120px',
                alignItems: 'center',
                gap: '20px',
                opacity: rank.isUnlocked ? 1 : 0.6,
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: getRankColor(rank.rank_name),
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  boxShadow: rank.isUnlocked ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
                }}>
                  {rank.isUnlocked ? '🏅' : '🔒'}
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: '700' }}>{rank.rank_name}</h4>
                <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                  {rank.isCurrent ? '✓ Current Rank' : rank.isUnlocked ? '✓ Unlocked' : `${rank.progress.overall}% Progress`}
                </p>
              </div>

              <div>
                <p style={{ margin: '0', fontSize: '11px', color: '#666', textTransform: 'uppercase', fontWeight: '600' }}>Progress</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '20px', fontWeight: '700', color: rank.isUnlocked ? '#4caf50' : '#666' }}>
                  {rank.progress.overall}%
                </p>
              </div>

              <div>
                <p style={{ margin: '0', fontSize: '11px', color: '#666', textTransform: 'uppercase', fontWeight: '600' }}>Min. Directs</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '16px', fontWeight: '600' }}>{rank.min_direct_referrals}+</p>
              </div>

              <div>
                <p style={{ margin: '0', fontSize: '11px', color: '#666', textTransform: 'uppercase', fontWeight: '600' }}>Min. Investment</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '16px', fontWeight: '600' }}>${rank.min_personal_sales.toLocaleString()}</p>
              </div>

              <div>
                <p style={{ margin: '0', fontSize: '11px', color: '#666', textTransform: 'uppercase', fontWeight: '600' }}>Reward</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '18px', fontWeight: '700', color: '#4caf50' }}>
                  ${rank.reward_amount.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px', background: '#e3f2fd', borderRadius: '12px', border: '1px solid #2196f3' }}>
        <strong style={{ fontSize: '16px', color: '#1976d2' }}>ℹ️ Rank Benefits:</strong>
        <ul style={{ marginTop: '12px', fontSize: '14px', lineHeight: '1.8', color: '#0d47a1' }}>
          <li>Earn one-time cash bonuses when you achieve new ranks</li>
          <li>Unlock higher commission levels on your team's performance</li>
          <li>Gain access to exclusive training and support resources</li>
          <li>Receive recognition and special rewards at company events</li>
          <li>Build leadership skills and grow your business exponentially</li>
        </ul>
      </div>
    </div>
  );
};

export default Ranks;
