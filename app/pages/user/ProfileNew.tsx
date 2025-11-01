import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast, { Toaster } from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { Button, Card, Badge, Input, Select, Alert } from '../../components/ui/DesignSystem';
import { Tabs, TabPanel } from '../../components/ui/Tabs';
import { Modal, ConfirmModal } from '../../components/ui/Modal';

interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  avatar: string;
  currentRank: string;
  memberSince: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  referralCode: string;
  referralLink: string;
  sponsorName: string;
  sponsorId: string;
  placementPosition: 'left' | 'right';
  uplineName: string;
}

// Validation Schemas
const bankAccountSchema = z.object({
  bankName: z.string().min(2, 'Bank name must be at least 2 characters'),
  accountHolder: z.string().min(2, 'Account holder name must be at least 2 characters'),
  accountNumber: z.string().min(4, 'Account number must be at least 4 characters'),
  routingNumber: z.string().min(9, 'Routing number must be 9 digits').max(9),
  accountType: z.enum(['checking', 'savings']),
});

const cryptoWalletSchema = z.object({
  crypto: z.string().min(1, 'Please select a cryptocurrency'),
  network: z.string().min(1, 'Please select a network'),
  address: z.string().min(26, 'Invalid wallet address').max(100),
  label: z.string().optional(),
});

const passwordChangeSchema = z.object({
  current: z.string().min(1, 'Current password is required'),
  new: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  confirm: z.string(),
}).refine((data) => data.new === data.confirm, {
  message: "Passwords don't match",
  path: ['confirm'],
});

