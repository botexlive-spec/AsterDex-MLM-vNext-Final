import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateName, validateRequired } from '../../utils/validation';

export const KYC: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    address: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
  };

  const handleNextStep = () => {
    if (step === 1) {
      // Validate step 1
      setFieldErrors({});
      const errors: Record<string, string> = {};

      // Validate full name
      const nameValidation = validateName(formData.fullName);
      if (!nameValidation.isValid && nameValidation.message) {
        errors.fullName = nameValidation.message;
      }

      // Validate date of birth
      const dobValidation = validateRequired(formData.dateOfBirth, 'Date of birth');
      if (!dobValidation.isValid && dobValidation.message) {
        errors.dateOfBirth = dobValidation.message;
      }

      // Validate address
      const addressValidation = validateRequired(formData.address, 'Address');
      if (!addressValidation.isValid && addressValidation.message) {
        errors.address = addressValidation.message;
      }

      // If there are validation errors, set them and stop
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
    }

    setStep(step + 1);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <button onClick={() => navigate('/dashboard')} style={{ marginBottom: '20px', padding: '10px 20px', cursor: 'pointer' }}>
        ← Back to Dashboard
      </button>

      <h1>KYC Verification</h1>
      <p>Complete your KYC to unlock withdrawals and premium features</p>

      <div style={{ marginTop: '30px', padding: '20px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: step >= 1 ? '#667eea' : '#ddd',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px'
            }}>
              1
            </div>
            <p style={{ fontSize: '12px', color: step >= 1 ? '#667eea' : '#999' }}>Personal Info</p>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: step >= 2 ? '#667eea' : '#ddd',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px'
            }}>
              2
            </div>
            <p style={{ fontSize: '12px', color: step >= 2 ? '#667eea' : '#999' }}>Documents</p>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: step >= 3 ? '#667eea' : '#ddd',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px'
            }}>
              3
            </div>
            <p style={{ fontSize: '12px', color: step >= 3 ? '#667eea' : '#999' }}>Verification</p>
          </div>
        </div>

        {step === 1 && (
          <div>
            <h3>Personal Information</h3>
            <div style={{ marginTop: '20px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                  Full Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: fieldErrors.fullName ? '2px solid #ef4444' : '1px solid #ddd',
                    background: fieldErrors.fullName ? '#fef2f2' : 'white'
                  }}
                />
                {fieldErrors.fullName && (
                  <small style={{ display: 'block', marginTop: '5px', color: '#ef4444', fontSize: '12px', fontWeight: '500' }}>
                    {fieldErrors.fullName}
                  </small>
                )}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                  Date of Birth <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: fieldErrors.dateOfBirth ? '2px solid #ef4444' : '1px solid #ddd',
                    background: fieldErrors.dateOfBirth ? '#fef2f2' : 'white'
                  }}
                />
                {fieldErrors.dateOfBirth && (
                  <small style={{ display: 'block', marginTop: '5px', color: '#ef4444', fontSize: '12px', fontWeight: '500' }}>
                    {fieldErrors.dateOfBirth}
                  </small>
                )}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
                  Address <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your full address"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: fieldErrors.address ? '2px solid #ef4444' : '1px solid #ddd',
                    background: fieldErrors.address ? '#fef2f2' : 'white',
                    minHeight: '80px'
                  }}
                />
                {fieldErrors.address && (
                  <small style={{ display: 'block', marginTop: '5px', color: '#ef4444', fontSize: '12px', fontWeight: '500' }}>
                    {fieldErrors.address}
                  </small>
                )}
              </div>
            </div>
            <button
              onClick={handleNextStep}
              style={{
                padding: '12px 30px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Next Step
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3>Upload Documents</h3>
            <div style={{ marginTop: '20px' }}>
              <div style={{ marginBottom: '20px', padding: '20px', border: '2px dashed #ddd', borderRadius: '6px', textAlign: 'center' }}>
                <p style={{ fontWeight: '600', marginBottom: '10px' }}>ID Proof (Passport/Driver's License)</p>
                <input type="file" accept="image/*,.pdf" />
              </div>
              <div style={{ marginBottom: '20px', padding: '20px', border: '2px dashed #ddd', borderRadius: '6px', textAlign: 'center' }}>
                <p style={{ fontWeight: '600', marginBottom: '10px' }}>Address Proof (Utility Bill/Bank Statement)</p>
                <input type="file" accept="image/*,.pdf" />
              </div>
              <div style={{ marginBottom: '20px', padding: '20px', border: '2px dashed #ddd', borderRadius: '6px', textAlign: 'center' }}>
                <p style={{ fontWeight: '600', marginBottom: '10px' }}>Selfie with ID</p>
                <input type="file" accept="image/*" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setStep(1)}
                style={{ padding: '12px 30px', background: '#ddd', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Back
              </button>
              <button
                onClick={handleNextStep}
                style={{ padding: '12px 30px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
              >
                Next Step
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>✓</div>
            <h3>Review & Submit</h3>
            <p style={{ color: '#666', marginTop: '10px', marginBottom: '30px' }}>
              Please review your information before submitting. Your KYC will be reviewed within 24-48 hours.
            </p>
            <button
              onClick={() => alert('KYC submission coming soon!')}
              style={{
                padding: '15px 40px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '16px'
              }}
            >
              Submit KYC
            </button>
          </div>
        )}
      </div>

      <div style={{ marginTop: '30px', padding: '20px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
        <strong>⚠️ Important:</strong>
        <p style={{ marginTop: '10px', fontSize: '14px' }}>
          Make sure all documents are clear and readable. Blurry or incomplete documents will be rejected.
          KYC verification is required for withdrawals above $50.
        </p>
      </div>
    </div>
  );
};

export default KYC;
