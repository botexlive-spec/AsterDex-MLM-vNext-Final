/**
 * NEW SINGLE PACKAGE ARCHITECTURE - Investment with Slider
 * $100 - $100,000 range with $100 increments
 * 0.4% daily ROI
 * 15-level ROI-on-ROI commission
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAvailablePackages, purchasePackage } from '../../services/package.service';
import { Package } from '../../types/package.types';
import toast from 'react-hot-toast';
import apiClient from '../../utils/api-client';

export const Packages: React.FC = () => {
  const navigate = useNavigate();
  const [pkg, setPackage] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [investmentAmount, setInvestmentAmount] = useState(1000); // Default $1,000
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadPackage();
    loadWalletBalance();
  }, []);

  const loadPackage = async () => {
    try {
      setLoading(true);
      const packages = await getAvailablePackages();
      if (packages && packages.length > 0) {
        setPackage(packages[0]); // Single package
        console.log('📦 Loaded package:', packages[0]);
      }
    } catch (error: any) {
      console.error('Error loading package:', error);
      toast.error(error.message || 'Failed to load investment package');
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

  const handleInvest = () => {
    if (!pkg) return;

    // Validate amount
    if (investmentAmount < pkg.min_investment) {
      toast.error(`Minimum investment is $${pkg.min_investment.toLocaleString()}`);
      return;
    }

    if (investmentAmount > pkg.max_investment) {
      toast.error(`Maximum investment is $${pkg.max_investment.toLocaleString()}`);
      return;
    }

    if (investmentAmount % (pkg.slider_step || 100) !== 0) {
      toast.error(`Investment must be in multiples of $${pkg.slider_step || 100}`);
      return;
    }

    if (investmentAmount > walletBalance) {
      toast.error(`Insufficient balance. You have $${walletBalance.toLocaleString()}`);
      return;
    }

    setShowPurchaseModal(true);
  };

  const handleConfirmPurchase = async () => {
    if (!pkg) return;

    try {
      setPurchasing(true);

      const result = await purchasePackage({
        package_id: pkg.id.toString(),
        amount: investmentAmount,
        payment_password: '',
      });

      toast.success(result.message || 'Investment successful!');
      setShowPurchaseModal(false);
      loadWalletBalance();

      // Redirect to dashboard after successful purchase
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(error.message || 'Failed to process investment');
    } finally {
      setPurchasing(false);
    }
  };

  // Calculate ROI values
  const dailyROI = pkg ? (investmentAmount * pkg.daily_return_percentage) / 100 : 0;
  const monthlyROI = dailyROI * 30;
  const annualROI = dailyROI * 365;

  if (loading) {
    return (
      <div style={{
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignments: 'center',
        justifyContent: 'center',
        padding: '40px'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>📊</div>
        <p style={{ fontSize: '18px', color: '#666' }}>Loading investment package...</p>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>❌</div>
        <h2>Package Not Available</h2>
        <p>Please contact support if this problem persists.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
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
            marginBottom: '20px'
          }}
        >
          ← Back to Dashboard
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '700', color: '#2c3e50' }}>
              {pkg.name}
            </h1>
            <p style={{ margin: 0, fontSize: '16px', color: '#666' }}>
              {pkg.description}
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

      {/* Main Investment Card */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        border: '2px solid #667eea'
      }}>
        {/* Investment Amount Display */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '16px', color: '#666', marginBottom: '10px' }}>
            Investment Amount
          </div>
          <div style={{
            fontSize: '56px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '10px'
          }}>
            ${investmentAmount.toLocaleString()}
          </div>
          <div style={{ fontSize: '14px', color: '#999' }}>
            Range: ${pkg.min_investment.toLocaleString()} - ${pkg.max_investment.toLocaleString()}
          </div>
        </div>

        {/* Slider */}
        <div style={{ marginBottom: '40px', padding: '0 20px' }}>
          <input
            type="range"
            min={pkg.slider_min || pkg.min_investment}
            max={pkg.slider_max || pkg.max_investment}
            step={pkg.slider_step || 100}
            value={investmentAmount}
            onChange={(e) => setInvestmentAmount(parseInt(e.target.value))}
            style={{
              width: '100%',
              height: '8px',
              borderRadius: '4px',
              background: `linear-gradient(to right, #667eea 0%, #667eea ${((investmentAmount - pkg.min_investment) / (pkg.max_investment - pkg.min_investment)) * 100}%, #e0e0e0 ${((investmentAmount - pkg.min_investment) / (pkg.max_investment - pkg.min_investment)) * 100}%, #e0e0e0 100%)`,
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none',
              WebkitAppearance: 'none'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '12px', color: '#999' }}>
            <span>${pkg.min_investment.toLocaleString()}</span>
            <span>$25K</span>
            <span>$50K</span>
            <span>$75K</span>
            <span>${pkg.max_investment.toLocaleString()}</span>
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[100, 500, 1000, 5000, 10000, 25000, 50000, 100000].map(amount => (
            <button
              key={amount}
              onClick={() => setInvestmentAmount(amount)}
              style={{
                padding: '10px 20px',
                background: investmentAmount === amount ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f5f5f5',
                color: investmentAmount === amount ? 'white' : '#666',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
            >
              ${(amount / 1000)}K
            </button>
          ))}
        </div>

        {/* ROI Projections */}
        <div style={{
          background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
          padding: '30px',
          borderRadius: '16px',
          marginBottom: '30px',
          border: '2px solid #4caf50'
        }}>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#2E7D32', marginBottom: '20px', textAlign: 'center' }}>
            📈 Your ROI Projections ({pkg.daily_return_percentage}% Daily)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#2E7D32', marginBottom: '5px' }}>Daily ROI</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#4caf50' }}>
                ${dailyROI.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#2E7D32', marginBottom: '5px' }}>Monthly ROI</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#4caf50' }}>
                ${monthlyROI.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', color: '#2E7D32', marginBottom: '5px' }}>Annual ROI</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#4caf50' }}>
                ${annualROI.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px', padding: '15px', background: 'white', borderRadius: '8px', fontSize: '13px', color: '#2E7D32' }}>
            💡 <strong>Unlimited Potential:</strong> Your investment generates {pkg.daily_return_percentage}% daily ROI indefinitely. No expiry date, no ROI limit!
          </div>
        </div>

        {/* Features Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '30px' }}>
          <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '10px' }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>🔄</div>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Lifetime ROI</div>
            <div style={{ fontSize: '13px', color: '#666' }}>No expiry date - earn forever</div>
          </div>

          <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '10px' }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>📊</div>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>15-Level Commission</div>
            <div style={{ fontSize: '13px', color: '#666' }}>ROI-on-ROI from downline</div>
          </div>

          <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '10px' }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>🚀</div>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Booster Income</div>
            <div style={{ fontSize: '13px', color: '#666' }}>Extra 0.1% with 3 directs</div>
          </div>

          <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '10px' }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>🎁</div>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Monthly Rewards</div>
            <div style={{ fontSize: '13px', color: '#666' }}>40:40:20 business structure</div>
          </div>
        </div>

        {/* Invest Button */}
        <button
          onClick={handleInvest}
          disabled={investmentAmount > walletBalance}
          style={{
            width: '100%',
            padding: '20px',
            background: investmentAmount > walletBalance
              ? '#ccc'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: investmentAmount > walletBalance ? 'not-allowed' : 'pointer',
            fontWeight: '700',
            fontSize: '18px',
            boxShadow: investmentAmount > walletBalance ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.4)',
            transition: 'all 0.2s'
          }}
        >
          {investmentAmount > walletBalance
            ? `Insufficient Balance (Need $${(investmentAmount - walletBalance).toLocaleString()})`
            : `Invest $${investmentAmount.toLocaleString()} Now →`}
        </button>
      </div>

      {/* Purchase Confirmation Modal */}
      {showPurchaseModal && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            maxWidth: '500px',
            width: '90%',
            padding: '30px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#2c3e50' }}>
              Confirm Investment
            </h2>

            <div style={{ marginBottom: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Investment Amount</div>
              <div style={{ fontSize: '36px', fontWeight: '700', color: '#667eea', marginBottom: '15px' }}>
                ${investmentAmount.toLocaleString()}
              </div>

              <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '14px', color: '#666' }}>Daily ROI:</span>
                  <span style={{ fontSize: '16px', fontWeight: '600', color: '#4caf50' }}>
                    ${dailyROI.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#666' }}>New Balance:</span>
                  <span style={{ fontSize: '16px', fontWeight: '600' }}>
                    ${(walletBalance - investmentAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowPurchaseModal(false)}
                disabled={purchasing}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#e0e0e0',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: purchasing ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '16px',
                  opacity: purchasing ? 0.5 : 1
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmPurchase}
                disabled={purchasing}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: purchasing ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: purchasing ? 'not-allowed' : 'pointer',
                  fontWeight: '700',
                  fontSize: '16px',
                  color: 'white',
                  boxShadow: purchasing ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.4)'
                }}
              >
                {purchasing ? '⏳ Processing...' : '✅ Confirm Investment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Packages;