export const ProfileNew: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active tab state
  const [activeTab, setActiveTab] = useState('personal');

  // User profile state
  const [profile, setProfile] = useState<UserProfile>({
    id: 'USR123456',
    fullName: 'John Doe',
    email: 'user@asterdex.com',
    phone: '+1 234 567 8900',
    dateOfBirth: '1990-01-01',
    gender: 'male',
    address: '123 Main Street, Apt 4B',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'United States',
    avatar: '',
    currentRank: 'Gold',
    memberSince: '2024-01-15',
    emailVerified: true,
    twoFactorEnabled: false,
    referralCode: 'ABC123XYZ',
    referralLink: 'https://finaster.exchange/register?ref=ABC123XYZ',
    sponsorName: 'Jane Smith',
    sponsorId: 'USR654321',
    placementPosition: 'left',
    uplineName: 'Mike Johnson',
  });

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);

  // Password change state
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // 2FA state
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrCode, setQrCode] = useState('');

  // Payment methods state
  const [bankAccounts, setBankAccounts] = useState([
    {
      id: '1',
      bankName: 'Chase Bank',
      accountHolder: 'John Doe',
      accountNumber: '****1234',
      isDefault: true,
    },
  ]);

  const [cryptoWallets, setCryptoWallets] = useState([
    {
      id: '1',
      crypto: 'USDT',
      network: 'ERC20',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbF',
      label: 'Main Wallet',
      isDefault: true,
    },
  ]);

  const [showBankModal, setShowBankModal] = useState(false);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null);
  const [editingBank, setEditingBank] = useState<any>(null);
  const [editingCrypto, setEditingCrypto] = useState<any>(null);

  // Form instances
  const bankForm = useForm({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      bankName: '',
      accountHolder: '',
      accountNumber: '',
      routingNumber: '',
      accountType: 'checking' as const,
    },
  });

  const cryptoForm = useForm({
    resolver: zodResolver(cryptoWalletSchema),
    defaultValues: {
      crypto: '',
      network: '',
      address: '',
      label: '',
    },
  });

  // Active sessions
  const [sessions, setSessions] = useState([
    {
      id: '1',
      device: 'Windows PC',
      browser: 'Chrome 120',
      location: 'New York, USA',
      ip: '192.168.1.1',
      lastActive: '2 minutes ago',
      isCurrent: true,
    },
    {
      id: '2',
      device: 'iPhone 15',
      browser: 'Safari',
      location: 'New York, USA',
      ip: '192.168.1.50',
      lastActive: '2 hours ago',
      isCurrent: false,
    },
  ]);

  // Notification preferences
  const [notifications, setNotifications] = useState({
    email: {
      account: true,
      financial: true,
      team: true,
      rank: true,
      packages: false,
      announcements: true,
      marketing: false,
    },
    sms: {
      account: true,
      financial: true,
      team: false,
      rank: true,
      packages: false,
      announcements: false,
      marketing: false,
    },
    push: {
      account: true,
      financial: true,
      team: true,
      rank: true,
      packages: true,
      announcements: true,
      marketing: false,
    },
  });

  // Load persisted data from localStorage on mount
  useEffect(() => {
    try {
      const savedBankAccounts = localStorage.getItem('asterdex_bank_accounts');
      if (savedBankAccounts) {
        setBankAccounts(JSON.parse(savedBankAccounts));
      }

      const savedCryptoWallets = localStorage.getItem('asterdex_crypto_wallets');
      if (savedCryptoWallets) {
        setCryptoWallets(JSON.parse(savedCryptoWallets));
      }

      const savedNotifications = localStorage.getItem('asterdex_notifications');
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      }
    } catch (error) {
      console.error('Failed to load saved preferences:', error);
    }
  }, []);

  // Save bank accounts to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('asterdex_bank_accounts', JSON.stringify(bankAccounts));
    } catch (error) {
      console.error('Failed to save bank accounts:', error);
    }
  }, [bankAccounts]);

  // Save crypto wallets to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('asterdex_crypto_wallets', JSON.stringify(cryptoWallets));
    } catch (error) {
      console.error('Failed to save crypto wallets:', error);
    }
  }, [cryptoWallets]);

  // Save notification preferences to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('asterdex_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  }, [notifications]);

  // Handlers
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In real app, upload to server
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    // Validation
    if (!editedProfile.fullName || !editedProfile.email || !editedProfile.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Simulate API call
    const promise = new Promise((resolve) => setTimeout(resolve, 1000));

    toast.promise(promise, {
      loading: 'Saving profile...',
      success: 'Profile updated successfully!',
      error: 'Failed to update profile',
    });

    promise.then(() => {
      setProfile(editedProfile);
      setIsEditing(false);
    });
  };

  const handleCancelEdit = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const [passwordErrors, setPasswordErrors] = useState<{ [key: string]: string }>({});

  const handleChangePassword = () => {
    try {
      // Clear previous errors
      setPasswordErrors({});

      // Validate passwords
      passwordChangeSchema.parse(passwords);

      // Simulate API call
      const promise = new Promise((resolve) => setTimeout(resolve, 1500));

      toast.promise(promise, {
        loading: 'Changing password...',
        success: 'Password changed successfully!',
        error: 'Failed to change password',
      });

      promise.then(() => {
        setPasswords({ current: '', new: '', confirm: '' });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Set all validation errors
        const errors: { [key: string]: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setPasswordErrors(errors);
        toast.error('Please fix the validation errors');
      }
    }
  };

  const handleEnable2FA = () => {
    // Generate QR code
    setQrCode('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    setShow2FAModal(true);
  };

  const handleConfirm2FA = () => {
    const promise = new Promise((resolve) => setTimeout(resolve, 1000));

    toast.promise(promise, {
      loading: 'Enabling 2FA...',
      success: 'Two-Factor Authentication enabled!',
      error: 'Failed to enable 2FA',
    });

    promise.then(() => {
      setProfile({ ...profile, twoFactorEnabled: true });
      setShow2FAModal(false);
    });
  };

  const handleDisable2FA = () => {
    if (window.confirm('Are you sure you want to disable 2FA?')) {
      const promise = new Promise((resolve) => setTimeout(resolve, 1000));

      toast.promise(promise, {
        loading: 'Disabling 2FA...',
        success: 'Two-Factor Authentication disabled',
        error: 'Failed to disable 2FA',
      });

      promise.then(() => {
        setProfile({ ...profile, twoFactorEnabled: false });
      });
    }
  };

  const handleRevokeSession = (id: string) => {
    setSessions(sessions.filter((s) => s.id !== id));
    toast.success('Session revoked');
  };

  const handleRevokeAllSessions = () => {
    if (window.confirm('Revoke all other sessions?')) {
      setSessions(sessions.filter((s) => s.isCurrent));
      toast.success('All other sessions revoked');
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const handleDeletePaymentMethod = (type: string, id: string) => {
    setDeleteTarget({ type, id });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      if (deleteTarget.type === 'bank') {
        setBankAccounts(bankAccounts.filter((b) => b.id !== deleteTarget.id));
      } else {
        setCryptoWallets(cryptoWallets.filter((c) => c.id !== deleteTarget.id));
      }
      toast.success('Payment method deleted');
      setShowDeleteConfirm(false);
    }
  };

  const handleSaveNotifications = () => {
    const promise = new Promise((resolve) => setTimeout(resolve, 1000));

    toast.promise(promise, {
      loading: 'Saving preferences...',
      success: 'Notification preferences saved!',
      error: 'Failed to save preferences',
    });

    // Preferences are already auto-saved via useEffect
  };

  const handleSetDefaultBank = (id: string) => {
    setBankAccounts(
      bankAccounts.map((account) => ({
        ...account,
        isDefault: account.id === id,
      }))
    );
    toast.success('Default bank account updated');
  };

  const handleSetDefaultCrypto = (id: string) => {
    setCryptoWallets(
      cryptoWallets.map((wallet) => ({
        ...wallet,
        isDefault: wallet.id === id,
      }))
    );
    toast.success('Default crypto wallet updated');
  };

  // Bank account handlers
  const handleAddBank = () => {
    setEditingBank(null);
    bankForm.reset();
    setShowBankModal(true);
  };

  const handleEditBank = (account: any) => {
    setEditingBank(account);
    bankForm.reset(account);
    setShowBankModal(true);
  };

  const handleSubmitBank = (data: any) => {
    const promise = new Promise((resolve) => setTimeout(resolve, 1000));

    toast.promise(promise, {
      loading: editingBank ? 'Updating bank account...' : 'Adding bank account...',
      success: editingBank ? 'Bank account updated!' : 'Bank account added!',
      error: 'Operation failed',
    });

    promise.then(() => {
      if (editingBank) {
        setBankAccounts(bankAccounts.map((b) => (b.id === editingBank.id ? { ...b, ...data } : b)));
      } else {
        setBankAccounts([
          ...bankAccounts,
          { ...data, id: Date.now().toString(), isDefault: bankAccounts.length === 0 },
        ]);
      }
      setShowBankModal(false);
      bankForm.reset();
    });
  };

  // Crypto wallet handlers
  const handleAddCrypto = () => {
    setEditingCrypto(null);
    cryptoForm.reset();
    setShowCryptoModal(true);
  };

  const handleEditCrypto = (wallet: any) => {
    setEditingCrypto(wallet);
    cryptoForm.reset(wallet);
    setShowCryptoModal(true);
  };

  const handleSubmitCrypto = (data: any) => {
    const promise = new Promise((resolve) => setTimeout(resolve, 1000));

    toast.promise(promise, {
      loading: editingCrypto ? 'Updating wallet...' : 'Adding wallet...',
      success: editingCrypto ? 'Wallet updated!' : 'Wallet added!',
      error: 'Operation failed',
    });

    promise.then(() => {
      if (editingCrypto) {
        setCryptoWallets(cryptoWallets.map((w) => (w.id === editingCrypto.id ? { ...w, ...data } : w)));
      } else {
        setCryptoWallets([
          ...cryptoWallets,
          { ...data, id: Date.now().toString(), isDefault: cryptoWallets.length === 0 },
        ]);
      }
      setShowCryptoModal(false);
      cryptoForm.reset();
    });
  };

  const getPasswordStrength = (password: string): { strength: string; color: string } => {
    if (password.length === 0) return { strength: '', color: '' };
    if (password.length < 8) return { strength: 'Weak', color: '#ef4444' };

    let score = 0;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) return { strength: 'Medium', color: '#f59e0b' };
    return { strength: 'Strong', color: '#10b981' };
  };

  const passwordStrength = getPasswordStrength(passwords.new);

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'payment', label: 'Payment Methods', icon: '💳' },
    { id: 'referral', label: 'Referral Info', icon: '🔗' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] p-5 max-w-7xl mx-auto">
      <Toaster position="top-right" />
      <Button variant="secondary" onClick={() => navigate('/dashboard')} className="mb-5">
        ← Back to Dashboard
      </Button>

      {/* Profile Header */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className="relative group">
            <div
              className="w-36 h-36 rounded-full bg-gradient-to-br from-[#00C7D1] to-[#667eea] flex items-center justify-center text-4xl font-bold text-white cursor-pointer overflow-hidden"
              onClick={handleAvatarClick}
            >
              {profile.avatar ? (
                <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profile.fullName.charAt(0).toUpperCase()
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-sm text-white">Upload Photo</span>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-[#f8fafc] mb-2">{profile.fullName}</h1>
            <p className="text-[#cbd5e1] mb-3">{profile.email}</p>

            <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-3">
              <Badge variant="info">ID: {profile.id}</Badge>
              <Badge variant="success">
                <span className="mr-1">🏆</span>
                {profile.currentRank}
              </Badge>
              {profile.emailVerified && <Badge variant="success">✓ Verified</Badge>}
              {profile.twoFactorEnabled && <Badge variant="info">🔒 2FA Enabled</Badge>}
            </div>

            <p className="text-sm text-[#94a3b8]">
              Member since {new Date(profile.memberSince).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Tab 1: Personal Information */}
        <TabPanel activeTab={activeTab} tabId="personal">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-[#f8fafc]">Personal Information</h3>
            {!isEditing ? (
              <Button variant="primary" onClick={() => setIsEditing(true)}>
                ✏️ Edit
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button variant="secondary" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button variant="success" onClick={handleSaveProfile}>
                  💾 Save Changes
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Full Name *"
              value={isEditing ? editedProfile.fullName : profile.fullName}
              onChange={(e) => setEditedProfile({ ...editedProfile, fullName: e.target.value })}
              disabled={!isEditing}
            />

            <Input
              label="Email Address *"
              type="email"
              value={profile.email}
              disabled
            />

            <Input
              label="Phone Number *"
              type="tel"
              value={isEditing ? editedProfile.phone : profile.phone}
              onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
              disabled={!isEditing}
            />

            <Input
              label="Date of Birth"
              type="date"
              value={isEditing ? editedProfile.dateOfBirth : profile.dateOfBirth}
              onChange={(e) => setEditedProfile({ ...editedProfile, dateOfBirth: e.target.value })}
              disabled={!isEditing}
            />

            <Select
              label="Gender"
              value={isEditing ? editedProfile.gender : profile.gender}
              onChange={(e) => setEditedProfile({ ...editedProfile, gender: e.target.value })}
              disabled={!isEditing}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Select>

            <Select
              label="Country *"
              value={isEditing ? editedProfile.country : profile.country}
              onChange={(e) => setEditedProfile({ ...editedProfile, country: e.target.value })}
              disabled={!isEditing}
            >
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Canada">Canada</option>
              <option value="Australia">Australia</option>
              <option value="India">India</option>
            </Select>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#f8fafc] mb-2">Address</label>
              <textarea
                className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#00C7D1] focus:ring-2 focus:ring-[#00C7D1]/20 disabled:opacity-50"
                rows={3}
                value={isEditing ? editedProfile.address : profile.address}
                onChange={(e) => setEditedProfile({ ...editedProfile, address: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <Input
              label="City *"
              value={isEditing ? editedProfile.city : profile.city}
              onChange={(e) => setEditedProfile({ ...editedProfile, city: e.target.value })}
              disabled={!isEditing}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="State"
                value={isEditing ? editedProfile.state : profile.state}
                onChange={(e) => setEditedProfile({ ...editedProfile, state: e.target.value })}
                disabled={!isEditing}
              />
              <Input
                label="ZIP Code"
                value={isEditing ? editedProfile.zipCode : profile.zipCode}
                onChange={(e) => setEditedProfile({ ...editedProfile, zipCode: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>
        </TabPanel>

        {/* Tab 2: Security */}
        <TabPanel activeTab={activeTab} tabId="security">
          {/* Change Password */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-[#f8fafc] mb-4">Change Password</h3>
            <Card className="bg-[#1e293b]">
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    label="Current Password *"
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwords.current}
                    onChange={(e) => {
                      setPasswords({ ...passwords, current: e.target.value });
                      if (passwordErrors.current) {
                        setPasswordErrors({ ...passwordErrors, current: '' });
                      }
                    }}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-3 top-10 text-[#94a3b8] hover:text-[#cbd5e1]"
                  >
                    {showPasswords.current ? '👁️' : '👁️‍🗨️'}
                  </button>
                  {passwordErrors.current && (
                    <p className="text-[#ef4444] text-sm mt-1">{passwordErrors.current}</p>
                  )}
                </div>

                <div className="relative">
                  <Input
                    label="New Password *"
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwords.new}
                    onChange={(e) => {
                      setPasswords({ ...passwords, new: e.target.value });
                      if (passwordErrors.new) {
                        setPasswordErrors({ ...passwordErrors, new: '' });
                      }
                    }}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-10 text-[#94a3b8] hover:text-[#cbd5e1]"
                  >
                    {showPasswords.new ? '👁️' : '👁️‍🗨️'}
                  </button>
                  {passwordErrors.new && (
                    <p className="text-[#ef4444] text-sm mt-1">{passwordErrors.new}</p>
                  )}
                  {passwords.new && !passwordErrors.new && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-2 bg-[#334155] rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all"
                          style={{
                            width: passwords.new.length < 8 ? '33%' : passwordStrength.strength === 'Medium' ? '66%' : '100%',
                            backgroundColor: passwordStrength.color,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium" style={{ color: passwordStrength.color }}>
                        {passwordStrength.strength}
                      </span>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <Input
                    label="Confirm New Password *"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwords.confirm}
                    onChange={(e) => {
                      setPasswords({ ...passwords, confirm: e.target.value });
                      if (passwordErrors.confirm) {
                        setPasswordErrors({ ...passwordErrors, confirm: '' });
                      }
                    }}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-10 text-[#94a3b8] hover:text-[#cbd5e1]"
                  >
                    {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
                  </button>
                  {passwordErrors.confirm && (
                    <p className="text-[#ef4444] text-sm mt-1">{passwordErrors.confirm}</p>
                  )}
                </div>

                <Alert variant="info">
                  <strong>Password Requirements:</strong>
                  <ul className="mt-2 ml-5 list-disc text-sm">
                    <li>Minimum 8 characters</li>
                    <li>At least one uppercase letter</li>
                    <li>At least one lowercase letter</li>
                    <li>At least one number</li>
                    <li>At least one special character</li>
                  </ul>
                </Alert>

                <Button variant="primary" onClick={handleChangePassword}>
                  Change Password
                </Button>
              </div>
            </Card>
          </div>

          {/* Two-Factor Authentication */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-[#f8fafc] mb-4">Two-Factor Authentication</h3>
            <Card className="bg-[#1e293b]">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-[#f8fafc] font-medium mb-2">Status</p>
                  {profile.twoFactorEnabled ? (
                    <Badge variant="success">✓ Enabled</Badge>
                  ) : (
                    <Badge variant="warning">⚠️ Disabled</Badge>
                  )}
                </div>
                {!profile.twoFactorEnabled ? (
                  <Button variant="primary" onClick={handleEnable2FA}>
                    Enable 2FA
                  </Button>
                ) : (
                  <Button variant="danger" onClick={handleDisable2FA}>
                    Disable 2FA
                  </Button>
                )}
              </div>
              <p className="text-[#cbd5e1] text-sm">
                Two-factor authentication adds an extra layer of security to your account.
              </p>
            </Card>
          </div>

          {/* Active Sessions */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#f8fafc]">Active Sessions</h3>
              <Button variant="danger" size="sm" onClick={handleRevokeAllSessions}>
                Revoke All Other Sessions
              </Button>
            </div>
            <Card className="bg-[#1e293b]">
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 bg-[#334155] rounded-lg border border-[#475569]"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#f8fafc] font-medium">{session.device}</span>
                        {session.isCurrent && <Badge variant="success">This Device</Badge>}
                      </div>
                      <p className="text-[#94a3b8] text-sm">
                        {session.browser} • {session.location} • {session.ip}
                      </p>
                      <p className="text-[#94a3b8] text-xs mt-1">Last active: {session.lastActive}</p>
                    </div>
                    {!session.isCurrent && (
                      <Button variant="danger" size="sm" onClick={() => handleRevokeSession(session.id)}>
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabPanel>

        {/* Tab 3: Payment Methods */}
        <TabPanel activeTab={activeTab} tabId="payment">
          {/* Bank Accounts */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#f8fafc]">Bank Accounts</h3>
              <Button variant="primary" onClick={handleAddBank}>
                + Add Bank Account
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bankAccounts.map((account) => (
                <Card key={account.id} className="bg-[#1e293b]">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-[#f8fafc] font-bold text-lg mb-1">{account.bankName}</h4>
                      <p className="text-[#cbd5e1] text-sm">{account.accountHolder}</p>
                      <p className="text-[#94a3b8] text-sm font-mono mt-2">{account.accountNumber}</p>
                    </div>
                    {account.isDefault && <Badge variant="success">Default</Badge>}
                  </div>
                  <div className="flex gap-2">
                    {!account.isDefault && (
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleSetDefaultBank(account.id)}>
                        Set Default
                      </Button>
                    )}
                    <Button variant="secondary" size="sm" onClick={() => handleEditBank(account)}>Edit</Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeletePaymentMethod('bank', account.id)}>
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Crypto Wallets */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#f8fafc]">Cryptocurrency Wallets</h3>
              <Button variant="primary" onClick={handleAddCrypto}>
                + Add Crypto Wallet
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cryptoWallets.map((wallet) => (
                <Card key={wallet.id} className="bg-[#1e293b]">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-[#f8fafc] font-bold text-lg">{wallet.crypto}</h4>
                        <Badge variant="info">{wallet.network}</Badge>
                      </div>
                      {wallet.label && <p className="text-[#cbd5e1] text-sm mb-2">{wallet.label}</p>}
                      <div className="flex items-center gap-2">
                        <p className="text-[#94a3b8] text-xs font-mono truncate flex-1">
                          {wallet.address.substring(0, 12)}...{wallet.address.substring(wallet.address.length - 8)}
                        </p>
                        <button
                          onClick={() => handleCopyToClipboard(wallet.address)}
                          className="text-[#00C7D1] hover:text-[#00e5f0] text-xs"
                        >
                          📋 Copy
                        </button>
                      </div>
                    </div>
                    {wallet.isDefault && <Badge variant="success">Default</Badge>}
                  </div>
                  <div className="flex gap-2">
                    {!wallet.isDefault && (
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleSetDefaultCrypto(wallet.id)}>
                        Set Default
                      </Button>
                    )}
                    <Button variant="secondary" size="sm" onClick={() => handleEditCrypto(wallet)}>Edit</Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeletePaymentMethod('crypto', wallet.id)}>
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </TabPanel>

        {/* Tab 4: Referral Information */}
        <TabPanel activeTab={activeTab} tabId="referral">
          <div className="space-y-6">
            {/* Referral Link */}
            <Card className="bg-[#1e293b]">
              <h3 className="text-lg font-bold text-[#f8fafc] mb-4">Your Referral Link</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={profile.referralLink}
                  readOnly
                  className="flex-1 px-4 py-2 bg-[#334155] border border-[#475569] rounded-lg text-[#f8fafc] text-sm"
                />
                <Button variant="primary" onClick={() => handleCopyToClipboard(profile.referralLink)}>
                  📋 Copy
                </Button>
              </div>
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeSVG value={profile.referralLink} size={192} level="H" includeMargin={true} />
              </div>
            </Card>

            {/* Referral Code */}
            <Card className="bg-[#1e293b]">
              <h3 className="text-lg font-bold text-[#f8fafc] mb-4">Your Referral Code</h3>
              <div className="text-center p-6 bg-[#334155] rounded-lg">
                <p className="text-4xl font-bold text-[#00C7D1] mb-4 font-mono">{profile.referralCode}</p>
                <Button variant="primary" onClick={() => handleCopyToClipboard(profile.referralCode)}>
                  📋 Copy Code
                </Button>
              </div>
            </Card>

            {/* Sponsor Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-[#1e293b]">
                <h3 className="text-lg font-bold text-[#f8fafc] mb-4">Sponsor Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-[#94a3b8] text-sm">Sponsor Name</p>
                    <p className="text-[#f8fafc] font-medium">{profile.sponsorName}</p>
                  </div>
                  <div>
                    <p className="text-[#94a3b8] text-sm">Sponsor ID</p>
                    <p className="text-[#f8fafc] font-medium">{profile.sponsorId}</p>
                  </div>
                </div>
              </Card>

              <Card className="bg-[#1e293b]">
                <h3 className="text-lg font-bold text-[#f8fafc] mb-4">Placement Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-[#94a3b8] text-sm">Position</p>
                    <Badge variant={profile.placementPosition === 'left' ? 'info' : 'success'}>
                      {profile.placementPosition.toUpperCase()} LEG
                    </Badge>
                  </div>
                  <div>
                    <p className="text-[#94a3b8] text-sm">Upline</p>
                    <p className="text-[#f8fafc] font-medium">{profile.uplineName}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabPanel>

        {/* Tab 5: Notification Preferences */}
        <TabPanel activeTab={activeTab} tabId="notifications">
          <div className="space-y-8">
            {/* Email Notifications */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-[#f8fafc]">📧 Email Notifications</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-[#cbd5e1] text-sm">Enable All</span>
                  <input
                    type="checkbox"
                    checked={Object.values(notifications.email).every((v) => v)}
                    onChange={(e) => {
                      const value = e.target.checked;
                      setNotifications({
                        ...notifications,
                        email: Object.fromEntries(
                          Object.keys(notifications.email).map((k) => [k, value])
                        ) as any,
                      });
                    }}
                    className="w-5 h-5"
                  />
                </label>
              </div>
              <Card className="bg-[#1e293b]">
                <div className="space-y-3">
                  {Object.entries({
                    account: 'Account activity (login, password change)',
                    financial: 'Financial (deposits, withdrawals, earnings)',
                    team: 'Team activity (new referrals, team purchases)',
                    rank: 'Rank achievements',
                    packages: 'Package updates',
                    announcements: 'Platform announcements',
                    marketing: 'Marketing emails and promotions',
                  }).map(([key, label]) => (
                    <label key={key} className="flex items-center justify-between p-3 bg-[#334155] rounded-lg cursor-pointer hover:bg-[#475569] transition-colors">
                      <span className="text-[#f8fafc]">{label}</span>
                      <input
                        type="checkbox"
                        checked={notifications.email[key as keyof typeof notifications.email]}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            email: { ...notifications.email, [key]: e.target.checked },
                          })
                        }
                        className="w-5 h-5"
                      />
                    </label>
                  ))}
                </div>
              </Card>
            </div>

            {/* SMS Notifications */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-[#f8fafc]">📱 SMS Notifications</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-[#cbd5e1] text-sm">Enable All</span>
                  <input
                    type="checkbox"
                    checked={Object.values(notifications.sms).every((v) => v)}
                    onChange={(e) => {
                      const value = e.target.checked;
                      setNotifications({
                        ...notifications,
                        sms: Object.fromEntries(
                          Object.keys(notifications.sms).map((k) => [k, value])
                        ) as any,
                      });
                    }}
                    className="w-5 h-5"
                  />
                </label>
              </div>
              <Card className="bg-[#1e293b]">
                <div className="space-y-3">
                  {Object.entries({
                    account: 'Account activity',
                    financial: 'Financial updates',
                    team: 'Team activity',
                    rank: 'Rank achievements',
                    packages: 'Package updates',
                    announcements: 'Important announcements',
                    marketing: 'Marketing messages',
                  }).map(([key, label]) => (
                    <label key={key} className="flex items-center justify-between p-3 bg-[#334155] rounded-lg cursor-pointer hover:bg-[#475569] transition-colors">
                      <span className="text-[#f8fafc]">{label}</span>
                      <input
                        type="checkbox"
                        checked={notifications.sms[key as keyof typeof notifications.sms]}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            sms: { ...notifications.sms, [key]: e.target.checked },
                          })
                        }
                        className="w-5 h-5"
                      />
                    </label>
                  ))}
                </div>
              </Card>
            </div>

            {/* Push Notifications */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-[#f8fafc]">🔔 Push Notifications</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-[#cbd5e1] text-sm">Enable All</span>
                  <input
                    type="checkbox"
                    checked={Object.values(notifications.push).every((v) => v)}
                    onChange={(e) => {
                      const value = e.target.checked;
                      setNotifications({
                        ...notifications,
                        push: Object.fromEntries(
                          Object.keys(notifications.push).map((k) => [k, value])
                        ) as any,
                      });
                    }}
                    className="w-5 h-5"
                  />
                </label>
              </div>
              <Card className="bg-[#1e293b]">
                <div className="space-y-3">
                  {Object.entries({
                    account: 'Account activity',
                    financial: 'Financial updates',
                    team: 'Team activity',
                    rank: 'Rank achievements',
                    packages: 'Package updates',
                    announcements: 'Important announcements',
                    marketing: 'Marketing notifications',
                  }).map(([key, label]) => (
                    <label key={key} className="flex items-center justify-between p-3 bg-[#334155] rounded-lg cursor-pointer hover:bg-[#475569] transition-colors">
                      <span className="text-[#f8fafc]">{label}</span>
                      <input
                        type="checkbox"
                        checked={notifications.push[key as keyof typeof notifications.push]}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            push: { ...notifications.push, [key]: e.target.checked },
                          })
                        }
                        className="w-5 h-5"
                      />
                    </label>
                  ))}
                </div>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button variant="success" onClick={handleSaveNotifications}>
                💾 Save Preferences
              </Button>
            </div>
          </div>
        </TabPanel>
      </Card>

      {/* 2FA Modal */}
      <Modal isOpen={show2FAModal} onClose={() => setShow2FAModal(false)} title="Enable Two-Factor Authentication">
        <div className="space-y-4">
          <p className="text-[#cbd5e1]">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
          </p>
          <div className="flex justify-center p-4 bg-white rounded-lg">
            <QRCodeSVG
              value={`otpauth://totp/Finaster:${profile.email}?secret=JBSWY3DPEHPK3PXP&issuer=Finaster`}
              size={256}
              level="H"
              includeMargin={true}
            />
          </div>
          <Input label="Enter 6-digit code from your app" placeholder="000000" />
          <Alert variant="warning">
            <strong>Save your backup codes:</strong>
            <p className="mt-2 font-mono text-sm">
              XXXX-XXXX-XXXX<br />
              YYYY-YYYY-YYYY<br />
              ZZZZ-ZZZZ-ZZZZ
            </p>
          </Alert>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShow2FAModal(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleConfirm2FA}>
              Enable 2FA
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Payment Method"
        message="Are you sure you want to delete this payment method? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />

      {/* Bank Account Modal */}
      <Modal
        isOpen={showBankModal}
        onClose={() => setShowBankModal(false)}
        title={editingBank ? 'Edit Bank Account' : 'Add Bank Account'}
        maxWidth="md"
      >
        <form onSubmit={bankForm.handleSubmit(handleSubmitBank)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#f8fafc] mb-2">Bank Name *</label>
            <input
              {...bankForm.register('bankName')}
              className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#00C7D1] focus:ring-2 focus:ring-[#00C7D1]/20"
              placeholder="Chase Bank"
            />
            {bankForm.formState.errors.bankName && (
              <p className="text-[#ef4444] text-sm mt-1">{bankForm.formState.errors.bankName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#f8fafc] mb-2">Account Holder Name *</label>
            <input
              {...bankForm.register('accountHolder')}
              className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#00C7D1] focus:ring-2 focus:ring-[#00C7D1]/20"
              placeholder="John Doe"
            />
            {bankForm.formState.errors.accountHolder && (
              <p className="text-[#ef4444] text-sm mt-1">{bankForm.formState.errors.accountHolder.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#f8fafc] mb-2">Account Number *</label>
            <input
              {...bankForm.register('accountNumber')}
              className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#00C7D1] focus:ring-2 focus:ring-[#00C7D1]/20"
              placeholder="1234567890"
            />
            {bankForm.formState.errors.accountNumber && (
              <p className="text-[#ef4444] text-sm mt-1">{bankForm.formState.errors.accountNumber.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#f8fafc] mb-2">Routing Number *</label>
            <input
              {...bankForm.register('routingNumber')}
              className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#00C7D1] focus:ring-2 focus:ring-[#00C7D1]/20"
              placeholder="123456789"
              maxLength={9}
            />
            {bankForm.formState.errors.routingNumber && (
              <p className="text-[#ef4444] text-sm mt-1">{bankForm.formState.errors.routingNumber.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#f8fafc] mb-2">Account Type *</label>
            <select
              {...bankForm.register('accountType')}
              className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1] focus:ring-2 focus:ring-[#00C7D1]/20"
            >
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
            </select>
            {bankForm.formState.errors.accountType && (
              <p className="text-[#ef4444] text-sm mt-1">{bankForm.formState.errors.accountType.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => setShowBankModal(false)}>
              Cancel
            </Button>
            <Button variant="success" type="submit">
              {editingBank ? 'Update' : 'Add'} Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Crypto Wallet Modal */}
      <Modal
        isOpen={showCryptoModal}
        onClose={() => setShowCryptoModal(false)}
        title={editingCrypto ? 'Edit Crypto Wallet' : 'Add Crypto Wallet'}
        maxWidth="md"
      >
        <form onSubmit={cryptoForm.handleSubmit(handleSubmitCrypto)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#f8fafc] mb-2">Cryptocurrency *</label>
            <select
              {...cryptoForm.register('crypto')}
              className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1] focus:ring-2 focus:ring-[#00C7D1]/20"
            >
              <option value="">Select Cryptocurrency</option>
              <option value="USDT">USDT (Tether)</option>
              <option value="USDC">USDC</option>
              <option value="BTC">Bitcoin</option>
              <option value="ETH">Ethereum</option>
              <option value="BNB">BNB</option>
              <option value="TRX">TRON</option>
            </select>
            {cryptoForm.formState.errors.crypto && (
              <p className="text-[#ef4444] text-sm mt-1">{cryptoForm.formState.errors.crypto.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#f8fafc] mb-2">Network *</label>
            <select
              {...cryptoForm.register('network')}
              className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1] focus:ring-2 focus:ring-[#00C7D1]/20"
            >
              <option value="">Select Network</option>
              <option value="ERC20">ERC20 (Ethereum)</option>
              <option value="TRC20">TRC20 (TRON)</option>
              <option value="BEP20">BEP20 (BSC)</option>
              <option value="Polygon">Polygon</option>
              <option value="Arbitrum">Arbitrum</option>
            </select>
            {cryptoForm.formState.errors.network && (
              <p className="text-[#ef4444] text-sm mt-1">{cryptoForm.formState.errors.network.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#f8fafc] mb-2">Wallet Address *</label>
            <input
              {...cryptoForm.register('address')}
              className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#00C7D1] focus:ring-2 focus:ring-[#00C7D1]/20 font-mono text-sm"
              placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbF"
            />
            {cryptoForm.formState.errors.address && (
              <p className="text-[#ef4444] text-sm mt-1">{cryptoForm.formState.errors.address.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#f8fafc] mb-2">Label (Optional)</label>
            <input
              {...cryptoForm.register('label')}
              className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#00C7D1] focus:ring-2 focus:ring-[#00C7D1]/20"
              placeholder="Main Wallet"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => setShowCryptoModal(false)}>
              Cancel
            </Button>
            <Button variant="success" type="submit">
              {editingCrypto ? 'Update' : 'Add'} Wallet
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProfileNew;
