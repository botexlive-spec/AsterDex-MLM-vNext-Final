import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import * as CommunicationsService from '../../services/admin-communications.service';

// Email history interface
interface EmailHistory {
  id: string;
  subject: string;
  recipients: number;
  sentDate: string;
  opened: number;
  clicked: number;
  status: 'sent' | 'scheduled' | 'draft';
}

// Announcement interface
interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: 'info' | 'warning' | 'urgent';
  displayLocation: 'banner' | 'popup';
  targetUsers: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'scheduled' | 'expired';
}

// News article interface
interface NewsArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  featuredImage: string;
  author: string;
  publishDate: string;
  status: 'published' | 'draft';
  views: number;
}

// Push notification interface
interface PushNotification {
  id: string;
  title: string;
  message: string;
  targetUsers: number;
  sentDate: string;
  delivered: number;
  clicked: number;
}

export const CommunicationsAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('email');

  // Bulk Email State
  const [emailRecipients, setEmailRecipients] = useState('all');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSchedule, setEmailSchedule] = useState('now');
  const [emailScheduleDate, setEmailScheduleDate] = useState('');
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  const [emailHistory] = useState<EmailHistory[]>([
    {
      id: '1',
      subject: 'Welcome to our New Trading Platform!',
      recipients: 5420,
      sentDate: '2025-10-28',
      opened: 4235,
      clicked: 2180,
      status: 'sent',
    },
    {
      id: '2',
      subject: 'Special Promotion - 20% Bonus on Deposits',
      recipients: 3200,
      sentDate: '2025-10-25',
      opened: 2850,
      clicked: 1920,
      status: 'sent',
    },
    {
      id: '3',
      subject: 'System Maintenance Notice',
      recipients: 5420,
      sentDate: '2025-11-05',
      opened: 0,
      clicked: 0,
      status: 'scheduled',
    },
  ]);

  // Bulk SMS State
  const [smsRecipients, setSmsRecipients] = useState('all');
  const [smsMessage, setSmsMessage] = useState('');
  const [smsSchedule, setSmsSchedule] = useState('now');
  const [smsCreditsBalance] = useState(15000);

  // Announcements State
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementPriority, setAnnouncementPriority] = useState<'info' | 'warning' | 'urgent'>('info');
  const [announcementDisplay, setAnnouncementDisplay] = useState('banner');
  const [announcementTarget, setAnnouncementTarget] = useState('all');

  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: '1',
      title: 'Platform Update - New Features',
      message: 'We have added several new features including advanced charting and social trading.',
      priority: 'info',
      displayLocation: 'banner',
      targetUsers: 'All Users',
      startDate: '2025-10-20',
      endDate: '2025-11-20',
      status: 'active',
    },
    {
      id: '2',
      title: 'Important: KYC Verification Required',
      message: 'All users must complete KYC verification by November 30th to continue using withdrawal features.',
      priority: 'warning',
      displayLocation: 'popup',
      targetUsers: 'Unverified Users',
      startDate: '2025-10-15',
      endDate: '2025-11-30',
      status: 'active',
    },
  ]);

  // News/Blog State
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsCategory, setNewsCategory] = useState('platform');
  const [newsFeaturedImage, setNewsFeaturedImage] = useState('');
  const [newsStatus, setNewsStatus] = useState<'published' | 'draft'>('draft');

  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([
    {
      id: '1',
      title: 'Understanding Cryptocurrency Trading: A Beginner\'s Guide',
      content: 'Cryptocurrency trading has become increasingly popular...',
      category: 'education',
      featuredImage: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247',
      author: 'Admin Team',
      publishDate: '2025-10-25',
      status: 'published',
      views: 3540,
    },
    {
      id: '2',
      title: 'New Trading Pairs Added: BTC/USDT and ETH/USDT',
      content: 'We are excited to announce new trading pairs...',
      category: 'platform',
      featuredImage: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d',
      author: 'Admin Team',
      publishDate: '2025-10-28',
      status: 'published',
      views: 2180,
    },
  ]);

  // Push Notifications State
  const [pushTitle, setPushTitle] = useState('');
  const [pushMessage, setPushMessage] = useState('');
  const [pushTargetUsers, setPushTargetUsers] = useState('all');
  const [pushAction, setPushAction] = useState('none');
  const [pushActionUrl, setPushActionUrl] = useState('');

  const [pushHistory] = useState<PushNotification[]>([
    {
      id: '1',
      title: 'Welcome Bonus Available!',
      message: 'Claim your 50% welcome bonus now',
      targetUsers: 524,
      sentDate: '2025-10-28',
      delivered: 510,
      clicked: 382,
    },
    {
      id: '2',
      title: 'Price Alert',
      message: 'BTC reached $50,000',
      targetUsers: 2140,
      sentDate: '2025-10-27',
      delivered: 2098,
      clicked: 1245,
    },
  ]);

  const tabs = [
    { id: 'email', label: 'Bulk Email', icon: '📧' },
    { id: 'sms', label: 'Bulk SMS', icon: '📱' },
    { id: 'announcements', label: 'Announcements', icon: '📢' },
    { id: 'news', label: 'News/Blog', icon: '📰' },
    { id: 'push', label: 'Push Notifications', icon: '🔔' },
  ];

  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedEmailTemplate = localStorage.getItem('emailTemplate');
    if (savedEmailTemplate) {
      const template = JSON.parse(savedEmailTemplate);
      setEmailSubject(template.subject || '');
      setEmailBody(template.body || '');
    }

    const savedEmailRecipients = localStorage.getItem('emailRecipients');
    if (savedEmailRecipients) {
      setEmailRecipients(savedEmailRecipients);
    }

    const savedSmsRecipients = localStorage.getItem('smsRecipients');
    if (savedSmsRecipients) {
      setSmsRecipients(savedSmsRecipients);
    }

    const savedEmailSchedule = localStorage.getItem('emailSchedule');
    if (savedEmailSchedule) {
      const schedule = JSON.parse(savedEmailSchedule);
      setEmailSchedule(schedule.type || 'now');
      setEmailScheduleDate(schedule.date || '');
    }
  }, []);

  // Save email template to localStorage when it changes
  useEffect(() => {
    if (emailSubject || emailBody) {
      localStorage.setItem('emailTemplate', JSON.stringify({
        subject: emailSubject,
        body: emailBody,
      }));
    }
  }, [emailSubject, emailBody]);

  // Save email recipients selection to localStorage
  useEffect(() => {
    localStorage.setItem('emailRecipients', emailRecipients);
  }, [emailRecipients]);

  // Save SMS recipients selection to localStorage
  useEffect(() => {
    localStorage.setItem('smsRecipients', smsRecipients);
  }, [smsRecipients]);

  // Save email scheduling to localStorage
  useEffect(() => {
    localStorage.setItem('emailSchedule', JSON.stringify({
      type: emailSchedule,
      date: emailScheduleDate,
    }));
  }, [emailSchedule, emailScheduleDate]);

  // Load announcements and news articles from database on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [announcementsData, newsData] = await Promise.all([
          CommunicationsService.getAnnouncements(),
          CommunicationsService.getNewsArticles(),
        ]);

        if (announcementsData.length > 0) {
          setAnnouncements(announcementsData as any);
        }

        if (newsData.length > 0) {
          setNewsArticles(newsData as any);
        }
      } catch (error) {
        console.error('Error loading communications data:', error);
      }
    };

    loadData();
  }, []);

  const handleSendTestEmail = () => {
    if (!emailSubject || !emailBody) {
      toast.error('Please fill in subject and message to send test email');
      return;
    }

    // Simulate sending test email to admin
    toast.success('Test email sent to your admin email address!', {
      icon: '✉️',
      duration: 3000,
    });
  };

  const handleSendEmail = async () => {
    if (!emailSubject || !emailBody) {
      toast.error('Please fill in subject and message');
      return;
    }

    try {
      toast.loading('Sending email...', { id: 'send-email' });

      const result = await CommunicationsService.sendBulkEmail({
        subject: emailSubject,
        body: emailBody,
        recipients: emailRecipients as 'all' | 'verified' | 'unverified',
        schedule: emailSchedule === 'scheduled' ? emailScheduleDate : undefined,
      });

      toast.success(`Email sent to ${result.recipients} recipients!`, { id: 'send-email' });

      // Reset form
      setEmailSubject('');
      setEmailBody('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send email', { id: 'send-email' });
    }
  };

  const handleSendSMS = async () => {
    if (!smsMessage) {
      toast.error('Please enter SMS message');
      return;
    }

    if (smsMessage.length > 160) {
      toast.error('SMS message exceeds 160 characters');
      return;
    }

    try {
      toast.loading('Sending SMS...', { id: 'send-sms' });

      const result = await CommunicationsService.sendBulkSMS({
        message: smsMessage,
        recipients: smsRecipients as 'all' | 'verified' | 'active',
      });

      toast.success(`SMS sent to ${result.recipients} recipients! Credits used: ${result.creditsUsed}`, { id: 'send-sms' });
      setSmsMessage('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send SMS', { id: 'send-sms' });
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!announcementTitle || !announcementMessage) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      toast.loading('Creating announcement...', { id: 'create-announcement' });

      const result = await CommunicationsService.createAnnouncement({
        title: announcementTitle,
        message: announcementMessage,
        priority: announcementPriority,
        display_location: announcementDisplay as 'banner' | 'popup',
        target_users: announcementTarget,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
      });

      toast.success('Announcement created and broadcast to users!', { id: 'create-announcement' });

      // Reset form
      setAnnouncementTitle('');
      setAnnouncementMessage('');

      // Refresh announcements list
      const updatedAnnouncements = await CommunicationsService.getAnnouncements();
      setAnnouncements(updatedAnnouncements as any);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create announcement', { id: 'create-announcement' });
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      toast.loading('Deleting announcement...', { id: 'delete-announcement' });

      await CommunicationsService.deleteAnnouncement(id);

      toast.success('Announcement deleted successfully!', { id: 'delete-announcement' });

      // Refresh announcements list
      const updatedAnnouncements = await CommunicationsService.getAnnouncements();
      setAnnouncements(updatedAnnouncements as any);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete announcement', { id: 'delete-announcement' });
    }
  };

  const handleCreateNews = async () => {
    if (!newsTitle || !newsContent) {
      toast.error('Please fill in title and content');
      return;
    }

    try {
      toast.loading(`${newsStatus === 'published' ? 'Publishing' : 'Saving'} article...`, { id: 'create-news' });

      const result = await CommunicationsService.createNewsArticle({
        title: newsTitle,
        content: newsContent,
        category: newsCategory,
        featured_image: newsFeaturedImage || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3',
        author: 'Admin Team',
        publish_date: new Date().toISOString(),
        status: newsStatus,
      });

      toast.success(`News article ${newsStatus === 'published' ? 'published' : 'saved as draft'}!`, { id: 'create-news' });

      // Reset form
      setNewsTitle('');
      setNewsContent('');
      setNewsFeaturedImage('');

      // Refresh news articles list
      const updatedArticles = await CommunicationsService.getNewsArticles();
      setNewsArticles(updatedArticles as any);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create news article', { id: 'create-news' });
    }
  };

  const handleSendPushNotification = async () => {
    if (!pushTitle || !pushMessage) {
      toast.error('Please fill in title and message');
      return;
    }

    try {
      toast.loading('Sending push notification...', { id: 'send-push' });

      const result = await CommunicationsService.sendBulkNotification({
        title: pushTitle,
        message: pushMessage,
        type: 'push',
        targetUsers: pushTargetUsers as 'all' | 'active' | 'inactive',
      });

      toast.success(`Push notification sent to ${result.recipients} users!`, { id: 'send-push' });

      // Reset form
      setPushTitle('');
      setPushMessage('');
      setPushActionUrl('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send push notification', { id: 'send-push' });
    }
  };

  const renderBulkEmail = () => (
    <div className="space-y-6">
      {/* Recipient Selection */}
      <div>
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Recipient Selection</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <label className="flex items-center p-4 bg-[#0f172a] border border-[#334155] rounded-lg cursor-pointer hover:border-[#00C7D1] transition-colors">
            <input
              type="radio"
              name="recipients"
              value="all"
              checked={emailRecipients === 'all'}
              onChange={(e) => setEmailRecipients(e.target.value)}
              className="w-4 h-4 text-[#00C7D1] focus:ring-[#00C7D1]"
            />
            <div className="ml-3">
              <div className="text-sm font-medium text-[#f8fafc]">All Users</div>
              <div className="text-xs text-[#94a3b8]">5,420 users</div>
            </div>
          </label>

          <label className="flex items-center p-4 bg-[#0f172a] border border-[#334155] rounded-lg cursor-pointer hover:border-[#00C7D1] transition-colors">
            <input
              type="radio"
              name="recipients"
              value="active"
              checked={emailRecipients === 'active'}
              onChange={(e) => setEmailRecipients(e.target.value)}
              className="w-4 h-4 text-[#00C7D1] focus:ring-[#00C7D1]"
            />
            <div className="ml-3">
              <div className="text-sm font-medium text-[#f8fafc]">Active Users</div>
              <div className="text-xs text-[#94a3b8]">3,840 users</div>
            </div>
          </label>

          <label className="flex items-center p-4 bg-[#0f172a] border border-[#334155] rounded-lg cursor-pointer hover:border-[#00C7D1] transition-colors">
            <input
              type="radio"
              name="recipients"
              value="inactive"
              checked={emailRecipients === 'inactive'}
              onChange={(e) => setEmailRecipients(e.target.value)}
              className="w-4 h-4 text-[#00C7D1] focus:ring-[#00C7D1]"
            />
            <div className="ml-3">
              <div className="text-sm font-medium text-[#f8fafc]">Inactive Users</div>
              <div className="text-xs text-[#94a3b8]">1,580 users</div>
            </div>
          </label>

          <label className="flex items-center p-4 bg-[#0f172a] border border-[#334155] rounded-lg cursor-pointer hover:border-[#00C7D1] transition-colors">
            <input
              type="radio"
              name="recipients"
              value="rank"
              checked={emailRecipients === 'rank'}
              onChange={(e) => setEmailRecipients(e.target.value)}
              className="w-4 h-4 text-[#00C7D1] focus:ring-[#00C7D1]"
            />
            <div className="ml-3">
              <div className="text-sm font-medium text-[#f8fafc]">Specific Rank</div>
              <div className="text-xs text-[#94a3b8]">Filter by rank</div>
            </div>
          </label>

          <label className="flex items-center p-4 bg-[#0f172a] border border-[#334155] rounded-lg cursor-pointer hover:border-[#00C7D1] transition-colors">
            <input
              type="radio"
              name="recipients"
              value="investment"
              checked={emailRecipients === 'investment'}
              onChange={(e) => setEmailRecipients(e.target.value)}
              className="w-4 h-4 text-[#00C7D1] focus:ring-[#00C7D1]"
            />
            <div className="ml-3">
              <div className="text-sm font-medium text-[#f8fafc]">Investment Range</div>
              <div className="text-xs text-[#94a3b8]">Filter by amount</div>
            </div>
          </label>

          <label className="flex items-center p-4 bg-[#0f172a] border border-[#334155] rounded-lg cursor-pointer hover:border-[#00C7D1] transition-colors">
            <input
              type="radio"
              name="recipients"
              value="csv"
              checked={emailRecipients === 'csv'}
              onChange={(e) => setEmailRecipients(e.target.value)}
              className="w-4 h-4 text-[#00C7D1] focus:ring-[#00C7D1]"
            />
            <div className="ml-3">
              <div className="text-sm font-medium text-[#f8fafc]">Upload CSV</div>
              <div className="text-xs text-[#94a3b8]">Custom list</div>
            </div>
          </label>
        </div>
      </div>

      {/* Email Composer */}
      <div>
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Email Composer</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Subject
            </label>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
              placeholder="Enter email subject"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Email Body
            </label>
            <div className="mb-2 flex flex-wrap gap-2">
              <button
                onClick={() => setEmailBody(emailBody + '{{USER_NAME}}')}
                className="px-3 py-1 bg-[#334155] text-[#00C7D1] text-xs rounded hover:bg-[#475569]"
              >
                + User Name
              </button>
              <button
                onClick={() => setEmailBody(emailBody + '{{USER_EMAIL}}')}
                className="px-3 py-1 bg-[#334155] text-[#00C7D1] text-xs rounded hover:bg-[#475569]"
              >
                + User Email
              </button>
              <button
                onClick={() => setEmailBody(emailBody + '{{BALANCE}}')}
                className="px-3 py-1 bg-[#334155] text-[#00C7D1] text-xs rounded hover:bg-[#475569]"
              >
                + Balance
              </button>
              <button
                onClick={() => setEmailBody(emailBody + '{{PLATFORM_NAME}}')}
                className="px-3 py-1 bg-[#334155] text-[#00C7D1] text-xs rounded hover:bg-[#475569]"
              >
                + Platform Name
              </button>
            </div>
            <textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              rows={10}
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
              placeholder="Enter email content..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                Schedule
              </label>
              <select
                value={emailSchedule}
                onChange={(e) => setEmailSchedule(e.target.value)}
                className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
              >
                <option value="now">Send Now</option>
                <option value="later">Schedule for Later</option>
              </select>
            </div>

            {emailSchedule === 'later' && (
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Schedule Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={emailScheduleDate}
                  onChange={(e) => setEmailScheduleDate(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSendEmail}
              className="px-6 py-2 bg-[#00C7D1] text-[#0f172a] rounded-lg font-semibold hover:bg-[#00e5f0] transition-colors"
            >
              {emailSchedule === 'now' ? '📧 Send Email' : '⏰ Schedule Email'}
            </button>
            <button
              onClick={handleSendTestEmail}
              className="px-6 py-2 bg-[#10b981] text-white rounded-lg font-medium hover:bg-[#059669] transition-colors"
            >
              ✉️ Send Test Email
            </button>
            <button
              onClick={() => setShowEmailPreview(!showEmailPreview)}
              className="px-6 py-2 bg-[#334155] text-[#f8fafc] rounded-lg font-medium hover:bg-[#475569] transition-colors"
            >
              👁️ Preview
            </button>
          </div>
        </div>
      </div>

      {/* Email Preview Modal */}
      {showEmailPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] rounded-lg border border-[#334155] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#334155]">
              <h3 className="text-xl font-bold text-[#f8fafc]">Email Preview</h3>
            </div>

            <div className="p-6">
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{emailSubject || 'No Subject'}</h2>
                <div className="text-gray-700 whitespace-pre-wrap">{emailBody || 'No content'}</div>
              </div>
            </div>

            <div className="p-6 border-t border-[#334155] flex justify-end">
              <button
                onClick={() => setShowEmailPreview(false)}
                className="px-6 py-2 bg-[#334155] text-[#f8fafc] rounded-lg font-medium hover:bg-[#475569] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email History */}
      <div>
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Email History</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#334155]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[#cbd5e1]">Subject</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#cbd5e1]">Recipients</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#cbd5e1]">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#cbd5e1]">Opened</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#cbd5e1]">Clicked</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[#cbd5e1]">Status</th>
              </tr>
            </thead>
            <tbody>
              {emailHistory.map((email) => (
                <tr key={email.id} className="border-b border-[#334155] hover:bg-[#0f172a]">
                  <td className="py-3 px-4 text-sm text-[#f8fafc]">{email.subject}</td>
                  <td className="py-3 px-4 text-sm text-[#cbd5e1]">{email.recipients.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-[#cbd5e1]">{format(new Date(email.sentDate), 'MMM dd, yyyy')}</td>
                  <td className="py-3 px-4 text-sm text-[#cbd5e1]">
                    {email.opened > 0 && `${email.opened.toLocaleString()} (${Math.round((email.opened / email.recipients) * 100)}%)`}
                  </td>
                  <td className="py-3 px-4 text-sm text-[#cbd5e1]">
                    {email.clicked > 0 && `${email.clicked.toLocaleString()} (${Math.round((email.clicked / email.recipients) * 100)}%)`}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      email.status === 'sent'
                        ? 'bg-[#10b981]/10 text-[#10b981]'
                        : email.status === 'scheduled'
                        ? 'bg-[#f59e0b]/10 text-[#f59e0b]'
                        : 'bg-[#94a3b8]/10 text-[#94a3b8]'
                    }`}>
                      {email.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderBulkSMS = () => (
    <div className="space-y-6">
      {/* SMS Credits */}
      <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#94a3b8]">SMS Credits Balance</p>
            <p className="text-3xl font-bold text-[#00C7D1] mt-1">
              {smsCreditsBalance.toLocaleString()}
            </p>
          </div>
          <div className="text-5xl">📱</div>
        </div>
      </div>

      {/* Recipient Selection */}
      <div>
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Recipient Selection</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <label className="flex items-center p-4 bg-[#0f172a] border border-[#334155] rounded-lg cursor-pointer hover:border-[#00C7D1] transition-colors">
            <input
              type="radio"
              name="sms-recipients"
              value="all"
              checked={smsRecipients === 'all'}
              onChange={(e) => setSmsRecipients(e.target.value)}
              className="w-4 h-4 text-[#00C7D1] focus:ring-[#00C7D1]"
            />
            <div className="ml-3">
              <div className="text-sm font-medium text-[#f8fafc]">All Users</div>
              <div className="text-xs text-[#94a3b8]">4,820 users</div>
            </div>
          </label>

          <label className="flex items-center p-4 bg-[#0f172a] border border-[#334155] rounded-lg cursor-pointer hover:border-[#00C7D1] transition-colors">
            <input
              type="radio"
              name="sms-recipients"
              value="active"
              checked={smsRecipients === 'active'}
              onChange={(e) => setSmsRecipients(e.target.value)}
              className="w-4 h-4 text-[#00C7D1] focus:ring-[#00C7D1]"
            />
            <div className="ml-3">
              <div className="text-sm font-medium text-[#f8fafc]">Active Users</div>
              <div className="text-xs text-[#94a3b8]">3,420 users</div>
            </div>
          </label>

          <label className="flex items-center p-4 bg-[#0f172a] border border-[#334155] rounded-lg cursor-pointer hover:border-[#00C7D1] transition-colors">
            <input
              type="radio"
              name="sms-recipients"
              value="verified"
              checked={smsRecipients === 'verified'}
              onChange={(e) => setSmsRecipients(e.target.value)}
              className="w-4 h-4 text-[#00C7D1] focus:ring-[#00C7D1]"
            />
            <div className="ml-3">
              <div className="text-sm font-medium text-[#f8fafc]">Verified Phone</div>
              <div className="text-xs text-[#94a3b8]">4,280 users</div>
            </div>
          </label>
        </div>
      </div>

      {/* SMS Composer */}
      <div>
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">SMS Composer</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-[#cbd5e1]">
                Message
              </label>
              <span className={`text-sm ${smsMessage.length > 160 ? 'text-[#ef4444]' : 'text-[#94a3b8]'}`}>
                {smsMessage.length} / 160 characters
              </span>
            </div>
            <div className="mb-2 flex flex-wrap gap-2">
              <button
                onClick={() => setSmsMessage(smsMessage + '{{USER_NAME}}')}
                className="px-3 py-1 bg-[#334155] text-[#00C7D1] text-xs rounded hover:bg-[#475569]"
              >
                + User Name
              </button>
              <button
                onClick={() => setSmsMessage(smsMessage + '{{BALANCE}}')}
                className="px-3 py-1 bg-[#334155] text-[#00C7D1] text-xs rounded hover:bg-[#475569]"
              >
                + Balance
              </button>
              <button
                onClick={() => setSmsMessage(smsMessage + '{{PLATFORM_NAME}}')}
                className="px-3 py-1 bg-[#334155] text-[#00C7D1] text-xs rounded hover:bg-[#475569]"
              >
                + Platform Name
              </button>
            </div>
            <textarea
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              rows={5}
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
              placeholder="Enter SMS message (max 160 characters)..."
            />
            {smsMessage.length > 160 && (
              <p className="text-sm text-[#ef4444] mt-1">
                Message exceeds 160 characters. It will be sent as {Math.ceil(smsMessage.length / 160)} messages.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Schedule
            </label>
            <select
              value={smsSchedule}
              onChange={(e) => setSmsSchedule(e.target.value)}
              className="w-full max-w-xs px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
            >
              <option value="now">Send Now</option>
              <option value="later">Schedule for Later</option>
            </select>
          </div>

          <button
            onClick={handleSendSMS}
            className="px-6 py-2 bg-[#00C7D1] text-[#0f172a] rounded-lg font-semibold hover:bg-[#00e5f0] transition-colors"
          >
            📱 Send SMS
          </button>
        </div>
      </div>
    </div>
  );

  const renderAnnouncements = () => (
    <div className="space-y-6">
      {/* Create Announcement */}
      <div>
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Create Announcement</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Title
            </label>
            <input
              type="text"
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
              placeholder="Enter announcement title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Message
            </label>
            <textarea
              value={announcementMessage}
              onChange={(e) => setAnnouncementMessage(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
              placeholder="Enter announcement message..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                Priority
              </label>
              <select
                value={announcementPriority}
                onChange={(e) => setAnnouncementPriority(e.target.value as 'info' | 'warning' | 'urgent')}
                className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
              >
                <option value="info">ℹ️ Info</option>
                <option value="warning">⚠️ Warning</option>
                <option value="urgent">🚨 Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                Display Location
              </label>
              <select
                value={announcementDisplay}
                onChange={(e) => setAnnouncementDisplay(e.target.value)}
                className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
              >
                <option value="banner">Banner (Top of Page)</option>
                <option value="popup">Popup (Modal)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                Target Users
              </label>
              <select
                value={announcementTarget}
                onChange={(e) => setAnnouncementTarget(e.target.value)}
                className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
              >
                <option value="all">All Users</option>
                <option value="active">Active Users</option>
                <option value="inactive">Inactive Users</option>
                <option value="unverified">Unverified Users</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleCreateAnnouncement}
            className="px-6 py-2 bg-[#00C7D1] text-[#0f172a] rounded-lg font-semibold hover:bg-[#00e5f0] transition-colors"
          >
            📢 Create Announcement
          </button>
        </div>
      </div>

      {/* Active Announcements */}
      <div>
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Active Announcements</h3>
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-[#0f172a] border border-[#334155] rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-[#f8fafc]">{announcement.title}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      announcement.priority === 'info'
                        ? 'bg-[#3b82f6]/10 text-[#3b82f6]'
                        : announcement.priority === 'warning'
                        ? 'bg-[#f59e0b]/10 text-[#f59e0b]'
                        : 'bg-[#ef4444]/10 text-[#ef4444]'
                    }`}>
                      {announcement.priority}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      announcement.status === 'active'
                        ? 'bg-[#10b981]/10 text-[#10b981]'
                        : announcement.status === 'scheduled'
                        ? 'bg-[#f59e0b]/10 text-[#f59e0b]'
                        : 'bg-[#94a3b8]/10 text-[#94a3b8]'
                    }`}>
                      {announcement.status}
                    </span>
                  </div>
                  <p className="text-sm text-[#cbd5e1] mb-3">{announcement.message}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-[#94a3b8]">
                    <span>Display: {announcement.displayLocation}</span>
                    <span>Target: {announcement.targetUsers}</span>
                    <span>From: {format(new Date(announcement.startDate), 'MMM dd, yyyy')}</span>
                    <span>To: {format(new Date(announcement.endDate), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button className="px-3 py-1 bg-[#334155] text-[#f8fafc] rounded text-sm hover:bg-[#475569]">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteAnnouncement(announcement.id)}
                    className="px-3 py-1 bg-[#ef4444]/10 text-[#ef4444] rounded text-sm hover:bg-[#ef4444]/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderNews = () => (
    <div className="space-y-6">
      {/* Create News Article */}
      <div>
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Create News Article</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Title
            </label>
            <input
              type="text"
              value={newsTitle}
              onChange={(e) => setNewsTitle(e.target.value)}
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
              placeholder="Enter article title"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                Category
              </label>
              <select
                value={newsCategory}
                onChange={(e) => setNewsCategory(e.target.value)}
                className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
              >
                <option value="platform">Platform Updates</option>
                <option value="education">Education</option>
                <option value="market">Market News</option>
                <option value="announcement">Announcements</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                Featured Image URL
              </label>
              <input
                type="text"
                value={newsFeaturedImage}
                onChange={(e) => setNewsFeaturedImage(e.target.value)}
                className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Content
            </label>
            <textarea
              value={newsContent}
              onChange={(e) => setNewsContent(e.target.value)}
              rows={10}
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
              placeholder="Enter article content..."
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setNewsStatus('published');
                handleCreateNews();
              }}
              className="px-6 py-2 bg-[#00C7D1] text-[#0f172a] rounded-lg font-semibold hover:bg-[#00e5f0] transition-colors"
            >
              📰 Publish Article
            </button>
            <button
              onClick={() => {
                setNewsStatus('draft');
                handleCreateNews();
              }}
              className="px-6 py-2 bg-[#334155] text-[#f8fafc] rounded-lg font-medium hover:bg-[#475569] transition-colors"
            >
              💾 Save as Draft
            </button>
          </div>
        </div>
      </div>

      {/* News Articles List */}
      <div>
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Published Articles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {newsArticles.map((article) => (
            <div
              key={article.id}
              className="bg-[#0f172a] border border-[#334155] rounded-lg overflow-hidden hover:border-[#00C7D1] transition-colors"
            >
              <img
                src={article.featuredImage}
                alt={article.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-[#334155] text-[#00C7D1] text-xs rounded">
                    {article.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    article.status === 'published'
                      ? 'bg-[#10b981]/10 text-[#10b981]'
                      : 'bg-[#94a3b8]/10 text-[#94a3b8]'
                  }`}>
                    {article.status}
                  </span>
                </div>
                <h4 className="font-semibold text-[#f8fafc] mb-2">{article.title}</h4>
                <p className="text-sm text-[#94a3b8] mb-3">
                  {article.content.substring(0, 100)}...
                </p>
                <div className="flex items-center justify-between text-xs text-[#94a3b8]">
                  <span>{format(new Date(article.publishDate), 'MMM dd, yyyy')}</span>
                  <span>👁️ {article.views.toLocaleString()} views</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="flex-1 px-3 py-1 bg-[#334155] text-[#f8fafc] rounded text-sm hover:bg-[#475569]">
                    Edit
                  </button>
                  <button className="flex-1 px-3 py-1 bg-[#ef4444]/10 text-[#ef4444] rounded text-sm hover:bg-[#ef4444]/20">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPushNotifications = () => (
    <div className="space-y-6">
      {/* Create Push Notification */}
      <div>
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Create Push Notification</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Title
            </label>
            <input
              type="text"
              value={pushTitle}
              onChange={(e) => setPushTitle(e.target.value)}
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
              placeholder="Enter notification title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Message
            </label>
            <textarea
              value={pushMessage}
              onChange={(e) => setPushMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
              placeholder="Enter notification message..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                Target Users
              </label>
              <select
                value={pushTargetUsers}
                onChange={(e) => setPushTargetUsers(e.target.value)}
                className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
              >
                <option value="all">All Users</option>
                <option value="active">Active Users</option>
                <option value="inactive">Inactive Users</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                Click Action
              </label>
              <select
                value={pushAction}
                onChange={(e) => setPushAction(e.target.value)}
                className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
              >
                <option value="none">None</option>
                <option value="url">Open URL</option>
                <option value="page">Open Page</option>
              </select>
            </div>
          </div>

          {pushAction !== 'none' && (
            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                {pushAction === 'url' ? 'URL' : 'Page Path'}
              </label>
              <input
                type="text"
                value={pushActionUrl}
                onChange={(e) => setPushActionUrl(e.target.value)}
                className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                placeholder={pushAction === 'url' ? 'https://...' : '/dashboard'}
              />
            </div>
          )}

          <button
            onClick={handleSendPushNotification}
            className="px-6 py-2 bg-[#00C7D1] text-[#0f172a] rounded-lg font-semibold hover:bg-[#00e5f0] transition-colors"
          >
            🔔 Send Push Notification
          </button>
        </div>
      </div>

      {/* Notification History */}
      <div>
        <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Notification History</h3>
        <div className="space-y-3">
          {pushHistory.map((notification) => (
            <div
              key={notification.id}
              className="bg-[#0f172a] border border-[#334155] rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-[#f8fafc] mb-1">{notification.title}</h4>
                  <p className="text-sm text-[#cbd5e1] mb-3">{notification.message}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-[#94a3b8]">
                    <span>Sent to: {notification.targetUsers.toLocaleString()} users</span>
                    <span>Delivered: {notification.delivered.toLocaleString()} ({Math.round((notification.delivered / notification.targetUsers) * 100)}%)</span>
                    <span>Clicked: {notification.clicked.toLocaleString()} ({Math.round((notification.clicked / notification.targetUsers) * 100)}%)</span>
                    <span>Date: {format(new Date(notification.sentDate), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#f8fafc] mb-2">Communication Tools</h1>
          <p className="text-[#94a3b8]">Manage bulk communications and announcements</p>
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
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-6">
          {activeTab === 'email' && renderBulkEmail()}
          {activeTab === 'sms' && renderBulkSMS()}
          {activeTab === 'announcements' && renderAnnouncements()}
          {activeTab === 'news' && renderNews()}
          {activeTab === 'push' && renderPushNotifications()}
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="px-6 py-3 bg-[#334155] text-[#f8fafc] rounded-lg font-medium hover:bg-[#475569] transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunicationsAdmin;
