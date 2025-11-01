import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../../components/ui/DesignSystem';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
}

interface CryptoWallet {
  id: string;
  currency: string;
  address: string;
  network: string;
  isDefault: boolean;
}

interface LoginSession {
  id: string;
  device: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
}

const SettingsNew: React.FC = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  // Profile data
  const [profileData, setProfileData] = useState({
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    dateOfBirth: '1990-05-15',
    gender: 'male',
    address: '123 Main Street, Apt 4B',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'United States'
  });

  const userInfo = {
    userId: 'USR001234567',
    memberSince: '2024-08-15',
    currentRank: 'Silver',
    rankColor: '#c0c0c0',
    profileImage: ''
  };

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Payment methods
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    {
      id: '1',
      bankName: 'Chase Bank',
      accountNumber: '****1234',
      accountName: 'John Doe',
      isDefault: true
    }
  ]);

  const [cryptoWallets, setCryptoWallets] = useState<CryptoWallet[]>([
    {
      id: '1',
      currency: 'USDT',
      address: 'TXw...abc123',
      network: 'TRC20',
      isDefault: true
    }
  ]);

  // Login sessions
  const loginSessions: LoginSession[] = [
    {
      id: '1',
      device: 'Windows PC - Chrome',
      location: 'New York, USA',
      ip: '192.168.1.100',
      lastActive: '2024-10-31 14:30:00',
      isCurrent: true
    },
    {
      id: '2',
      device: 'iPhone 13 - Safari',
      location: 'New York, USA',
      ip: '192.168.1.101',
      lastActive: '2024-10-30 09:15:00',
      isCurrent: false
    }
  ];

  // Language and Theme preferences
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState('dark');
  const [timeZone, setTimeZone] = useState('America/New_York');
  const [currency, setCurrency] = useState('USD');

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailDeposit: true,
    emailWithdraw: true,
    emailCommission: true,
    emailRankChange: true,
    emailSecurity: true,
    emailMarketing: false,
    smsDeposit: false,
    smsWithdraw: true,
    smsSecurity: true,
    pushDeposit: true,
    pushWithdraw: true,
    pushCommission: true
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedNotifications = localStorage.getItem('asterdex_notifications');
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      }

      const savedLanguage = localStorage.getItem('asterdex_language');
      if (savedLanguage) {
        setLanguage(savedLanguage);
      }

      const savedTheme = localStorage.getItem('asterdex_theme');
      if (savedTheme) {
        setTheme(savedTheme);
      }

      const savedTimeZone = localStorage.getItem('asterdex_timezone');
      if (savedTimeZone) {
        setTimeZone(savedTimeZone);
      }

      const savedCurrency = localStorage.getItem('asterdex_currency');
      if (savedCurrency) {
        setCurrency(savedCurrency);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  // Auto-save notifications to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('asterdex_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }, [notifications]);

  // Auto-save language to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('asterdex_language', language);
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  }, [language]);

  // Auto-save theme to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('asterdex_theme', theme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }, [theme]);

  // Auto-save timezone to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('asterdex_timezone', timeZone);
    } catch (error) {
      console.error('Failed to save timezone:', error);
    }
  }, [timeZone]);

  // Auto-save currency to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('asterdex_currency', currency);
    } catch (error) {
      console.error('Failed to save currency:', error);
    }
  }, [currency]);

  const referralInfo = {
    referralLink: 'https://asterdex.com/ref/JOHN123',
    referralCode: 'JOHN123',
    sponsor: {
      name: 'Jane Smith',
      userId: 'USR001234560',
      email: 'jane.smith@example.com'
    },
    placement: {
      name: 'Jane Smith',
      userId: 'USR001234560',
      position: 'Left Leg'
    }
  };

  const handleSaveProfile = () => {
    // Save profile logic
    setIsEditMode(false);
    alert('Profile updated successfully!');
  };

  const handleChangePassword = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    // Change password logic
    alert('Password changed successfully!');
    setShowPasswordForm(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const getPasswordStrength = (password: string): { strength: string; color: string; width: string } => {
    if (password.length === 0) return { strength: '', color: '', width: '0%' };
    if (password.length < 6) return { strength: 'Weak', color: 'bg-red-500', width: '33%' };
    if (password.length < 10) return { strength: 'Medium', color: 'bg-yellow-500', width: '66%' };
    return { strength: 'Strong', color: 'bg-green-500', width: '100%' };
  };

  const passwordStrength = getPasswordStrength(passwordForm.newPassword);

  const handleRevokeSession = (sessionId: string) => {
    if (confirm('Are you sure you want to revoke this session?')) {
      alert(`Session ${sessionId} revoked successfully!`);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleDownloadData = () => {
    alert('Your account data will be prepared and sent to your email within 24 hours.');
  };

  const handleDeactivateAccount = () => {
    setShowDeactivateModal(false);
    alert('Account deactivated successfully. You can reactivate it by logging in.');
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(false);
    alert('Account deletion request submitted. This action will be completed in 30 days.');
  };

  const tabs = [
    { id: 'personal', label: 'Personal Information', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'payment', label: 'Payment Methods', icon: '💳' },
    { id: 'referral', label: 'Referral Info', icon: '🔗' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' }
  ];

  const handleSaveNotifications = () => {
    toast.success('Notification preferences saved successfully!');
  };

  return (
    <>
      <Helmet>
        <title>Settings - Asterdex</title>
      </Helmet>

      <div className="space-y-6">
        {/* Profile Header */}
        <Card className="bg-gray-800 border-gray-700">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-gray-700">
                {userInfo.profileImage ? (
                  <img src={userInfo.profileImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                  profileData.fullName.split(' ').map(n => n[0]).join('')
                )}
              </div>
              <button className="absolute bottom-0 right-0 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full p-2 border-2 border-gray-800">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-white mb-2">{profileData.fullName}</h1>
              <div className="text-gray-400 mb-3">{profileData.email}</div>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">User ID:</span>
                  <span className="text-white font-mono text-sm">{userInfo.userId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">Member since:</span>
                  <span className="text-white text-sm">
                    {new Date(userInfo.memberSince).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">Current Rank:</span>
                  <Badge style={{ backgroundColor: userInfo.rankColor }}>
                    {userInfo.currentRank}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-700">
          <div className="flex overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {/* Personal Information Tab */}
          {activeTab === 'personal' && (
            <Card className="bg-gray-800 border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Personal Information</h2>
                  <p className="text-gray-400 text-sm mt-1">Manage your personal details</p>
                </div>
                <Button
                  variant={isEditMode ? 'primary' : 'outline'}
                  onClick={() => setIsEditMode(!isEditMode)}
                >
                  {isEditMode ? 'Cancel' : 'Edit'}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    disabled={!isEditMode}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    disabled={!isEditMode}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    disabled={!isEditMode}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={profileData.dateOfBirth}
                    onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                    disabled={!isEditMode}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
                  <select
                    value={profileData.gender}
                    onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                    disabled={!isEditMode}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
                  <input
                    type="text"
                    value={profileData.country}
                    onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                    disabled={!isEditMode}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                  <input
                    type="text"
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    disabled={!isEditMode}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                  <input
                    type="text"
                    value={profileData.city}
                    onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                    disabled={!isEditMode}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">State</label>
                  <input
                    type="text"
                    value={profileData.state}
                    onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                    disabled={!isEditMode}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">ZIP Code</label>
                  <input
                    type="text"
                    value={profileData.zipCode}
                    onChange={(e) => setProfileData({ ...profileData, zipCode: e.target.value })}
                    disabled={!isEditMode}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {isEditMode && (
                <div className="mt-6 flex justify-end">
                  <Button onClick={handleSaveProfile}>
                    Save Changes
                  </Button>
                </div>
              )}
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Change Password */}
              <Card className="bg-gray-800 border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">Change Password</h3>
                    <p className="text-gray-400 text-sm mt-1">Update your password regularly</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                  >
                    {showPasswordForm ? 'Cancel' : 'Change Password'}
                  </Button>
                </div>

                {showPasswordForm && (
                  <div className="space-y-4 mt-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                      {passwordForm.newPassword && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-400">Password Strength:</span>
                            <span className={`font-medium ${
                              passwordStrength.strength === 'Weak' ? 'text-red-400' :
                              passwordStrength.strength === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                            }`}>
                              {passwordStrength.strength}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${passwordStrength.color} transition-all duration-300`}
                              style={{ width: passwordStrength.width }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    <Button onClick={handleChangePassword}>
                      Update Password
                    </Button>
                  </div>
                )}
              </Card>

              {/* Two-Factor Authentication */}
              <Card className="bg-gray-800 border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">Two-Factor Authentication</h3>
                    <p className="text-gray-400 text-sm mt-1">Add an extra layer of security</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm ${twoFactorEnabled ? 'text-green-400' : 'text-gray-400'}`}>
                      {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <button
                      onClick={() => {
                        if (twoFactorEnabled) {
                          setTwoFactorEnabled(false);
                          alert('2FA disabled');
                        } else {
                          setShow2FASetup(true);
                        }
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        twoFactorEnabled ? 'bg-cyan-500' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {show2FASetup && !twoFactorEnabled && (
                  <div className="mt-6 bg-gray-900 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Setup Google Authenticator</h4>
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center">
                          <div className="text-center text-gray-800 text-xs p-4">
                            QR Code Placeholder<br/>
                            (Scan with Google Authenticator)
                          </div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-300 mb-4">
                          1. Install Google Authenticator on your phone<br/>
                          2. Scan the QR code<br/>
                          3. Enter the 6-digit code below
                        </p>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-300 mb-2">Verification Code</label>
                          <input
                            type="text"
                            placeholder="000000"
                            maxLength={6}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setTwoFactorEnabled(true);
                              setShow2FASetup(false);
                              alert('2FA enabled successfully!');
                            }}
                          >
                            Enable 2FA
                          </Button>
                          <Button variant="outline" onClick={() => setShow2FASetup(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Backup Codes */}
                    <div className="mt-6 pt-6 border-t border-gray-700">
                      <h5 className="text-md font-semibold text-white mb-3">Backup Codes</h5>
                      <p className="text-gray-400 text-sm mb-3">Save these codes in a safe place. Each can be used once.</p>
                      <div className="grid grid-cols-2 gap-2 bg-gray-800 p-4 rounded font-mono text-sm text-gray-300">
                        <div>1234-5678-9012</div>
                        <div>3456-7890-1234</div>
                        <div>5678-9012-3456</div>
                        <div>7890-1234-5678</div>
                        <div>9012-3456-7890</div>
                        <div>0123-4567-8901</div>
                      </div>
                      <Button size="sm" variant="outline" className="mt-3">
                        Download Backup Codes
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              {/* Login Sessions */}
              <Card className="bg-gray-800 border-gray-700">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white">Active Sessions</h3>
                  <p className="text-gray-400 text-sm mt-1">Manage your active login sessions</p>
                </div>

                <div className="space-y-4">
                  {loginSessions.map(session => (
                    <div key={session.id} className="bg-gray-900 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">{session.device}</span>
                          {session.isCurrent && (
                            <Badge color="green">Current</Badge>
                          )}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {session.location} • {session.ip}
                        </div>
                        <div className="text-gray-500 text-xs mt-1">
                          Last active: {session.lastActive}
                        </div>
                      </div>
                      {!session.isCurrent && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRevokeSession(session.id)}
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Payment Methods Tab */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              {/* Bank Accounts */}
              <Card className="bg-gray-800 border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">Bank Accounts</h3>
                    <p className="text-gray-400 text-sm mt-1">Manage your saved bank accounts</p>
                  </div>
                  <Button size="sm">Add Bank Account</Button>
                </div>

                <div className="space-y-3">
                  {bankAccounts.map(account => (
                    <div key={account.id} className="bg-gray-900 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">{account.bankName}</span>
                          {account.isDefault && <Badge color="cyan">Default</Badge>}
                        </div>
                        <div className="text-gray-400 text-sm">{account.accountName}</div>
                        <div className="text-gray-500 text-xs font-mono">{account.accountNumber}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="outline">Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Crypto Wallets */}
              <Card className="bg-gray-800 border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">Crypto Wallets</h3>
                    <p className="text-gray-400 text-sm mt-1">Manage your cryptocurrency wallets</p>
                  </div>
                  <Button size="sm">Add Crypto Wallet</Button>
                </div>

                <div className="space-y-3">
                  {cryptoWallets.map(wallet => (
                    <div key={wallet.id} className="bg-gray-900 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">{wallet.currency}</span>
                          <Badge>{wallet.network}</Badge>
                          {wallet.isDefault && <Badge color="cyan">Default</Badge>}
                        </div>
                        <div className="text-gray-400 text-sm font-mono">{wallet.address}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="outline">Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Referral Information Tab */}
          {activeTab === 'referral' && (
            <Card className="bg-gray-800 border-gray-700">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Referral Information</h2>
                <p className="text-gray-400 text-sm mt-1">Share your referral link and track your network</p>
              </div>

              <div className="space-y-6">
                {/* Referral Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Referral Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={referralInfo.referralLink}
                      readOnly
                      className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none"
                    />
                    <Button onClick={() => handleCopyToClipboard(referralInfo.referralLink)}>
                      Copy
                    </Button>
                  </div>
                </div>

                {/* Referral Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Referral Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={referralInfo.referralCode}
                      readOnly
                      className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none"
                    />
                    <Button onClick={() => handleCopyToClipboard(referralInfo.referralCode)}>
                      Copy
                    </Button>
                  </div>
                </div>

                {/* Sponsor Information */}
                <div className="bg-gray-900 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Sponsor Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                      <div className="text-white">{referralInfo.sponsor.name}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">User ID</label>
                      <div className="text-white font-mono">{referralInfo.sponsor.userId}</div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                      <div className="text-white">{referralInfo.sponsor.email}</div>
                    </div>
                  </div>
                </div>

                {/* Placement Information */}
                <div className="bg-gray-900 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Placement Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Placed Under</label>
                      <div className="text-white">{referralInfo.placement.name}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">User ID</label>
                      <div className="text-white font-mono">{referralInfo.placement.userId}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Position</label>
                      <Badge color="blue">{referralInfo.placement.position}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Notification Preferences Tab */}
          {activeTab === 'notifications' && (
            <Card className="bg-gray-800 border-gray-700">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Notification Preferences</h2>
                <p className="text-gray-400 text-sm mt-1">Manage how you receive notifications</p>
              </div>

              <div className="space-y-6">
                {/* Email Notifications */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Email Notifications</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'emailDeposit', label: 'Deposit notifications' },
                      { key: 'emailWithdraw', label: 'Withdrawal notifications' },
                      { key: 'emailCommission', label: 'Commission earnings' },
                      { key: 'emailRankChange', label: 'Rank changes' },
                      { key: 'emailSecurity', label: 'Security alerts' },
                      { key: 'emailMarketing', label: 'Marketing and promotional emails' }
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between bg-gray-900 rounded-lg p-4">
                        <span className="text-gray-300">{item.label}</span>
                        <button
                          onClick={() => setNotifications({
                            ...notifications,
                            [item.key]: !notifications[item.key as keyof typeof notifications]
                          })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            notifications[item.key as keyof typeof notifications] ? 'bg-cyan-500' : 'bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              notifications[item.key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SMS Notifications */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">SMS Notifications</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'smsDeposit', label: 'Deposit notifications' },
                      { key: 'smsWithdraw', label: 'Withdrawal notifications' },
                      { key: 'smsSecurity', label: 'Security alerts' }
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between bg-gray-900 rounded-lg p-4">
                        <span className="text-gray-300">{item.label}</span>
                        <button
                          onClick={() => setNotifications({
                            ...notifications,
                            [item.key]: !notifications[item.key as keyof typeof notifications]
                          })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            notifications[item.key as keyof typeof notifications] ? 'bg-cyan-500' : 'bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              notifications[item.key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Push Notifications */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Push Notifications</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'pushDeposit', label: 'Deposit notifications' },
                      { key: 'pushWithdraw', label: 'Withdrawal notifications' },
                      { key: 'pushCommission', label: 'Commission earnings' }
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between bg-gray-900 rounded-lg p-4">
                        <span className="text-gray-300">{item.label}</span>
                        <button
                          onClick={() => setNotifications({
                            ...notifications,
                            [item.key]: !notifications[item.key as keyof typeof notifications]
                          })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            notifications[item.key as keyof typeof notifications] ? 'bg-cyan-500' : 'bg-gray-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              notifications[item.key as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save Button */}
                <div className="mt-6 flex justify-end">
                  <Button onClick={handleSaveNotifications}>
                    Save Notification Preferences
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <Card className="bg-gray-800 border-gray-700">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">General Preferences</h2>
                <p className="text-gray-400 text-sm mt-1">Customize your experience</p>
              </div>

              <div className="space-y-6">
                {/* Language Preference */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Language</h3>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Select Language</label>
                    <select
                      value={language}
                      onChange={(e) => {
                        setLanguage(e.target.value);
                        toast.success('Language preference updated!');
                      }}
                      className="w-full md:w-1/2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                      <option value="zh">中文</option>
                      <option value="ja">日本語</option>
                      <option value="ko">한국어</option>
                      <option value="pt">Português</option>
                      <option value="ru">Русский</option>
                      <option value="ar">العربية</option>
                    </select>
                  </div>
                </div>

                {/* Theme Preference */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Theme</h3>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-300 font-medium">Dark Mode</p>
                        <p className="text-gray-500 text-sm mt-1">Use dark theme for better viewing at night</p>
                      </div>
                      <button
                        onClick={() => {
                          const newTheme = theme === 'dark' ? 'light' : 'dark';
                          setTheme(newTheme);
                          toast.success(`${newTheme === 'dark' ? 'Dark' : 'Light'} theme activated!`);
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          theme === 'dark' ? 'bg-cyan-500' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Time Zone Preference */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Time Zone</h3>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Select Time Zone</label>
                    <select
                      value={timeZone}
                      onChange={(e) => {
                        setTimeZone(e.target.value);
                        toast.success('Time zone updated!');
                      }}
                      className="w-full md:w-1/2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="Europe/London">London (GMT)</option>
                      <option value="Europe/Paris">Paris (CET)</option>
                      <option value="Asia/Tokyo">Tokyo (JST)</option>
                      <option value="Asia/Shanghai">Shanghai (CST)</option>
                      <option value="Asia/Dubai">Dubai (GST)</option>
                      <option value="Australia/Sydney">Sydney (AEDT)</option>
                    </select>
                  </div>
                </div>

                {/* Currency Preference */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Currency</h3>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => {
                        setCurrency(e.target.value);
                        toast.success('Currency preference updated!');
                      }}
                      className="w-full md:w-1/2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="JPY">JPY - Japanese Yen</option>
                      <option value="CNY">CNY - Chinese Yuan</option>
                      <option value="AUD">AUD - Australian Dollar</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                      <option value="CHF">CHF - Swiss Franc</option>
                      <option value="INR">INR - Indian Rupee</option>
                      <option value="BTC">BTC - Bitcoin</option>
                      <option value="ETH">ETH - Ethereum</option>
                      <option value="USDT">USDT - Tether</option>
                    </select>
                  </div>
                </div>

                {/* Info Alert */}
                <div className="bg-cyan-900/20 border border-cyan-900/30 rounded-lg p-4">
                  <div className="flex gap-3">
                    <div className="text-cyan-400 text-xl">ℹ️</div>
                    <div>
                      <p className="text-cyan-400 font-medium mb-1">Auto-Save Enabled</p>
                      <p className="text-gray-400 text-sm">
                        All preference changes are automatically saved to your browser. Your settings will persist across sessions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Account Actions */}
        <Card className="bg-gray-800 border-gray-700 border-red-900/30">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">Account Actions</h2>
            <p className="text-gray-400 text-sm mt-1">Manage your account data and settings</p>
          </div>

          <div className="space-y-4">
            {/* Download Data */}
            <div className="flex items-center justify-between bg-gray-900 rounded-lg p-4">
              <div className="flex-1">
                <div className="text-white font-medium mb-1">Download Account Data</div>
                <div className="text-gray-400 text-sm">Export all your account data (GDPR compliant)</div>
              </div>
              <Button variant="outline" onClick={handleDownloadData}>
                Download Data
              </Button>
            </div>

            {/* Deactivate Account */}
            <div className="flex items-center justify-between bg-gray-900 rounded-lg p-4">
              <div className="flex-1">
                <div className="text-white font-medium mb-1">Deactivate Account</div>
                <div className="text-gray-400 text-sm">Temporarily disable your account (can be reactivated)</div>
              </div>
              <Button variant="outline" onClick={() => setShowDeactivateModal(true)}>
                Deactivate
              </Button>
            </div>

            {/* Delete Account */}
            <div className="flex items-center justify-between bg-red-900/20 rounded-lg p-4 border border-red-900/30">
              <div className="flex-1">
                <div className="text-red-400 font-medium mb-1">Delete Account</div>
                <div className="text-gray-400 text-sm">Permanently delete your account and all data</div>
              </div>
              <Button variant="outline" onClick={() => setShowDeleteModal(true)} className="border-red-500 text-red-400 hover:bg-red-900/20">
                Delete Account
              </Button>
            </div>
          </div>
        </Card>

        {/* Deactivate Modal */}
        {showDeactivateModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="bg-gray-800 border-gray-700 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4">Deactivate Account</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to deactivate your account? You can reactivate it anytime by logging back in.
              </p>
              <div className="flex gap-3">
                <Button onClick={handleDeactivateAccount} className="flex-1">
                  Yes, Deactivate
                </Button>
                <Button variant="outline" onClick={() => setShowDeactivateModal(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="bg-gray-800 border-red-900/50 max-w-md w-full">
              <h3 className="text-xl font-bold text-red-400 mb-4">Delete Account</h3>
              <p className="text-gray-300 mb-4">
                This action is permanent and cannot be undone. All your data will be deleted within 30 days.
              </p>
              <div className="bg-red-900/20 border border-red-900/30 rounded-lg p-4 mb-6">
                <p className="text-red-400 text-sm font-medium">
                  Please type "DELETE" to confirm:
                </p>
                <input
                  type="text"
                  placeholder="DELETE"
                  className="w-full mt-2 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleDeleteAccount} className="flex-1 bg-red-600 hover:bg-red-700">
                  Delete Account
                </Button>
                <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  );
};

export default SettingsNew;
