import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAvailablePackages, purchasePackage, canPurchasePackage } from '../../services/package.service';
import { Package } from '../../types/package.types';
import toast from 'react-hot-toast';
import apiClient from '../../utils/api-client';

interface PurchaseModalProps {
  package: Package | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  walletBalance: number;
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({ package: pkg, isOpen, onClose, onSuccess, walletBalance }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (pkg && isOpen) {
      setAmount(pkg.min_investment?.toString() || pkg.price.toString());
    }
  }, [pkg, isOpen]);

  if (!isOpen || !pkg) return null;

  const handlePurchase = async () => {
    try {
      setLoading(true);
      const investmentAmount = parseFloat(amount);

      if (isNaN(investmentAmount) || investmentAmount <= 0) {
        toast.error('Please enter a valid investment amount');
        return;
      }

      const minInvest = pkg.min_investment || pkg.price;
      const maxInvest = pkg.max_investment || pkg.price;

      if (investmentAmount < minInvest) {
        toast.error(`Minimum investment is $${minInvest.toLocaleString()}`);
        return;
      }

      if (investmentAmount > maxInvest) {
        toast.error(`Maximum investment is $${maxInvest.toLocaleString()}`);
        return;
      }

      if (investmentAmount > walletBalance) {
        toast.error(`Insufficient balance. You have $${walletBalance.toLocaleString()}`);
        return;
      }

      const result = await purchasePackage({
        package_id: pkg.id.toString(),
        amount: investmentAmount,
        payment_password: '', // Not used in backend, auth is via JWT
      });

      toast.success(result.message || 'Package purchased successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(error.message || 'Failed to purchase package');
    } finally {
      setLoading(false);
    }
  };

  const dailyEarnings = (parseFloat(amount) || 0) * (pkg.daily_return_percentage / 100);
  const totalReturn = (parseFloat(amount) || 0) * (pkg.max_return_percentage / 100);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '16px 16px 0 0'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
            Purchase {pkg.name}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontSize: '20px',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {/* Wallet Balance */}
          <div style={{
            background: '#f8f9fa',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '1px solid #e0e0e0'
          }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
              💰 Available Balance
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#2c3e50' }}>
              ${walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Investment Amount */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#333',
              marginBottom: '8px'
            }}>
              Investment Amount ($)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={pkg.min_investment || pkg.price}
              max={pkg.max_investment || pkg.price}
              step="0.01"
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '18px',
                fontWeight: '600',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
            <div style={{ fontSize: '12px', color: '#666', marginTop: '6px' }}>
              Min: ${(pkg.min_investment || pkg.price).toLocaleString()} •
              Max: ${(pkg.max_investment || pkg.price).toLocaleString()}
            </div>
          </div>

          {/* Returns Preview */}
          <div style={{
            background: '#f0f7ff',
            padding: '16px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '1px solid #d0e7ff'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                📈 Daily Earnings
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#4caf50' }}>
                ${dailyEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / day
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                💎 Total Return ({pkg.duration_days} days)
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#2196f3' }}>
                ${totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({pkg.max_return_percentage}% ROI)
              </div>
            </div>
          </div>

          {/* Package Details */}
          <div style={{
            padding: '16px',
            background: '#fafafa',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
              📋 Package Details
            </div>
            <div style={{ fontSize: '13px', lineHeight: '1.8', color: '#666' }}>
              • {pkg.daily_return_percentage}% daily returns for {pkg.duration_days} days<br />
              • {pkg.max_return_percentage}% total ROI<br />
              • Automatic daily distribution<br />
              • Level commissions for your sponsors
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1,
                padding: '14px',
                background: '#e0e0e0',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '16px',
                color: '#666',
                opacity: loading ? 0.5 : 1
              }}
            >
              Cancel
            </button>
            <button
              onClick={handlePurchase}
              disabled={loading}
              style={{
                flex: 2,
                padding: '14px',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                fontSize: '16px',
                color: 'white',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.2s'
              }}
            >
              {loading ? '⏳ Processing...' : '✅ Confirm Purchase'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Packages: React.FC = () => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    loadPackages();
    loadWalletBalance();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const packagesData = await getAvailablePackages();
      console.log('📦 Loaded packages:', packagesData);
      setPackages(packagesData);
    } catch (error: any) {
      console.error('Error loading packages:', error);
      toast.error(error.message || 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const loadWalletBalance = async () => {
    try {
      const response = await apiClient.get<{ user: { wallet_balance: number } }>('/dashboard');
      if (response.data?.user) {
        setWalletBalance(response.data.user.wallet_balance);
      }
    } catch (error) {
      console.error('Error loading wallet balance:', error);
    }
  };

  const handleInvest = (pkg: Package) => {
    setSelectedPackage(pkg);
    setShowPurchaseModal(true);
  };

  const handlePurchaseSuccess = () => {
    loadWalletBalance();
    toast.success('🎉 Package activated! Daily returns will start tomorrow.');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px', animation: 'pulse 2s infinite' }}>📦</div>
        <p style={{ fontSize: '18px', color: '#666' }}>Loading investment packages...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '10px 20px',
            background: '#f5f5f5',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            marginBottom: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>←</span> Back to Dashboard
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700', color: '#2c3e50' }}>
              Investment Packages
            </h1>
            <p style={{ margin: 0, fontSize: '16px', color: '#666' }}>
              Choose a package that fits your investment goals
            </p>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '12px 24px',
            borderRadius: '12px',
            color: 'white'
          }}>
            <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>
              💰 Available Balance
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>
              ${walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      {packages.length === 0 ? (
        <div style={{
          padding: '60px',
          textAlign: 'center',
          background: '#f5f5f5',
          borderRadius: '16px',
          marginTop: '30px'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📦</div>
          <h3 style={{ fontSize: '24px', marginBottom: '8px', color: '#333' }}>No Packages Available</h3>
          <p style={{ color: '#666', fontSize: '16px' }}>Please check back later for investment opportunities</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          marginTop: '30px'
        }}>
          {packages.map((pkg, index) => {
            const isPopular = index === 1; // Middle package is popular
            return (
              <div
                key={pkg.id}
                style={{
                  border: isPopular ? '2px solid #667eea' : '1px solid #e0e0e0',
                  borderRadius: '16px',
                  padding: '24px',
                  background: 'white',
                  position: 'relative',
                  boxShadow: isPopular
                    ? '0 8px 24px rgba(102, 126, 234, 0.2)'
                    : '0 2px 8px rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.3s ease',
                  transform: isPopular ? 'scale(1.02)' : 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = isPopular ? 'scale(1.02)' : 'scale(1)';
                  e.currentTarget.style.boxShadow = isPopular
                    ? '0 8px 24px rgba(102, 126, 234, 0.2)'
                    : '0 2px 8px rgba(0, 0, 0, 0.08)';
                }}
              >
                {isPopular && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    right: '24px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '6px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '700',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                  }}>
                    ⭐ MOST POPULAR
                  </div>
                )}

                {/* Package Name */}
                <h2 style={{
                  marginTop: isPopular ? '16px' : '0',
                  marginBottom: '8px',
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#2c3e50'
                }}>
                  {pkg.name}
                </h2>

                {/* Price Range */}
                <div style={{
                  fontSize: '36px',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '4px'
                }}>
                  ${(pkg.min_investment || pkg.price).toLocaleString()}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                  ${(pkg.min_investment || pkg.price).toLocaleString()} - ${(pkg.max_investment || pkg.price).toLocaleString()}
                </div>

                {/* Returns */}
                <div style={{
                  background: '#f0f7ff',
                  padding: '16px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  border: '1px solid #d0e7ff'
                }}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Daily Returns</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#4caf50' }}>
                      {pkg.daily_return_percentage}% <span style={{ fontSize: '14px', fontWeight: '400', color: '#666' }}>daily for {pkg.duration_days} days</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Total ROI</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#2196f3' }}>
                      {pkg.max_return_percentage}% <span style={{ fontSize: '14px', fontWeight: '400', color: '#666' }}>ROI</span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '12px' }}>
                    ✨ Includes:
                  </div>
                  <div style={{ fontSize: '14px', lineHeight: '2', color: '#666' }}>
                    ✓ Daily ROI distribution<br />
                    ✓ Level income commissions<br />
                    ✓ Binary matching bonus<br />
                    ✓ Rank advancement rewards
                  </div>
                </div>

                {/* Invest Button */}
                <button
                  onClick={() => handleInvest(pkg)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: isPopular
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '16px',
                    boxShadow: isPopular
                      ? '0 4px 12px rgba(102, 126, 234, 0.4)'
                      : '0 4px 12px rgba(76, 175, 80, 0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = isPopular
                      ? '0 6px 16px rgba(102, 126, 234, 0.5)'
                      : '0 6px 16px rgba(76, 175, 80, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = isPopular
                      ? '0 4px 12px rgba(102, 126, 234, 0.4)'
                      : '0 4px 12px rgba(76, 175, 80, 0.3)';
                  }}
                >
                  Invest Now →
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Information Section */}
      <div style={{
        marginTop: '48px',
        padding: '24px',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        borderRadius: '16px',
        border: '1px solid #e0e0e0'
      }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '700', color: '#2c3e50' }}>
          💡 Investment Information
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', background: 'white', borderRadius: '12px' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🤖</div>
            <div style={{ fontWeight: '600', marginBottom: '4px', color: '#333' }}>Robot Subscription</div>
            <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
              Activate robot ($100) before purchasing packages
            </div>
          </div>
          <div style={{ padding: '16px', background: 'white', borderRadius: '12px' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📈</div>
            <div style={{ fontWeight: '600', marginBottom: '4px', color: '#333' }}>Daily Returns</div>
            <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
              ROI distributed daily to your wallet automatically
            </div>
          </div>
          <div style={{ padding: '16px', background: 'white', borderRadius: '12px' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎯</div>
            <div style={{ fontWeight: '600', marginBottom: '4px', color: '#333' }}>Level Commissions</div>
            <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
              Earn from 30 levels of downline investments
            </div>
          </div>
          <div style={{ padding: '16px', background: 'white', borderRadius: '12px' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>💰</div>
            <div style={{ fontWeight: '600', marginBottom: '4px', color: '#333' }}>Withdrawal</div>
            <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.6' }}>
              Available balance can be withdrawn anytime (KYC required)
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      <PurchaseModal
        package={selectedPackage}
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onSuccess={handlePurchaseSuccess}
        walletBalance={walletBalance}
      />
    </div>
  );
};

export default Packages;
