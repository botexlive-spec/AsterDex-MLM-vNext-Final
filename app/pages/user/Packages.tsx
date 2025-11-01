import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAvailablePackages } from '../../services/package.service';
import { Package } from '../../types/package.types';
import toast from 'react-hot-toast';

export const Packages: React.FC = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const packagesData = await getAvailablePackages();
      setPackages(packagesData);
    } catch (error: any) {
      console.error('Error loading packages:', error);
      toast.error(error.message || 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const handleInvest = (pkg: Package) => {
    // Navigate to a purchase page or open modal
    toast.info('Package purchase functionality coming soon!');
    // In production: navigate(`/packages/purchase/${pkg.id}`);
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>📦</div>
        <p>Loading investment packages...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <button onClick={() => navigate('/dashboard')} style={{ marginBottom: '20px', padding: '10px 20px', cursor: 'pointer' }}>
        ← Back to Dashboard
      </button>

      <h1>Investment Packages</h1>
      <p>Choose a package that fits your investment goals</p>

      {packages.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', background: '#f5f5f5', borderRadius: '8px', marginTop: '30px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📦</div>
          <h3>No Packages Available</h3>
          <p style={{ color: '#666' }}>Please check back later for investment opportunities</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '30px' }}>
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              style={{
                border: pkg.is_featured ? '2px solid #667eea' : '1px solid #ddd',
                borderRadius: '8px',
                padding: '20px',
                background: '#fff',
                position: 'relative',
                boxShadow: pkg.is_featured ? '0 4px 12px rgba(102, 126, 234, 0.2)' : 'none'
              }}
            >
              {pkg.is_featured && (
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '20px',
                  background: '#667eea',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  ⭐ FEATURED
                </div>
              )}

              <h2 style={{ marginTop: pkg.is_featured ? '10px' : '0' }}>{pkg.name}</h2>
              <p style={{ color: '#666', marginBottom: '15px', minHeight: '40px' }}>{pkg.description}</p>

              <div style={{ marginBottom: '15px' }}>
                <strong>Base Price:</strong>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea', margin: '5px 0' }}>
                  ${pkg.price.toLocaleString()}
                </p>
              </div>

              {(pkg.min_investment || pkg.max_investment) && (
                <div style={{ marginBottom: '15px' }}>
                  <strong>Investment Range:</strong>
                  <p>
                    ${(pkg.min_investment || pkg.price).toLocaleString()} - $
                    {(pkg.max_investment || pkg.price).toLocaleString()}
                  </p>
                </div>
              )}

              <div style={{ marginBottom: '15px' }}>
                <strong>Returns:</strong>
                <p>
                  <span style={{ color: '#4caf50', fontWeight: '600' }}>
                    {pkg.daily_return_percentage}%
                  </span> daily for {pkg.duration_days} days
                </p>
                <p style={{ fontSize: '14px', color: '#666' }}>
                  Total: <span style={{ fontWeight: '600', color: '#2196f3' }}>
                    {pkg.max_return_percentage}%
                  </span> ROI
                </p>
              </div>

              {pkg.features && pkg.features.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <strong>Features:</strong>
                  <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} style={{ marginBottom: '5px' }}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => handleInvest(pkg)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: pkg.is_featured ? '#667eea' : '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '16px',
                  transition: 'opacity 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                Invest Now
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '40px', padding: '20px', background: '#f5f5f5', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>💡 Investment Information</h4>
        <ul style={{ margin: '0', paddingLeft: '20px', color: '#666', fontSize: '14px', lineHeight: '1.8' }}>
          <li><strong>Robot Subscription Required:</strong> Activate robot ($100) before purchasing packages</li>
          <li><strong>Daily Returns:</strong> ROI is distributed daily to your wallet automatically</li>
          <li><strong>Level Commissions:</strong> Earn from 30 levels of downline investments</li>
          <li><strong>Binary Matching:</strong> Earn from binary team volume matching</li>
          <li><strong>Rank Bonuses:</strong> Additional rewards as you achieve higher ranks</li>
          <li><strong>Withdrawal:</strong> Available balance can be withdrawn anytime (KYC required)</li>
        </ul>
      </div>
    </div>
  );
};

export default Packages;
