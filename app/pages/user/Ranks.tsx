import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Ranks: React.FC = () => {
  const navigate = useNavigate();

  const ranks = [
    { name: 'Starter', minTeam: 0, minInvestment: 100, bonus: 0, color: '#9e9e9e' },
    { name: 'Bronze', minTeam: 5, minInvestment: 500, bonus: 50, color: '#cd7f32' },
    { name: 'Silver', minTeam: 10, minInvestment: 1000, bonus: 100, color: '#c0c0c0' },
    { name: 'Gold', minTeam: 25, minInvestment: 2500, bonus: 250, color: '#ffd700' },
    { name: 'Platinum', minTeam: 50, minInvestment: 5000, bonus: 500, color: '#e5e4e2' },
    { name: 'Diamond', minTeam: 100, minInvestment: 10000, bonus: 1000, color: '#b9f2ff' },
    { name: 'Crown Diamond', minTeam: 250, minInvestment: 25000, bonus: 2500, color: '#667eea' },
  ];

  const currentRank = ranks[0];
  const nextRank = ranks[1];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <button onClick={() => navigate('/dashboard')} style={{ marginBottom: '20px', padding: '10px 20px', cursor: 'pointer' }}>
        ← Back to Dashboard
      </button>

      <h1>Rank Advancement</h1>
      <p>Track your progress and unlock rewards</p>

      <div style={{ marginTop: '30px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', padding: '40px', color: 'white' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 10px 0', fontSize: '36px' }}>🏅</h2>
          <h2 style={{ margin: '0 0 10px 0' }}>Your Current Rank</h2>
          <h1 style={{ margin: '0', fontSize: '48px', fontWeight: 'bold' }}>{currentRank.name}</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', marginTop: '40px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '5px' }}>👥</div>
            <p style={{ margin: '0', opacity: 0.9, fontSize: '14px' }}>Team Size</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>0</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '5px' }}>💰</div>
            <p style={{ margin: '0', opacity: 0.9, fontSize: '14px' }}>Investment</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>$0</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '5px' }}>🎁</div>
            <p style={{ margin: '0', opacity: 0.9, fontSize: '14px' }}>Rank Bonus</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>${currentRank.bonus}</p>
          </div>
        </div>
      </div>

      {nextRank && (
        <div style={{ marginTop: '30px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd', padding: '30px' }}>
          <h3 style={{ margin: '0 0 20px 0' }}>Next Rank: {nextRank.name}</h3>

          <div style={{ marginBottom: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: '600' }}>Team Size Progress</span>
              <span style={{ color: '#667eea', fontWeight: '600' }}>0 / {nextRank.minTeam}</span>
            </div>
            <div style={{ height: '12px', background: '#f5f5f5', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{
                width: `0%`,
                height: '100%',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: '600' }}>Investment Progress</span>
              <span style={{ color: '#667eea', fontWeight: '600' }}>$0 / ${nextRank.minInvestment}</span>
            </div>
            <div style={{ height: '12px', background: '#f5f5f5', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{
                width: `0%`,
                height: '100%',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          <div style={{ padding: '20px', background: '#e8f5e9', borderRadius: '6px', border: '1px solid #4caf50' }}>
            <strong>🎁 Unlock Reward:</strong>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
              Achieve {nextRank.name} rank to earn a ${nextRank.bonus} bonus and unlock additional benefits!
            </p>
          </div>
        </div>
      )}

      <div style={{ marginTop: '30px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd', padding: '30px' }}>
        <h3 style={{ margin: '0 0 20px 0' }}>All Ranks</h3>
        <div style={{ display: 'grid', gap: '15px' }}>
          {ranks.map((rank, index) => (
            <div
              key={index}
              style={{
                padding: '20px',
                background: index === 0 ? '#f5f5f5' : '#fff',
                border: `2px solid ${index === 0 ? rank.color : '#ddd'}`,
                borderRadius: '8px',
                display: 'grid',
                gridTemplateColumns: '100px 1fr 150px 150px 120px',
                alignItems: 'center',
                gap: '20px',
                opacity: index === 0 ? 1 : 0.7
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: rank.color,
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px'
                }}>
                  {index === 0 ? '🏅' : '🔒'}
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>{rank.name}</h4>
                <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                  {index === 0 ? 'Current Rank' : 'Locked'}
                </p>
              </div>

              <div>
                <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>Min. Team</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '18px', fontWeight: '600' }}>{rank.minTeam}+</p>
              </div>

              <div>
                <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>Min. Investment</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '18px', fontWeight: '600' }}>${rank.minInvestment}+</p>
              </div>

              <div>
                <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>Bonus</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '18px', fontWeight: '600', color: '#4caf50' }}>${rank.bonus}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '20px', background: '#e3f2fd', borderRadius: '8px', border: '1px solid #2196f3' }}>
        <strong>ℹ️ Rank Benefits:</strong>
        <ul style={{ marginTop: '10px', fontSize: '14px' }}>
          <li>Earn one-time cash bonuses when you achieve new ranks</li>
          <li>Unlock higher commission levels on your team's performance</li>
          <li>Gain access to exclusive training and support</li>
          <li>Receive recognition and rewards at company events</li>
          <li>Build leadership skills and grow your business</li>
        </ul>
      </div>
    </div>
  );
};

export default Ranks;
