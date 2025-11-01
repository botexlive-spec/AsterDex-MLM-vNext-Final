import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Robot: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <button onClick={() => navigate('/dashboard')} style={{ marginBottom: '20px', padding: '10px 20px', cursor: 'pointer' }}>
        ← Back to Dashboard
      </button>

      <h1>Robot Subscription</h1>
      <p>Activate our trading robot to maximize your earnings</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '30px' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '30px', background: '#fff' }}>
          <h2>Robot Subscription</h2>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#667eea', margin: '20px 0' }}>
            $100
          </div>
          <p style={{ color: '#666', marginBottom: '20px' }}>per month</p>

          <div style={{ marginBottom: '20px' }}>
            <h3>Features:</h3>
            <ul>
              <li>Automated trading strategies</li>
              <li>24/7 market monitoring</li>
              <li>Risk management system</li>
              <li>Real-time alerts</li>
              <li>Performance analytics</li>
              <li>Priority support</li>
            </ul>
          </div>

          <button
            style={{
              width: '100%',
              padding: '15px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '16px'
            }}
            onClick={() => alert('Robot subscription coming soon!')}
          >
            Activate Robot
          </button>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '30px', background: '#f9f9f9' }}>
          <h3>Subscription Status</h3>
          <div style={{ marginTop: '20px' }}>
            <div style={{ padding: '15px', background: '#fff', borderRadius: '6px', marginBottom: '15px' }}>
              <strong>Status:</strong>
              <p style={{ color: '#ff6b6b', marginTop: '5px' }}>❌ Not Active</p>
            </div>

            <div style={{ padding: '15px', background: '#fff', borderRadius: '6px', marginBottom: '15px' }}>
              <strong>Expires:</strong>
              <p style={{ color: '#666', marginTop: '5px' }}>N/A</p>
            </div>

            <div style={{ padding: '15px', background: '#fff', borderRadius: '6px', marginBottom: '15px' }}>
              <strong>Auto-Renewal:</strong>
              <p style={{ color: '#666', marginTop: '5px' }}>Disabled</p>
            </div>
          </div>

          <div style={{ marginTop: '30px', padding: '20px', background: '#e3f2fd', borderRadius: '6px' }}>
            <h4>Why Robot Subscription?</h4>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
              Our AI-powered trading robot helps you maximize returns while minimizing risks.
              Get access to advanced trading strategies and automated portfolio management.
            </p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '40px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Subscription History</h3>
        <p style={{ color: '#666' }}>No subscription history available.</p>
      </div>
    </div>
  );
};

export default Robot;
