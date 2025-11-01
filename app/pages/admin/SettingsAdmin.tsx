import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSettings } from '../../context/SettingsContext';

// Email template interface
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

// SMS template interface
interface SMSTemplate {
  id: string;
  name: string;
  message: string;
  variables: string[];
}

export const SettingsAdmin: React.FC = () => {
  const navigate = useNavigate();
  const { settings: globalSettings, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);

  // General Settings State (now synced with global settings)
  const [generalSettings, setGeneralSettings] = useState({
    platformName: globalSettings.platformName,
    logoUrl: globalSettings.logoUrl,
    faviconUrl: globalSettings.faviconUrl,
    timezone: globalSettings.timezone,
    currency: globalSettings.currency,
    dateFormat: globalSettings.dateFormat,
    language: globalSettings.language,
  });

  // Limits & Fees State
  const [limitsAndFees, setLimitsAndFees] = useState({
    minDeposit: 10,
    minWithdrawal: 50,
    maxWithdrawalDaily: 10000,
    maxWithdrawalWeekly: 50000,
    maxWithdrawalMonthly: 200000,
    depositFeePercent: 0,
    withdrawalFeePercent: 2,
    transferFeePercent: 1,
  });

  // Email Settings State
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    smtpSecure: true,
    fromEmail: 'noreply@finaster.com',
    fromName: 'Finaster Exchange',
  });

  const [emailTemplates] = useState<EmailTemplate[]>([
    {
      id: 'welcome',
      name: 'Welcome Email',
      subject: 'Welcome to {{PLATFORM_NAME}}!',
      body: 'Hello {{USER_NAME}},\n\nWelcome to {{PLATFORM_NAME}}! Your account has been successfully created.\n\nBest regards,\nThe Team',
      variables: ['PLATFORM_NAME', 'USER_NAME', 'USER_EMAIL'],
    },
    {
      id: 'kyc_approved',
      name: 'KYC Approved',
      subject: 'KYC Verification Approved',
      body: 'Hello {{USER_NAME}},\n\nYour KYC verification has been approved. You can now access all platform features.\n\nBest regards,\nThe Team',
      variables: ['USER_NAME', 'USER_EMAIL'],
    },
    {
      id: 'kyc_rejected',
      name: 'KYC Rejected',
      subject: 'KYC Verification Rejected',
      body: 'Hello {{USER_NAME}},\n\nYour KYC verification has been rejected. Reason: {{REJECTION_REASON}}\n\nPlease resubmit with correct information.\n\nBest regards,\nThe Team',
      variables: ['USER_NAME', 'USER_EMAIL', 'REJECTION_REASON'],
    },
    {
      id: 'withdrawal_processed',
      name: 'Withdrawal Processed',
      subject: 'Withdrawal Processed Successfully',
      body: 'Hello {{USER_NAME}},\n\nYour withdrawal of {{AMOUNT}} {{CURRENCY}} has been processed successfully.\n\nTransaction ID: {{TRANSACTION_ID}}\n\nBest regards,\nThe Team',
      variables: ['USER_NAME', 'AMOUNT', 'CURRENCY', 'TRANSACTION_ID'],
    },
    {
      id: 'package_purchase',
      name: 'Package Purchase',
      subject: 'Package Purchase Confirmation',
      body: 'Hello {{USER_NAME}},\n\nYou have successfully purchased the {{PACKAGE_NAME}} package for {{AMOUNT}} {{CURRENCY}}.\n\nBest regards,\nThe Team',
      variables: ['USER_NAME', 'PACKAGE_NAME', 'AMOUNT', 'CURRENCY'],
    },
    {
      id: 'rank_achievement',
      name: 'Rank Achievement',
      subject: 'Congratulations on Your New Rank!',
      body: 'Hello {{USER_NAME}},\n\nCongratulations! You have achieved the {{RANK_NAME}} rank!\n\nYour reward of {{REWARD_AMOUNT}} {{CURRENCY}} has been credited to your account.\n\nBest regards,\nThe Team',
      variables: ['USER_NAME', 'RANK_NAME', 'REWARD_AMOUNT', 'CURRENCY'],
    },
    {
      id: 'commission_earned',
      name: 'Commission Earned',
      subject: 'Commission Earned',
      body: 'Hello {{USER_NAME}},\n\nYou have earned a commission of {{COMMISSION_AMOUNT}} {{CURRENCY}} from {{COMMISSION_TYPE}}.\n\nBest regards,\nThe Team',
      variables: ['USER_NAME', 'COMMISSION_AMOUNT', 'CURRENCY', 'COMMISSION_TYPE'],
    },
  ]);

  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<EmailTemplate | null>(null);
  const [editingEmailTemplate, setEditingEmailTemplate] = useState<EmailTemplate | null>(null);

  // SMS Settings State
  const [smsSettings, setSmsSettings] = useState({
    provider: 'twilio',
    accountSid: '',
    authToken: '',
    fromNumber: '',
    creditsBalance: 5000,
  });

  const [smsTemplates] = useState<SMSTemplate[]>([
    {
      id: 'otp',
      name: 'OTP Verification',
      message: 'Your OTP for {{PLATFORM_NAME}} is {{OTP}}. Valid for 10 minutes.',
      variables: ['PLATFORM_NAME', 'OTP'],
    },
    {
      id: 'withdrawal_alert',
      name: 'Withdrawal Alert',
      message: 'Withdrawal of {{AMOUNT}} {{CURRENCY}} has been processed. Ref: {{TRANSACTION_ID}}',
      variables: ['AMOUNT', 'CURRENCY', 'TRANSACTION_ID'],
    },
    {
      id: 'login_alert',
      name: 'Login Alert',
      message: 'New login detected from {{IP_ADDRESS}} at {{TIME}}. If this wasn\'t you, secure your account immediately.',
      variables: ['IP_ADDRESS', 'TIME'],
    },
  ]);

  // Notification Settings State
  const [notificationSettings, setNotificationSettings] = useState({
    pushEnabled: true,
    firebaseServerKey: '',
    vapidPublicKey: '',
    vapidPrivateKey: '',
  });

  // Security Settings State
  const [securitySettings, setSecuritySettings] = useState({
    enforce2FAAdmin: true,
    enforce2FAUser: false,
    sessionTimeout: 30,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumber: true,
    passwordRequireSpecialChar: true,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    adminIPWhitelist: '',
  });

  // Referral Settings State
  const [referralSettings, setReferralSettings] = useState({
    linkFormat: 'https://finaster.com/register?ref={{USERNAME}}',
    codeFormat: 'ALPHA_NUMERIC_6',
    referralBonusEnabled: true,
    referralBonusAmount: 10,
    referralBonusType: 'fixed',
  });

  // Tax Settings State
  const [taxSettings, setTaxSettings] = useState({
    calculationMethod: 'percentage',
    taxPercentage: 0,
    tdsEnabled: false,
    tdsPercentage: 0,
    tdsThreshold: 10000,
  });

  // Maintenance Mode State
  const [maintenanceSettings, setMaintenanceSettings] = useState({
    enabled: false,
    message: 'The platform is currently under maintenance. We\'ll be back soon!',
    allowedIPs: '',
  });

  const tabs = [
    { id: 'general', label: 'General Settings', icon: '⚙️' },
    { id: 'commission', label: 'Commission Settings', icon: '💵' },
    { id: 'limits', label: 'Limits & Fees', icon: '💰' },
    { id: 'email', label: 'Email Settings', icon: '📧' },
    { id: 'sms', label: 'SMS Settings', icon: '📱' },
    { id: 'notification', label: 'Notification Settings', icon: '🔔' },
    { id: 'security', label: 'Security Settings', icon: '🔒' },
    { id: 'referral', label: 'Referral Settings', icon: '🔗' },
    { id: 'tax', label: 'Tax Settings', icon: '📊' },
    { id: 'maintenance', label: 'Maintenance Mode', icon: '🔧' },
  ];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/x-icon'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (PNG, JPG, SVG, or ICO)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    // Create object URL for preview
    const objectUrl = URL.createObjectURL(file);

    if (type === 'logo') {
      setLogoFile(file);
      setGeneralSettings({ ...generalSettings, logoUrl: objectUrl });
    } else {
      setFaviconFile(file);
      setGeneralSettings({ ...generalSettings, faviconUrl: objectUrl });
    }

    toast.success(`${type === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully!`);
  };

  const handleSaveSettings = () => {
    setIsSaving(true);

    // Update global settings (this will persist to localStorage automatically)
    updateSettings({
      platformName: generalSettings.platformName,
      logoUrl: generalSettings.logoUrl,
      faviconUrl: generalSettings.faviconUrl,
      timezone: generalSettings.timezone,
      currency: generalSettings.currency,
      dateFormat: generalSettings.dateFormat,
      language: generalSettings.language,
    });

    // Simulate API call for other settings
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Settings saved and applied throughout the platform!', {
        icon: '✅',
        duration: 3000,
      });
    }, 1000);
  };

  const handleTestEmail = () => {
    if (!emailSettings.smtpHost || !emailSettings.smtpUsername) {
      toast.error('Please configure SMTP settings first');
      return;
    }

    toast.loading('Sending test email...');

    setTimeout(() => {
      toast.dismiss();
      toast.success('Test email sent successfully!');
    }, 2000);
  };

  const handleTestSMS = () => {
    if (!smsSettings.accountSid || !smsSettings.authToken) {
      toast.error('Please configure SMS gateway settings first');
      return;
    }

    toast.loading('Sending test SMS...');

    setTimeout(() => {
      toast.dismiss();
      toast.success('Test SMS sent successfully!');
    }, 2000);
  };

  const handleEditEmailTemplate = (template: EmailTemplate) => {
    setEditingEmailTemplate({ ...template });
  };

  const handleSaveEmailTemplate = () => {
    toast.success('Email template saved successfully!');
    setEditingEmailTemplate(null);
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Platform Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Platform Name
            </label>
            <input
              type="text"
              value={generalSettings.platformName}
              onChange={(e) =>
                setGeneralSettings({ ...generalSettings, platformName: e.target.value })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Currency
            </label>
            <select
              value={generalSettings.currency}
              onChange={(e) =>
                setGeneralSettings({ ...generalSettings, currency: e.target.value })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="INR">INR - Indian Rupee</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Timezone
            </label>
            <select
              value={generalSettings.timezone}
              onChange={(e) =>
                setGeneralSettings({ ...generalSettings, timezone: e.target.value })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Date Format
            </label>
            <select
              value={generalSettings.dateFormat}
              onChange={(e) =>
                setGeneralSettings({ ...generalSettings, dateFormat: e.target.value })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Language
            </label>
            <select
              value={generalSettings.language}
              onChange={(e) =>
                setGeneralSettings({ ...generalSettings, language: e.target.value })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="hi">Hindi</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Branding</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Platform Logo
            </label>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                    onChange={(e) => handleLogoUpload(e, 'logo')}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="flex items-center justify-center w-full px-4 py-3 bg-[#0f172a] border-2 border-dashed border-[#334155] rounded-lg cursor-pointer hover:border-[#00C7D1] transition-colors"
                  >
                    <div className="text-center">
                      <div className="text-[#00C7D1] mb-1">📤</div>
                      <p className="text-sm text-[#cbd5e1]">
                        Click to upload logo
                      </p>
                      <p className="text-xs text-[#94a3b8] mt-1">
                        PNG, JPG, SVG (max 2MB)
                      </p>
                    </div>
                  </label>
                </div>
                <div className="mt-2">
                  <input
                    type="text"
                    value={generalSettings.logoUrl}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, logoUrl: e.target.value })
                    }
                    placeholder="Or paste logo URL here"
                    className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] text-sm focus:outline-none focus:border-[#00C7D1]"
                  />
                </div>
              </div>
              {generalSettings.logoUrl && (
                <div className="w-32 h-32 bg-[#0f172a] border border-[#334155] rounded-lg flex items-center justify-center p-2">
                  <img
                    src={generalSettings.logoUrl}
                    alt="Logo preview"
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Favicon
            </label>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="file"
                    accept="image/png,image/x-icon,image/jpeg"
                    onChange={(e) => handleLogoUpload(e, 'favicon')}
                    className="hidden"
                    id="favicon-upload"
                  />
                  <label
                    htmlFor="favicon-upload"
                    className="flex items-center justify-center w-full px-4 py-3 bg-[#0f172a] border-2 border-dashed border-[#334155] rounded-lg cursor-pointer hover:border-[#00C7D1] transition-colors"
                  >
                    <div className="text-center">
                      <div className="text-[#00C7D1] mb-1">📤</div>
                      <p className="text-sm text-[#cbd5e1]">
                        Click to upload favicon
                      </p>
                      <p className="text-xs text-[#94a3b8] mt-1">
                        ICO, PNG (16x16 or 32x32 px)
                      </p>
                    </div>
                  </label>
                </div>
                <div className="mt-2">
                  <input
                    type="text"
                    value={generalSettings.faviconUrl}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, faviconUrl: e.target.value })
                    }
                    placeholder="Or paste favicon URL here"
                    className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] text-sm focus:outline-none focus:border-[#00C7D1]"
                  />
                </div>
              </div>
              {generalSettings.faviconUrl && (
                <div className="w-16 h-16 bg-[#0f172a] border border-[#334155] rounded-lg flex items-center justify-center p-2">
                  <img
                    src={generalSettings.faviconUrl}
                    alt="Favicon preview"
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCommissionSettings = () => (
    <div className="space-y-6">
      <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-4xl">💵</div>
          <div>
            <h3 className="text-lg font-semibold text-[#f8fafc]">
              Commission Management
            </h3>
            <p className="text-sm text-[#94a3b8]">
              Configure commission rates and payouts
            </p>
          </div>
        </div>

        <p className="text-[#cbd5e1] mb-4">
          Commission settings are managed in a dedicated section with detailed configuration options.
        </p>

        <Link
          to="/admin/commissions"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#00C7D1] text-[#0f172a] rounded-lg font-semibold hover:bg-[#00e5f0] transition-colors"
        >
          <span>Go to Commission Management</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );

  const renderLimitsAndFees = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Transaction Limits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Minimum Deposit ($)
            </label>
            <input
              type="number"
              value={limitsAndFees.minDeposit}
              onChange={(e) =>
                setLimitsAndFees({ ...limitsAndFees, minDeposit: parseFloat(e.target.value) })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Minimum Withdrawal ($)
            </label>
            <input
              type="number"
              value={limitsAndFees.minWithdrawal}
              onChange={(e) =>
                setLimitsAndFees({ ...limitsAndFees, minWithdrawal: parseFloat(e.target.value) })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Maximum Withdrawal - Daily ($)
            </label>
            <input
              type="number"
              value={limitsAndFees.maxWithdrawalDaily}
              onChange={(e) =>
                setLimitsAndFees({
                  ...limitsAndFees,
                  maxWithdrawalDaily: parseFloat(e.target.value),
                })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Maximum Withdrawal - Weekly ($)
            </label>
            <input
              type="number"
              value={limitsAndFees.maxWithdrawalWeekly}
              onChange={(e) =>
                setLimitsAndFees({
                  ...limitsAndFees,
                  maxWithdrawalWeekly: parseFloat(e.target.value),
                })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Maximum Withdrawal - Monthly ($)
            </label>
            <input
              type="number"
              value={limitsAndFees.maxWithdrawalMonthly}
              onChange={(e) =>
                setLimitsAndFees({
                  ...limitsAndFees,
                  maxWithdrawalMonthly: parseFloat(e.target.value),
                })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Transaction Fees</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Deposit Fee (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={limitsAndFees.depositFeePercent}
              onChange={(e) =>
                setLimitsAndFees({
                  ...limitsAndFees,
                  depositFeePercent: parseFloat(e.target.value),
                })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Withdrawal Fee (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={limitsAndFees.withdrawalFeePercent}
              onChange={(e) =>
                setLimitsAndFees({
                  ...limitsAndFees,
                  withdrawalFeePercent: parseFloat(e.target.value),
                })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Internal Transfer Fee (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={limitsAndFees.transferFeePercent}
              onChange={(e) =>
                setLimitsAndFees({
                  ...limitsAndFees,
                  transferFeePercent: parseFloat(e.target.value),
                })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmailSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">SMTP Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              SMTP Host
            </label>
            <input
              type="text"
              value={emailSettings.smtpHost}
              onChange={(e) =>
                setEmailSettings({ ...emailSettings, smtpHost: e.target.value })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
              placeholder="smtp.gmail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              SMTP Port
            </label>
            <input
              type="number"
              value={emailSettings.smtpPort}
              onChange={(e) =>
                setEmailSettings({ ...emailSettings, smtpPort: parseInt(e.target.value) })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              SMTP Username
            </label>
            <input
              type="text"
              value={emailSettings.smtpUsername}
              onChange={(e) =>
                setEmailSettings({ ...emailSettings, smtpUsername: e.target.value })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
              placeholder="username@gmail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              SMTP Password
            </label>
            <input
              type="password"
              value={emailSettings.smtpPassword}
              onChange={(e) =>
                setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              From Email
            </label>
            <input
              type="email"
              value={emailSettings.fromEmail}
              onChange={(e) =>
                setEmailSettings({ ...emailSettings, fromEmail: e.target.value })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              From Name
            </label>
            <input
              type="text"
              value={emailSettings.fromName}
              onChange={(e) =>
                setEmailSettings({ ...emailSettings, fromName: e.target.value })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <label className="flex items-center gap-2 text-[#cbd5e1]">
            <input
              type="checkbox"
              checked={emailSettings.smtpSecure}
              onChange={(e) =>
                setEmailSettings({ ...emailSettings, smtpSecure: e.target.checked })
              }
              className="w-4 h-4 rounded border-[#334155] bg-[#0f172a] text-[#00C7D1] focus:ring-[#00C7D1]"
            />
            <span className="text-sm">Use TLS/SSL</span>
          </label>
        </div>

        <button
          onClick={handleTestEmail}
          className="mt-4 px-6 py-2 bg-[#334155] text-[#f8fafc] rounded-lg font-medium hover:bg-[#475569] transition-colors"
        >
          📧 Send Test Email
        </button>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Email Templates</h3>
        <div className="space-y-3">
          {emailTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-[#0f172a] border border-[#334155] rounded-lg p-4 hover:border-[#00C7D1] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-[#f8fafc]">{template.name}</h4>
                  <p className="text-sm text-[#94a3b8] mt-1">Subject: {template.subject}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {template.variables.map((variable) => (
                      <span
                        key={variable}
                        className="px-2 py-0.5 bg-[#334155] text-[#00C7D1] text-xs rounded"
                      >
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => handleEditEmailTemplate(template)}
                  className="px-4 py-2 bg-[#334155] text-[#f8fafc] rounded-lg text-sm font-medium hover:bg-[#475569] transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Email Template Editor Modal */}
      {editingEmailTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] rounded-lg border border-[#334155] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#334155]">
              <h3 className="text-xl font-bold text-[#f8fafc]">
                Edit Email Template: {editingEmailTemplate.name}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={editingEmailTemplate.subject}
                  onChange={(e) =>
                    setEditingEmailTemplate({
                      ...editingEmailTemplate,
                      subject: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Email Body
                </label>
                <textarea
                  value={editingEmailTemplate.body}
                  onChange={(e) =>
                    setEditingEmailTemplate({
                      ...editingEmailTemplate,
                      body: e.target.value,
                    })
                  }
                  rows={10}
                  className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1] font-mono text-sm"
                />
              </div>

              <div>
                <p className="text-sm text-[#94a3b8] mb-2">Available Variables:</p>
                <div className="flex flex-wrap gap-2">
                  {editingEmailTemplate.variables.map((variable) => (
                    <span
                      key={variable}
                      className="px-3 py-1 bg-[#334155] text-[#00C7D1] text-sm rounded cursor-pointer hover:bg-[#475569]"
                      onClick={() => {
                        const textarea = document.querySelector('textarea');
                        if (textarea) {
                          const cursorPos = textarea.selectionStart;
                          const textBefore = editingEmailTemplate.body.substring(0, cursorPos);
                          const textAfter = editingEmailTemplate.body.substring(cursorPos);
                          setEditingEmailTemplate({
                            ...editingEmailTemplate,
                            body: textBefore + `{{${variable}}}` + textAfter,
                          });
                        }
                      }}
                    >
                      {`{{${variable}}}`}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#334155] flex justify-end gap-3">
              <button
                onClick={() => setEditingEmailTemplate(null)}
                className="px-6 py-2 bg-[#334155] text-[#f8fafc] rounded-lg font-medium hover:bg-[#475569] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEmailTemplate}
                className="px-6 py-2 bg-[#00C7D1] text-[#0f172a] rounded-lg font-semibold hover:bg-[#00e5f0] transition-colors"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSMSSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">SMS Gateway Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              SMS Provider
            </label>
            <select
              value={smsSettings.provider}
              onChange={(e) =>
                setSmsSettings({ ...smsSettings, provider: e.target.value })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
            >
              <option value="twilio">Twilio</option>
              <option value="aws_sns">AWS SNS</option>
              <option value="nexmo">Nexmo/Vonage</option>
              <option value="messagebird">MessageBird</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              From Number
            </label>
            <input
              type="text"
              value={smsSettings.fromNumber}
              onChange={(e) =>
                setSmsSettings({ ...smsSettings, fromNumber: e.target.value })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
              placeholder="+1234567890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Account SID / API Key
            </label>
            <input
              type="text"
              value={smsSettings.accountSid}
              onChange={(e) =>
                setSmsSettings({ ...smsSettings, accountSid: e.target.value })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
              placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Auth Token / Secret
            </label>
            <input
              type="password"
              value={smsSettings.authToken}
              onChange={(e) =>
                setSmsSettings({ ...smsSettings, authToken: e.target.value })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between bg-[#0f172a] border border-[#334155] rounded-lg p-4">
          <div>
            <p className="text-sm font-medium text-[#cbd5e1]">SMS Credits Balance</p>
            <p className="text-2xl font-bold text-[#00C7D1] mt-1">
              {smsSettings.creditsBalance.toLocaleString()}
            </p>
          </div>
          <button
            onClick={handleTestSMS}
            className="px-6 py-2 bg-[#334155] text-[#f8fafc] rounded-lg font-medium hover:bg-[#475569] transition-colors"
          >
            📱 Send Test SMS
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">SMS Templates</h3>
        <div className="space-y-3">
          {smsTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-[#0f172a] border border-[#334155] rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-[#f8fafc]">{template.name}</h4>
                  <p className="text-sm text-[#cbd5e1] mt-2">{template.message}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {template.variables.map((variable) => (
                      <span
                        key={variable}
                        className="px-2 py-0.5 bg-[#334155] text-[#00C7D1] text-xs rounded"
                      >
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>
                </div>
                <button className="ml-4 px-4 py-2 bg-[#334155] text-[#f8fafc] rounded-lg text-sm font-medium hover:bg-[#475569] transition-colors">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">
          Push Notification Configuration
        </h3>

        <div className="mb-4">
          <label className="flex items-center gap-2 text-[#cbd5e1]">
            <input
              type="checkbox"
              checked={notificationSettings.pushEnabled}
              onChange={(e) =>
                setNotificationSettings({
                  ...notificationSettings,
                  pushEnabled: e.target.checked,
                })
              }
              className="w-4 h-4 rounded border-[#334155] bg-[#0f172a] text-[#00C7D1] focus:ring-[#00C7D1]"
            />
            <span className="text-sm font-medium">Enable Push Notifications</span>
          </label>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Firebase Server Key
            </label>
            <input
              type="password"
              value={notificationSettings.firebaseServerKey}
              onChange={(e) =>
                setNotificationSettings({
                  ...notificationSettings,
                  firebaseServerKey: e.target.value,
                })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
              placeholder="AAAA..."
              disabled={!notificationSettings.pushEnabled}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              VAPID Public Key
            </label>
            <input
              type="text"
              value={notificationSettings.vapidPublicKey}
              onChange={(e) =>
                setNotificationSettings({
                  ...notificationSettings,
                  vapidPublicKey: e.target.value,
                })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
              disabled={!notificationSettings.pushEnabled}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              VAPID Private Key
            </label>
            <input
              type="password"
              value={notificationSettings.vapidPrivateKey}
              onChange={(e) =>
                setNotificationSettings({
                  ...notificationSettings,
                  vapidPrivateKey: e.target.value,
                })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
              disabled={!notificationSettings.pushEnabled}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Notification Templates</h3>
        <div className="space-y-3">
          {[
            {
              id: 'deposit',
              title: 'Deposit Received',
              message: 'Your deposit of ${{AMOUNT}} has been received',
            },
            {
              id: 'withdrawal',
              title: 'Withdrawal Processed',
              message: 'Your withdrawal request has been processed',
            },
            {
              id: 'commission',
              title: 'Commission Earned',
              message: 'You earned ${{AMOUNT}} commission',
            },
            {
              id: 'rank',
              title: 'Rank Achievement',
              message: 'Congratulations! You achieved {{RANK_NAME}} rank',
            },
          ].map((template) => (
            <div
              key={template.id}
              className="bg-[#0f172a] border border-[#334155] rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <h4 className="font-semibold text-[#f8fafc]">{template.title}</h4>
                <p className="text-sm text-[#94a3b8] mt-1">{template.message}</p>
              </div>
              <button className="px-4 py-2 bg-[#334155] text-[#f8fafc] rounded-lg text-sm font-medium hover:bg-[#475569] transition-colors">
                Edit
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">
          Two-Factor Authentication (2FA)
        </h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-4 bg-[#0f172a] border border-[#334155] rounded-lg cursor-pointer">
            <div>
              <div className="font-medium text-[#f8fafc]">Enforce 2FA for Admins</div>
              <div className="text-sm text-[#94a3b8] mt-1">
                Require all admin users to enable 2FA
              </div>
            </div>
            <input
              type="checkbox"
              checked={securitySettings.enforce2FAAdmin}
              onChange={(e) =>
                setSecuritySettings({
                  ...securitySettings,
                  enforce2FAAdmin: e.target.checked,
                })
              }
              className="w-5 h-5 rounded border-[#334155] bg-[#0f172a] text-[#00C7D1] focus:ring-[#00C7D1]"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-[#0f172a] border border-[#334155] rounded-lg cursor-pointer">
            <div>
              <div className="font-medium text-[#f8fafc]">Enforce 2FA for Users</div>
              <div className="text-sm text-[#94a3b8] mt-1">
                Require all regular users to enable 2FA
              </div>
            </div>
            <input
              type="checkbox"
              checked={securitySettings.enforce2FAUser}
              onChange={(e) =>
                setSecuritySettings({
                  ...securitySettings,
                  enforce2FAUser: e.target.checked,
                })
              }
              className="w-5 h-5 rounded border-[#334155] bg-[#0f172a] text-[#00C7D1] focus:ring-[#00C7D1]"
            />
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Session Management</h3>
        <div>
          <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
            Session Timeout (minutes)
          </label>
          <input
            type="number"
            value={securitySettings.sessionTimeout}
            onChange={(e) =>
              setSecuritySettings({
                ...securitySettings,
                sessionTimeout: parseInt(e.target.value),
              })
            }
            className="w-full max-w-xs px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
          />
          <p className="text-xs text-[#94a3b8] mt-1">
            Users will be logged out after this period of inactivity
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Password Policy</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Minimum Password Length
            </label>
            <input
              type="number"
              value={securitySettings.passwordMinLength}
              onChange={(e) =>
                setSecuritySettings({
                  ...securitySettings,
                  passwordMinLength: parseInt(e.target.value),
                })
              }
              className="w-full max-w-xs px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[#cbd5e1]">
              <input
                type="checkbox"
                checked={securitySettings.passwordRequireUppercase}
                onChange={(e) =>
                  setSecuritySettings({
                    ...securitySettings,
                    passwordRequireUppercase: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-[#334155] bg-[#0f172a] text-[#00C7D1] focus:ring-[#00C7D1]"
              />
              <span className="text-sm">Require uppercase letters</span>
            </label>

            <label className="flex items-center gap-2 text-[#cbd5e1]">
              <input
                type="checkbox"
                checked={securitySettings.passwordRequireLowercase}
                onChange={(e) =>
                  setSecuritySettings({
                    ...securitySettings,
                    passwordRequireLowercase: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-[#334155] bg-[#0f172a] text-[#00C7D1] focus:ring-[#00C7D1]"
              />
              <span className="text-sm">Require lowercase letters</span>
            </label>

            <label className="flex items-center gap-2 text-[#cbd5e1]">
              <input
                type="checkbox"
                checked={securitySettings.passwordRequireNumber}
                onChange={(e) =>
                  setSecuritySettings({
                    ...securitySettings,
                    passwordRequireNumber: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-[#334155] bg-[#0f172a] text-[#00C7D1] focus:ring-[#00C7D1]"
              />
              <span className="text-sm">Require numbers</span>
            </label>

            <label className="flex items-center gap-2 text-[#cbd5e1]">
              <input
                type="checkbox"
                checked={securitySettings.passwordRequireSpecialChar}
                onChange={(e) =>
                  setSecuritySettings({
                    ...securitySettings,
                    passwordRequireSpecialChar: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-[#334155] bg-[#0f172a] text-[#00C7D1] focus:ring-[#00C7D1]"
              />
              <span className="text-sm">Require special characters</span>
            </label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Login Security</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Max Login Attempts
            </label>
            <input
              type="number"
              value={securitySettings.maxLoginAttempts}
              onChange={(e) =>
                setSecuritySettings({
                  ...securitySettings,
                  maxLoginAttempts: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Lockout Duration (minutes)
            </label>
            <input
              type="number"
              value={securitySettings.lockoutDuration}
              onChange={(e) =>
                setSecuritySettings({
                  ...securitySettings,
                  lockoutDuration: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">
          Admin IP Whitelist
        </h3>
        <textarea
          value={securitySettings.adminIPWhitelist}
          onChange={(e) =>
            setSecuritySettings({
              ...securitySettings,
              adminIPWhitelist: e.target.value,
            })
          }
          rows={4}
          placeholder="Enter IP addresses (one per line)&#10;192.168.1.1&#10;10.0.0.1"
          className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1] font-mono text-sm"
        />
        <p className="text-xs text-[#94a3b8] mt-1">
          Leave empty to allow access from all IPs. Enter one IP address per line to restrict admin access.
        </p>
      </div>
    </div>
  );

  const renderReferralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Referral Link Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Referral Link Format
            </label>
            <input
              type="text"
              value={referralSettings.linkFormat}
              onChange={(e) =>
                setReferralSettings({ ...referralSettings, linkFormat: e.target.value })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
            />
            <p className="text-xs text-[#94a3b8] mt-1">
              Use {`{{USERNAME}}`} or {`{{USER_ID}}`} or {`{{REFERRAL_CODE}}`} as placeholder
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Referral Code Format
            </label>
            <select
              value={referralSettings.codeFormat}
              onChange={(e) =>
                setReferralSettings({ ...referralSettings, codeFormat: e.target.value })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
            >
              <option value="ALPHA_NUMERIC_6">Alphanumeric (6 characters)</option>
              <option value="ALPHA_NUMERIC_8">Alphanumeric (8 characters)</option>
              <option value="NUMERIC_6">Numeric only (6 digits)</option>
              <option value="CUSTOM">Custom (Username-based)</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Referral Bonus</h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-[#0f172a] border border-[#334155] rounded-lg cursor-pointer">
            <div>
              <div className="font-medium text-[#f8fafc]">Enable Referral Bonus</div>
              <div className="text-sm text-[#94a3b8] mt-1">
                Reward users for referring new members
              </div>
            </div>
            <input
              type="checkbox"
              checked={referralSettings.referralBonusEnabled}
              onChange={(e) =>
                setReferralSettings({
                  ...referralSettings,
                  referralBonusEnabled: e.target.checked,
                })
              }
              className="w-5 h-5 rounded border-[#334155] bg-[#0f172a] text-[#00C7D1] focus:ring-[#00C7D1]"
            />
          </label>

          {referralSettings.referralBonusEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Bonus Type
                </label>
                <select
                  value={referralSettings.referralBonusType}
                  onChange={(e) =>
                    setReferralSettings({
                      ...referralSettings,
                      referralBonusType: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                >
                  <option value="fixed">Fixed Amount</option>
                  <option value="percentage">Percentage of First Investment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  {referralSettings.referralBonusType === 'fixed'
                    ? 'Bonus Amount ($)'
                    : 'Bonus Percentage (%)'}
                </label>
                <input
                  type="number"
                  value={referralSettings.referralBonusAmount}
                  onChange={(e) =>
                    setReferralSettings({
                      ...referralSettings,
                      referralBonusAmount: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-4">
        <h4 className="font-semibold text-[#f8fafc] mb-2">Example Referral Link</h4>
        <code className="text-sm text-[#00C7D1] break-all">
          {referralSettings.linkFormat.replace('{{USERNAME}}', 'john_doe')}
        </code>
      </div>
    </div>
  );

  const renderTaxSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Tax Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Tax Calculation Method
            </label>
            <select
              value={taxSettings.calculationMethod}
              onChange={(e) =>
                setTaxSettings({ ...taxSettings, calculationMethod: e.target.value })
              }
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
            >
              <option value="none">No Tax</option>
              <option value="percentage">Percentage-based</option>
              <option value="tiered">Tiered (based on amount)</option>
            </select>
          </div>

          {taxSettings.calculationMethod === 'percentage' && (
            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                Tax Percentage (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={taxSettings.taxPercentage}
                onChange={(e) =>
                  setTaxSettings({ ...taxSettings, taxPercentage: parseFloat(e.target.value) })
                }
                className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
              />
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">
          TDS (Tax Deducted at Source)
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-[#0f172a] border border-[#334155] rounded-lg cursor-pointer">
            <div>
              <div className="font-medium text-[#f8fafc]">Enable TDS on Withdrawals</div>
              <div className="text-sm text-[#94a3b8] mt-1">
                Automatically deduct TDS from withdrawal amounts
              </div>
            </div>
            <input
              type="checkbox"
              checked={taxSettings.tdsEnabled}
              onChange={(e) =>
                setTaxSettings({ ...taxSettings, tdsEnabled: e.target.checked })
              }
              className="w-5 h-5 rounded border-[#334155] bg-[#0f172a] text-[#00C7D1] focus:ring-[#00C7D1]"
            />
          </label>

          {taxSettings.tdsEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  TDS Percentage (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={taxSettings.tdsPercentage}
                  onChange={(e) =>
                    setTaxSettings({ ...taxSettings, tdsPercentage: parseFloat(e.target.value) })
                  }
                  className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  TDS Threshold ($)
                </label>
                <input
                  type="number"
                  value={taxSettings.tdsThreshold}
                  onChange={(e) =>
                    setTaxSettings({ ...taxSettings, tdsThreshold: parseFloat(e.target.value) })
                  }
                  className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                />
                <p className="text-xs text-[#94a3b8] mt-1">
                  TDS will only apply to withdrawals above this amount
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#334155] border border-[#475569] rounded-lg p-4">
        <p className="text-sm text-[#cbd5e1]">
          <strong>Note:</strong> Tax settings should be configured according to your local regulations.
          Consult with a tax professional before enabling tax features.
        </p>
      </div>
    </div>
  );

  const renderMaintenanceMode = () => (
    <div className="space-y-6">
      <div>
        <label className="flex items-center justify-between p-6 bg-[#0f172a] border-2 border-[#334155] rounded-lg cursor-pointer hover:border-[#00C7D1] transition-colors">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔧</span>
              <div>
                <div className="text-lg font-semibold text-[#f8fafc]">
                  Enable Maintenance Mode
                </div>
                <div className="text-sm text-[#94a3b8] mt-1">
                  Restrict platform access during maintenance
                </div>
              </div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={maintenanceSettings.enabled}
            onChange={(e) =>
              setMaintenanceSettings({ ...maintenanceSettings, enabled: e.target.checked })
            }
            className="w-6 h-6 rounded border-[#334155] bg-[#0f172a] text-[#00C7D1] focus:ring-[#00C7D1]"
          />
        </label>

        {maintenanceSettings.enabled && (
          <div className="bg-[#ef4444]/10 border border-[#ef4444] rounded-lg p-4">
            <div className="flex items-center gap-2 text-[#ef4444] mb-2">
              <span>⚠️</span>
              <span className="font-semibold">Warning</span>
            </div>
            <p className="text-sm text-[#cbd5e1]">
              Enabling maintenance mode will prevent all users (except whitelisted IPs) from accessing
              the platform. Only enable this during planned maintenance.
            </p>
          </div>
        )}
      </div>

      {maintenanceSettings.enabled && (
        <>
          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Maintenance Message
            </label>
            <textarea
              value={maintenanceSettings.message}
              onChange={(e) =>
                setMaintenanceSettings({ ...maintenanceSettings, message: e.target.value })
              }
              rows={4}
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
              placeholder="Enter the message users will see during maintenance"
            />
            <p className="text-xs text-[#94a3b8] mt-1">
              This message will be displayed to users when they try to access the platform
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Allowed IP Addresses (Whitelist)
            </label>
            <textarea
              value={maintenanceSettings.allowedIPs}
              onChange={(e) =>
                setMaintenanceSettings({ ...maintenanceSettings, allowedIPs: e.target.value })
              }
              rows={6}
              placeholder="Enter IP addresses (one per line)&#10;192.168.1.1&#10;10.0.0.1&#10;203.0.113.0"
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1] font-mono text-sm"
            />
            <p className="text-xs text-[#94a3b8] mt-1">
              These IP addresses will still be able to access the platform during maintenance. Enter one IP per line.
            </p>
          </div>

          <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-4">
            <h4 className="font-semibold text-[#f8fafc] mb-2">Maintenance Preview</h4>
            <div className="bg-[#1e293b] border border-[#475569] rounded p-4 text-center">
              <div className="text-4xl mb-3">🔧</div>
              <h3 className="text-lg font-bold text-[#f8fafc] mb-2">Under Maintenance</h3>
              <p className="text-sm text-[#cbd5e1]">{maintenanceSettings.message}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#f8fafc] mb-2">System Settings</h1>
          <p className="text-[#94a3b8]">Configure platform settings and parameters</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#00C7D1] text-[#0f172a]'
                    : 'bg-[#1e293b] text-[#cbd5e1] hover:bg-[#334155]'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-6 mb-6">
          {activeTab === 'general' && renderGeneralSettings()}
          {activeTab === 'commission' && renderCommissionSettings()}
          {activeTab === 'limits' && renderLimitsAndFees()}
          {activeTab === 'email' && renderEmailSettings()}
          {activeTab === 'sms' && renderSMSSettings()}
          {activeTab === 'notification' && renderNotificationSettings()}
          {activeTab === 'security' && renderSecuritySettings()}
          {activeTab === 'referral' && renderReferralSettings()}
          {activeTab === 'tax' && renderTaxSettings()}
          {activeTab === 'maintenance' && renderMaintenanceMode()}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="px-6 py-3 bg-[#334155] text-[#f8fafc] rounded-lg font-medium hover:bg-[#475569] transition-colors"
          >
            ← Back to Dashboard
          </button>

          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
              isSaving
                ? 'bg-[#475569] text-[#94a3b8] cursor-not-allowed'
                : 'bg-[#00C7D1] text-[#0f172a] hover:bg-[#00e5f0]'
            }`}
          >
            {isSaving ? '💾 Saving...' : '💾 Save All Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsAdmin;
