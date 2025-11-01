/**
 * Register Page
 * New user registration with referral code support
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { signUp } from '../../services/auth.service';
import { validateEmail, validatePassword, validatePasswordMatch, validateName } from '../../utils/validation';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref') || '';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    referral_code: referralCode,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Validation
    const errors: Record<string, string> = {};

    // Validate full name
    const nameValidation = validateName(formData.full_name);
    if (!nameValidation.isValid && nameValidation.message) {
      errors.full_name = nameValidation.message;
    }

    // Validate email
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid && emailValidation.message) {
      errors.email = emailValidation.message;
    }

    // Validate password
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid && passwordValidation.message) {
      errors.password = passwordValidation.message;
    }

    // Validate password match
    const passwordMatchValidation = validatePasswordMatch(formData.password, formData.confirmPassword);
    if (!passwordMatchValidation.isValid && passwordMatchValidation.message) {
      errors.confirmPassword = passwordMatchValidation.message;
    }

    // Check terms agreement
    if (!agreedToTerms) {
      setError('You must agree to the terms and conditions');
      return;
    }

    // If there are validation errors, set them and stop
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      await signUp({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        referral_code: formData.referral_code || undefined,
      });

      // Show success message
      alert('Registration successful! ✅\n\nYour account has been created with:\n✓ MLM referral system activated\n✓ Binary tree placement complete\n✓ Wallet initialized\n\nPlease check your email for verification.');
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Update form data
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear field error when user starts correcting input
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Also clear password match error when either password field changes
    if ((name === 'password' || name === 'confirmPassword') && fieldErrors.confirmPassword) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.confirmPassword;
        return newErrors;
      });
    }
  };

  return (
    <div className="register-page">
      {/* Home Navigation */}
      <button
        onClick={() => navigate('/')}
        className="home-button"
        aria-label="Go to homepage"
      >
        ← Back to Home
      </button>

      <div className="register-container">
        <div className="register-card">
          {/* Logo - Clickable */}
          <div className="register-header">
            <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
              🚀 Join Finaster
            </h1>
            <p>Create your account and start earning</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-error">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          {/* Referral Code Alert */}
          {referralCode && (
            <div className="alert alert-success">
              <span>🎉</span>
              <p>Referral code applied: <strong>{referralCode}</strong></p>
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label htmlFor="full_name">
                Full Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="John Doe"
                required
                className={fieldErrors.full_name ? 'error' : ''}
              />
              {fieldErrors.full_name && (
                <small className="error-message">{fieldErrors.full_name}</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">
                Email Address <span className="required">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                required
                autoComplete="email"
                className={fieldErrors.email ? 'error' : ''}
              />
              {fieldErrors.email && (
                <small className="error-message">{fieldErrors.email}</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Password <span className="required">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                required
                autoComplete="new-password"
                className={fieldErrors.password ? 'error' : ''}
              />
              {fieldErrors.password ? (
                <small className="error-message">{fieldErrors.password}</small>
              ) : (
                <small>Must be at least 8 characters long</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm Password <span className="required">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
                required
                autoComplete="new-password"
                className={fieldErrors.confirmPassword ? 'error' : ''}
              />
              {fieldErrors.confirmPassword && (
                <small className="error-message">{fieldErrors.confirmPassword}</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="referral_code">
                Referral Code (Optional)
              </label>
              <input
                type="text"
                id="referral_code"
                name="referral_code"
                value={formData.referral_code}
                onChange={handleChange}
                placeholder="Enter referral code"
              />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  required
                />
                <span>
                  I agree to the{' '}
                  <a href="/terms" target="_blank">Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" target="_blank">Privacy Policy</a>
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="btn-register"
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner">Creating Account...</span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="register-footer">
            <p>
              Already have an account?{' '}
              <a href="/login">Sign in here</a>
            </p>
          </div>
        </div>

        {/* Benefits Panel */}
        <div className="benefits-panel">
          <h2>Why Join Finaster?</h2>

          <div className="benefit-list">
            <div className="benefit-item">
              <span className="benefit-icon">💰</span>
              <div className="benefit-content">
                <h3>30-Level Income</h3>
                <p>Earn commissions from 30 levels deep in your downline</p>
              </div>
            </div>

            <div className="benefit-item">
              <span className="benefit-icon">🎯</span>
              <div className="benefit-content">
                <h3>Binary Matching Bonuses</h3>
                <p>Earn up to $21M in matching bonuses</p>
              </div>
            </div>

            <div className="benefit-item">
              <span className="benefit-icon">📈</span>
              <div className="benefit-content">
                <h3>DEX Trading</h3>
                <p>Integrated decentralized exchange for trading</p>
              </div>
            </div>

            <div className="benefit-item">
              <span className="benefit-icon">🏆</span>
              <div className="benefit-content">
                <h3>Rank Rewards</h3>
                <p>Achieve 10 ranks with rewards up to $50,000</p>
              </div>
            </div>

            <div className="benefit-item">
              <span className="benefit-icon">🚀</span>
              <div className="benefit-content">
                <h3>Booster Income</h3>
                <p>Extra rewards for qualifying achievements</p>
              </div>
            </div>

            <div className="benefit-item">
              <span className="benefit-icon">💎</span>
              <div className="benefit-content">
                <h3>ROI Earnings</h3>
                <p>5-12% ROI on your investments</p>
              </div>
            </div>
          </div>

          <div className="stats-box">
            <h3>Join 10,000+ Members</h3>
            <div className="stats">
              <div className="stat">
                <strong>$50M+</strong>
                <span>Total Volume</span>
              </div>
              <div className="stat">
                <strong>$5M+</strong>
                <span>Paid Out</span>
              </div>
              <div className="stat">
                <strong>100%</strong>
                <span>Secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .register-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
        }

        .home-button {
          position: absolute;
          top: 20px;
          left: 20px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.3);
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          backdrop-filter: blur(10px);
          z-index: 10;
        }

        .home-button:hover {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateX(-2px);
        }

        .register-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          max-width: 1200px;
          width: 100%;
        }

        @media (max-width: 968px) {
          .register-container {
            grid-template-columns: 1fr;
          }
          .benefits-panel {
            display: none;
          }
        }

        .register-card {
          background: white;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .register-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .register-header h1 {
          font-size: 32px;
          margin: 0 0 10px 0;
          color: #333;
        }

        .register-header p {
          color: #666;
          margin: 0;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .alert-error {
          background: #fee;
          border: 1px solid #fcc;
          color: #c33;
        }

        .alert-success {
          background: #efe;
          border: 1px solid #cfc;
          color: #3c3;
        }

        .register-form {
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #333;
          font-weight: 600;
        }

        .form-group label .required {
          color: #ef4444;
          margin-left: 2px;
        }

        .form-group input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 16px;
          transition: all 0.2s;
        }

        .form-group input:focus {
          outline: none;
          border-color: #667eea;
        }

        .form-group input.error {
          border-color: #ef4444;
          background-color: #fef2f2;
        }

        .form-group input.error:focus {
          border-color: #dc2626;
        }

        .form-group small {
          display: block;
          margin-top: 5px;
          color: #666;
          font-size: 12px;
        }

        .form-group small.error-message {
          color: #ef4444;
          font-weight: 500;
        }

        .checkbox-group {
          margin: 24px 0;
        }

        .checkbox-label {
          display: flex;
          gap: 10px;
          cursor: pointer;
          align-items: flex-start;
        }

        .checkbox-label input {
          margin-top: 3px;
        }

        .checkbox-label a {
          color: #667eea;
          text-decoration: none;
        }

        .btn-register {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .btn-register:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .btn-register:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .register-footer {
          text-align: center;
          margin-top: 20px;
          color: #666;
        }

        .register-footer a {
          color: #667eea;
          text-decoration: none;
          font-weight: 600;
        }

        .benefits-panel {
          color: white;
          padding: 40px;
        }

        .benefits-panel h2 {
          font-size: 36px;
          margin: 0 0 30px 0;
        }

        .benefit-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 30px;
        }

        .benefit-item {
          display: flex;
          gap: 15px;
          background: rgba(255, 255, 255, 0.1);
          padding: 20px;
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }

        .benefit-icon {
          font-size: 32px;
          flex-shrink: 0;
        }

        .benefit-content h3 {
          margin: 0 0 5px 0;
          font-size: 18px;
        }

        .benefit-content p {
          margin: 0;
          opacity: 0.9;
          font-size: 14px;
        }

        .stats-box {
          background: rgba(255, 255, 255, 0.1);
          padding: 30px;
          border-radius: 12px;
          backdrop-filter: blur(10px);
          text-align: center;
        }

        .stats-box h3 {
          margin: 0 0 20px 0;
          font-size: 24px;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .stat strong {
          font-size: 24px;
        }

        .stat span {
          font-size: 12px;
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
};

export default Register;
