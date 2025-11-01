import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    marketing: false
  });
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showEarnings: false,
    showTeam: true
  });

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <button onClick={() => navigate('/dashboard')} style={{ marginBottom: '20px', padding: '10px 20px', cursor: 'pointer' }}>
        ← Back to Dashboard
      </button>

      <h1>Settings</h1>
      <p>Manage your account preferences</p>

      <div style={{ marginTop: '30px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd', padding: '30px' }}>
        <h3 style={{ margin: '0 0 20px 0' }}>Notification Preferences</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: '#f5f5f5', borderRadius: '6px', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '5px' }}>📧 Email Notifications</div>
              <div style={{ fontSize: '14px', color: '#666' }}>Receive notifications via email</div>
            </div>
            <input
              type="checkbox"
              checked={notifications.email}
              onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: '#f5f5f5', borderRadius: '6px', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '5px' }}>📱 SMS Notifications</div>
              <div style={{ fontSize: '14px', color: '#666' }}>Receive notifications via SMS</div>
            </div>
            <input
              type="checkbox"
              checked={notifications.sms}
              onChange={(e) => setNotifications({ ...notifications, sms: e.target.checked })}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: '#f5f5f5', borderRadius: '6px', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '5px' }}>🔔 Push Notifications</div>
              <div style={{ fontSize: '14px', color: '#666' }}>Receive push notifications in browser</div>
            </div>
            <input
              type="checkbox"
              checked={notifications.push}
              onChange={(e) => setNotifications({ ...notifications, push: e.target.checked })}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: '#f5f5f5', borderRadius: '6px', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '5px' }}>📢 Marketing Communications</div>
              <div style={{ fontSize: '14px', color: '#666' }}>Receive updates about new features and promotions</div>
            </div>
            <input
              type="checkbox"
              checked={notifications.marketing}
              onChange={(e) => setNotifications({ ...notifications, marketing: e.target.checked })}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </label>
        </div>
      </div>

      <div style={{ marginTop: '30px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd', padding: '30px' }}>
        <h3 style={{ margin: '0 0 20px 0' }}>Privacy Settings</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: '#f5f5f5', borderRadius: '6px', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '5px' }}>👤 Public Profile</div>
              <div style={{ fontSize: '14px', color: '#666' }}>Make your profile visible to other users</div>
            </div>
            <input
              type="checkbox"
              checked={privacy.profileVisible}
              onChange={(e) => setPrivacy({ ...privacy, profileVisible: e.target.checked })}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: '#f5f5f5', borderRadius: '6px', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '5px' }}>💰 Show Earnings</div>
              <div style={{ fontSize: '14px', color: '#666' }}>Display your earnings on public profile</div>
            </div>
            <input
              type="checkbox"
              checked={privacy.showEarnings}
              onChange={(e) => setPrivacy({ ...privacy, showEarnings: e.target.checked })}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: '#f5f5f5', borderRadius: '6px', cursor: 'pointer' }}>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '5px' }}>👥 Show Team Size</div>
              <div style={{ fontSize: '14px', color: '#666' }}>Display your team size on public profile</div>
            </div>
            <input
              type="checkbox"
              checked={privacy.showTeam}
              onChange={(e) => setPrivacy({ ...privacy, showTeam: e.target.checked })}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </label>
        </div>
      </div>

      <div style={{ marginTop: '30px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd', padding: '30px' }}>
        <h3 style={{ margin: '0 0 20px 0' }}>Language & Region</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600' }}>Language</label>
            <select
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600' }}>Currency</label>
            <select
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            >
              <option value="usd">USD ($)</option>
              <option value="eur">EUR (€)</option>
              <option value="gbp">GBP (£)</option>
              <option value="inr">INR (₹)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600' }}>Timezone</label>
            <select
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            >
              <option value="utc">UTC</option>
              <option value="est">Eastern Time (ET)</option>
              <option value="pst">Pacific Time (PT)</option>
              <option value="ist">India Standard Time (IST)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600' }}>Date Format</label>
            <select
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            >
              <option value="mdy">MM/DD/YYYY</option>
              <option value="dmy">DD/MM/YYYY</option>
              <option value="ymd">YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => alert('Settings saved successfully!')}
          style={{
            padding: '15px 30px',
            background: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '16px'
          }}
        >
          💾 Save Changes
        </button>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '15px 30px',
            background: '#fff',
            color: '#333',
            border: '1px solid #ddd',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '16px'
          }}
        >
          Cancel
        </button>
      </div>

      <div style={{ marginTop: '30px', padding: '20px', background: '#ffebee', borderRadius: '8px', border: '1px solid #f44336' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#d32f2f' }}>Danger Zone</h3>
        <p style={{ fontSize: '14px', margin: '0 0 15px 0', color: '#666' }}>
          These actions are irreversible. Please be certain.
        </p>
        <button
          onClick={() => alert('Account deletion coming soon!')}
          style={{
            padding: '10px 20px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Delete Account
        </button>
      </div>
    </div>
  );
};

export default Settings;
