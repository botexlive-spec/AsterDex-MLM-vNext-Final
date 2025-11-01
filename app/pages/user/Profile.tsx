import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateName, validatePhone, validateZipCode } from '../../utils/validation';

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    fullName: 'John Doe',
    email: 'user@asterdex.com',
    phone: '+1 234 567 8900',
    country: 'United States',
    city: 'New York',
    address: '123 Main Street',
    zipCode: '10001'
  });

  const handleSave = () => {
    setFieldErrors({});

    // Validation
    const errors: Record<string, string> = {};

    // Validate full name
    const nameValidation = validateName(formData.fullName);
    if (!nameValidation.isValid && nameValidation.message) {
      errors.fullName = nameValidation.message;
    }

    // Validate phone (optional)
    const phoneValidation = validatePhone(formData.phone, false);
    if (!phoneValidation.isValid && phoneValidation.message) {
      errors.phone = phoneValidation.message;
    }

    // Validate ZIP code (optional)
    const zipValidation = validateZipCode(formData.zipCode, false);
    if (!zipValidation.isValid && zipValidation.message) {
      errors.zipCode = zipValidation.message;
    }

    // If there are validation errors, set them and stop
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    alert('Profile update functionality coming soon!');
    setEditing(false);
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
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <button onClick={() => navigate('/dashboard')} style={{ marginBottom: '20px', padding: '10px 20px', cursor: 'pointer' }}>
        ← Back to Dashboard
      </button>

      <h1>My Profile</h1>
      <p>Manage your account information</p>

      <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: '250px 1fr', gap: '30px' }}>
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #ddd', padding: '30px', textAlign: 'center' }}>
          <div style={{
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            margin: '0 auto 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '48px',
            fontWeight: 'bold'
          }}>
            JD
          </div>
          <h3 style={{ margin: '0 0 5px 0' }}>{formData.fullName}</h3>
          <p style={{ color: '#666', fontSize: '14px', margin: '0 0 15px 0' }}>Member since 2024</p>
          <button
            onClick={() => alert('Photo upload coming soon!')}
            style={{
              width: '100%',
              padding: '10px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Change Photo
          </button>
        </div>

        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #ddd', padding: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h3 style={{ margin: '0' }}>Personal Information</h3>
            <button
              onClick={() => editing ? handleSave() : setEditing(true)}
              style={{
                padding: '10px 20px',
                background: editing ? '#4caf50' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              {editing ? '💾 Save' : '✏️ Edit'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600' }}>
                Full Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                disabled={!editing}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: fieldErrors.fullName ? '2px solid #ef4444' : '1px solid #ddd',
                  fontSize: '14px',
                  background: fieldErrors.fullName ? '#fef2f2' : (editing ? 'white' : '#f5f5f5')
                }}
              />
              {fieldErrors.fullName && (
                <small style={{ display: 'block', marginTop: '5px', color: '#ef4444', fontSize: '12px', fontWeight: '500' }}>
                  {fieldErrors.fullName}
                </small>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600' }}>Email</label>
              <input
                type="email"
                value={formData.email}
                disabled
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  background: '#f5f5f5'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600' }}>Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!editing}
                placeholder="+1 234-567-8900"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: fieldErrors.phone ? '2px solid #ef4444' : '1px solid #ddd',
                  fontSize: '14px',
                  background: fieldErrors.phone ? '#fef2f2' : (editing ? 'white' : '#f5f5f5')
                }}
              />
              {fieldErrors.phone && (
                <small style={{ display: 'block', marginTop: '5px', color: '#ef4444', fontSize: '12px', fontWeight: '500' }}>
                  {fieldErrors.phone}
                </small>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600' }}>Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                disabled={!editing}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  background: editing ? 'white' : '#f5f5f5'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600' }}>City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                disabled={!editing}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  background: editing ? 'white' : '#f5f5f5'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600' }}>ZIP Code</label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                disabled={!editing}
                placeholder="12345 or 12345-6789"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: fieldErrors.zipCode ? '2px solid #ef4444' : '1px solid #ddd',
                  fontSize: '14px',
                  background: fieldErrors.zipCode ? '#fef2f2' : (editing ? 'white' : '#f5f5f5')
                }}
              />
              {fieldErrors.zipCode && (
                <small style={{ display: 'block', marginTop: '5px', color: '#ef4444', fontSize: '12px', fontWeight: '500' }}>
                  {fieldErrors.zipCode}
                </small>
              )}
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600' }}>Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!editing}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  background: editing ? 'white' : '#f5f5f5'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '30px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd', padding: '30px' }}>
        <h3 style={{ margin: '0 0 20px 0' }}>Security Settings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button
            onClick={() => alert('Password change coming soon!')}
            style={{
              padding: '15px',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: '6px',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span style={{ fontWeight: '600' }}>🔒 Change Password</span>
            <span style={{ color: '#667eea' }}>→</span>
          </button>
          <button
            onClick={() => alert('2FA setup coming soon!')}
            style={{
              padding: '15px',
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: '6px',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span style={{ fontWeight: '600' }}>🛡️ Enable Two-Factor Authentication</span>
            <span style={{ color: '#667eea' }}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
