import React, { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import toast from 'react-hot-toast';
import {
  getAdminLogs,
  getUserActivityLogs,
  getSystemLogs,
  getAuditStats,
} from '../../services/admin-audit.service';

// Types
type AdminActionType =
  | 'login'
  | 'logout'
  | 'user_edit'
  | 'balance_adjustment'
  | 'kyc_approval'
  | 'kyc_rejection'
  | 'withdrawal_approval'
  | 'withdrawal_rejection'
  | 'settings_change'
  | 'package_edit'
  | 'rank_edit'
  | 'commission_adjustment'
  | 'user_delete'
  | 'user_suspend';

type UserActionType =
  | 'login'
  | 'logout'
  | 'register'
  | 'package_purchase'
  | 'withdrawal_request'
  | 'deposit'
  | 'kyc_submission'
  | 'profile_update'
  | 'password_change'
  | 'referral_signup';

type SystemLogType =
  | 'commission_processing'
  | 'scheduled_job'
  | 'error'
  | 'payment_gateway'
  | 'email_sent'
  | 'sms_sent'
  | 'binary_calculation'
  | 'rank_calculation';

type LogLevel = 'info' | 'warning' | 'error' | 'success';

interface AdminLog {
  id: string;
  adminId: string;
  adminName: string;
  action: AdminActionType;
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

interface UserLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: UserActionType;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

interface SystemLog {
  id: string;
  type: SystemLogType;
  level: LogLevel;
  message: string;
  details?: any;
  errorStack?: string;
  processedRecords?: number;
  duration?: number;
  timestamp: Date;
}

const AuditLogs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'admin' | 'user' | 'system'>('admin');
  const [loading, setLoading] = useState(true);

  // Modal state
  const [selectedAdminLog, setSelectedAdminLog] = useState<AdminLog | null>(null);
  const [selectedUserLog, setSelectedUserLog] = useState<UserLog | null>(null);
  const [selectedSystemLog, setSelectedSystemLog] = useState<SystemLog | null>(null);

  // Admin logs state
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [adminActionFilter, setAdminActionFilter] = useState<AdminActionType | 'all'>('all');
  const [adminFilter, setAdminFilter] = useState<string>('all');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminDateFrom, setAdminDateFrom] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [adminDateTo, setAdminDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  // User logs state
  const [userLogs, setUserLogs] = useState<UserLog[]>([]);
  const [userActionFilter, setUserActionFilter] = useState<UserActionType | 'all'>('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userDateFrom, setUserDateFrom] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [userDateTo, setUserDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  // System logs state
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [systemTypeFilter, setSystemTypeFilter] = useState<SystemLogType | 'all'>('all');
  const [systemLevelFilter, setSystemLevelFilter] = useState<LogLevel | 'all'>('all');
  const [systemSearchQuery, setSystemSearchQuery] = useState('');
  const [systemDateFrom, setSystemDateFrom] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [systemDateTo, setSystemDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Pagination
  const [adminPage, setAdminPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [systemPage, setSystemPage] = useState(1);
  const logsPerPage = 20;

  // Load logs from database
  useEffect(() => {
    const loadLogs = async () => {
      try {
        setLoading(true);

        const [adminData, userData, systemData] = await Promise.all([
          getAdminLogs({
            dateFrom: adminDateFrom,
            dateTo: adminDateTo,
          }),
          getUserActivityLogs(undefined, 100),
          getSystemLogs({
            dateFrom: systemDateFrom,
            dateTo: systemDateTo,
          }),
        ]);

        // Format admin logs
        const formattedAdminLogs: AdminLog[] = adminData.map((log: any) => ({
          id: log.id,
          adminId: log.admin_id || 'Unknown',
          adminName: log.admin_name || 'Admin',
          action: log.action_type as AdminActionType,
          resource: log.details?.resource || 'N/A',
          resourceId: log.target_id || undefined,
          details: typeof log.details === 'string' ? log.details : JSON.stringify(log.details),
          ipAddress: log.ip_address || 'N/A',
          userAgent: log.user_agent || 'N/A',
          timestamp: new Date(log.created_at),
        }));

        // Format user logs
        const formattedUserLogs: UserLog[] = userData.map((log: any) => ({
          id: log.id,
          userId: log.user_id,
          userName: log.users?.full_name || 'Unknown',
          userEmail: log.users?.email || 'N/A',
          action: log.transaction_type as UserActionType,
          details: log.description || '',
          ipAddress: 'N/A',
          userAgent: 'N/A',
          timestamp: new Date(log.created_at),
        }));

        // Format system logs
        const formattedSystemLogs: SystemLog[] = systemData.map((log: any) => ({
          id: log.id,
          type: 'commission_processing' as SystemLogType,
          level: log.status === 'completed' ? 'success' : log.status === 'failed' ? 'error' : 'info',
          message: `Commission run: ${log.type}`,
          details: {
            affectedUsers: log.affected_users,
            totalAmount: log.total_amount,
          },
          processedRecords: log.affected_users,
          timestamp: new Date(log.created_at),
        }));

        setAdminLogs(formattedAdminLogs);
        setUserLogs(formattedUserLogs);
        setSystemLogs(formattedSystemLogs);

        toast.success('Audit logs loaded');
      } catch (error) {
        console.error('Error loading logs:', error);
        toast.error('Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, [adminDateFrom, adminDateTo, systemDateFrom, systemDateTo]);

  // Export logs
  const handleExportLogs = (logType: 'admin' | 'user' | 'system') => {
    try {
      let csvContent = '';
      let filename = '';
      const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');

      if (logType === 'admin') {
        filename = `admin-logs-${timestamp}.csv`;
        csvContent = 'ID,Admin Name,Admin ID,Action,Resource,Resource ID,Details,IP Address,User Agent,Timestamp\n';
        filteredAdminLogs.forEach(log => {
          const row = [
            log.id,
            log.adminName,
            log.adminId,
            log.action,
            log.resource,
            log.resourceId || '',
            `"${log.details.replace(/"/g, '""')}"`,
            log.ipAddress,
            `"${log.userAgent.replace(/"/g, '""')}"`,
            format(log.timestamp, 'yyyy-MM-dd HH:mm:ss')
          ].join(',');
          csvContent += row + '\n';
        });
      } else if (logType === 'user') {
        filename = `user-logs-${timestamp}.csv`;
        csvContent = 'ID,User ID,User Name,User Email,Action,Details,IP Address,User Agent,Timestamp\n';
        filteredUserLogs.forEach(log => {
          const row = [
            log.id,
            log.userId,
            log.userName,
            log.userEmail,
            log.action,
            `"${log.details.replace(/"/g, '""')}"`,
            log.ipAddress,
            `"${log.userAgent.replace(/"/g, '""')}"`,
            format(log.timestamp, 'yyyy-MM-dd HH:mm:ss')
          ].join(',');
          csvContent += row + '\n';
        });
      } else if (logType === 'system') {
        filename = `system-logs-${timestamp}.csv`;
        csvContent = 'ID,Type,Level,Message,Details,Error Stack,Processed Records,Duration (ms),Timestamp\n';
        filteredSystemLogs.forEach(log => {
          const row = [
            log.id,
            log.type,
            log.level,
            `"${log.message.replace(/"/g, '""')}"`,
            log.details ? `"${JSON.stringify(log.details).replace(/"/g, '""')}"` : '',
            log.errorStack ? `"${log.errorStack.replace(/"/g, '""')}"` : '',
            log.processedRecords || '',
            log.duration || '',
            format(log.timestamp, 'yyyy-MM-dd HH:mm:ss')
          ].join(',');
          csvContent += row + '\n';
        });
      }

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${logType} logs successfully! (${filename})`, {
        duration: 4000,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export logs');
    }
  };

  // Filter admin logs
  const filteredAdminLogs = adminLogs.filter(log => {
    const matchesAction = adminActionFilter === 'all' || log.action === adminActionFilter;
    const matchesAdmin = adminFilter === 'all' || log.adminId === adminFilter;
    const matchesSearch = adminSearchQuery === '' ||
      log.details.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(adminSearchQuery.toLowerCase());
    const logDate = new Date(log.timestamp);
    const matchesDate = logDate >= new Date(adminDateFrom) && logDate <= new Date(adminDateTo + ' 23:59:59');
    return matchesAction && matchesAdmin && matchesSearch && matchesDate;
  });

  // Filter user logs
  const filteredUserLogs = userLogs.filter(log => {
    const matchesAction = userActionFilter === 'all' || log.action === userActionFilter;
    const matchesSearch = userSearchQuery === '' ||
      log.userName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(userSearchQuery.toLowerCase());
    const logDate = new Date(log.timestamp);
    const matchesDate = logDate >= new Date(userDateFrom) && logDate <= new Date(userDateTo + ' 23:59:59');
    return matchesAction && matchesSearch && matchesDate;
  });

  // Filter system logs
  const filteredSystemLogs = systemLogs.filter(log => {
    const matchesType = systemTypeFilter === 'all' || log.type === systemTypeFilter;
    const matchesLevel = systemLevelFilter === 'all' || log.level === systemLevelFilter;
    const matchesSearch = systemSearchQuery === '' ||
      log.message.toLowerCase().includes(systemSearchQuery.toLowerCase());
    const logDate = new Date(log.timestamp);
    const matchesDate = logDate >= new Date(systemDateFrom) && logDate <= new Date(systemDateTo + ' 23:59:59');
    return matchesType && matchesLevel && matchesSearch && matchesDate;
  });

  // Pagination
  const paginatedAdminLogs = filteredAdminLogs.slice((adminPage - 1) * logsPerPage, adminPage * logsPerPage);
  const paginatedUserLogs = filteredUserLogs.slice((userPage - 1) * logsPerPage, userPage * logsPerPage);
  const paginatedSystemLogs = filteredSystemLogs.slice((systemPage - 1) * logsPerPage, systemPage * logsPerPage);

  const totalAdminPages = Math.ceil(filteredAdminLogs.length / logsPerPage);
  const totalUserPages = Math.ceil(filteredUserLogs.length / logsPerPage);
  const totalSystemPages = Math.ceil(filteredSystemLogs.length / logsPerPage);

  // Render action badge
  const renderActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      login: 'bg-[#10b981]/10 text-[#10b981]',
      logout: 'bg-[#94a3b8]/10 text-[#94a3b8]',
      user_edit: 'bg-[#3b82f6]/10 text-[#3b82f6]',
      balance_adjustment: 'bg-[#f59e0b]/10 text-[#f59e0b]',
      kyc_approval: 'bg-[#10b981]/10 text-[#10b981]',
      kyc_rejection: 'bg-[#ef4444]/10 text-[#ef4444]',
      withdrawal_approval: 'bg-[#10b981]/10 text-[#10b981]',
      withdrawal_rejection: 'bg-[#ef4444]/10 text-[#ef4444]',
      settings_change: 'bg-[#8b5cf6]/10 text-[#8b5cf6]',
      package_edit: 'bg-[#3b82f6]/10 text-[#3b82f6]',
      user_suspend: 'bg-[#ef4444]/10 text-[#ef4444]',
      package_purchase: 'bg-[#10b981]/10 text-[#10b981]',
      withdrawal_request: 'bg-[#f59e0b]/10 text-[#f59e0b]',
      deposit: 'bg-[#10b981]/10 text-[#10b981]',
      kyc_submission: 'bg-[#3b82f6]/10 text-[#3b82f6]',
      register: 'bg-[#10b981]/10 text-[#10b981]',
    };

    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[action] || 'bg-[#94a3b8]/10 text-[#94a3b8]'}`}>
        {action.replace(/_/g, ' ')}
      </span>
    );
  };

  // Render level badge
  const renderLevelBadge = (level: LogLevel) => {
    const colors = {
      info: 'bg-[#3b82f6]/10 text-[#3b82f6]',
      warning: 'bg-[#f59e0b]/10 text-[#f59e0b]',
      error: 'bg-[#ef4444]/10 text-[#ef4444]',
      success: 'bg-[#10b981]/10 text-[#10b981]',
    };

    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[level]}`}>
        {level}
      </span>
    );
  };

  // Render Admin Logs
  const renderAdminLogs = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <select
            value={adminActionFilter}
            onChange={(e) => setAdminActionFilter(e.target.value as any)}
            className="px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
          >
            <option value="all">All Actions</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="user_edit">User Edit</option>
            <option value="user_delete">User Delete</option>
            <option value="user_suspend">User Suspend</option>
            <option value="balance_adjustment">Balance Adjustment</option>
            <option value="kyc_approval">KYC Approval</option>
            <option value="kyc_rejection">KYC Rejection</option>
            <option value="withdrawal_approval">Withdrawal Approval</option>
            <option value="withdrawal_rejection">Withdrawal Rejection</option>
            <option value="settings_change">Settings Change</option>
            <option value="package_edit">Package Edit</option>
            <option value="rank_edit">Rank Edit</option>
            <option value="commission_adjustment">Commission Adjustment</option>
          </select>

          <select
            value={adminFilter}
            onChange={(e) => setAdminFilter(e.target.value)}
            className="px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
          >
            <option value="all">All Admins</option>
            <option value="A001">Admin Sarah</option>
            <option value="A002">Admin Mike</option>
          </select>

          <input
            type="date"
            value={adminDateFrom}
            onChange={(e) => setAdminDateFrom(e.target.value)}
            className="px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
          />

          <input
            type="date"
            value={adminDateTo}
            onChange={(e) => setAdminDateTo(e.target.value)}
            className="px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
          />
        </div>

        <div className="flex gap-4">
          <input
            type="text"
            value={adminSearchQuery}
            onChange={(e) => setAdminSearchQuery(e.target.value)}
            placeholder="Search logs..."
            className="flex-1 px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
          />
          <button
            onClick={() => handleExportLogs('admin')}
            className="px-4 py-2 bg-[#00C7D1] text-[#000] rounded-lg font-medium hover:bg-[#00e5f0] transition-colors"
          >
            📥 Export Logs
          </button>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#94a3b8]">
          Showing {paginatedAdminLogs.length} of {filteredAdminLogs.length} logs
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAdminPage(Math.max(1, adminPage - 1))}
            disabled={adminPage === 1}
            className="px-3 py-1 bg-[#334155] text-[#f8fafc] rounded hover:bg-[#475569] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-[#94a3b8]">
            Page {adminPage} of {totalAdminPages}
          </span>
          <button
            onClick={() => setAdminPage(Math.min(totalAdminPages, adminPage + 1))}
            disabled={adminPage === totalAdminPages}
            className="px-3 py-1 bg-[#334155] text-[#f8fafc] rounded hover:bg-[#475569] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0f172a] border-b border-[#334155]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#94a3b8]">Admin</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#94a3b8]">Action</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#94a3b8]">Resource</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#94a3b8]">Details</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#94a3b8]">IP Address</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#94a3b8]">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]">
              {paginatedAdminLogs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedAdminLog(log)}
                  className="hover:bg-[#0f172a] transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm text-[#f8fafc]">{log.adminName}</td>
                  <td className="px-4 py-3">{renderActionBadge(log.action)}</td>
                  <td className="px-4 py-3 text-sm text-[#cbd5e1]">
                    {log.resource}
                    {log.resourceId && (
                      <span className="ml-1 text-xs text-[#94a3b8]">({log.resourceId})</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#cbd5e1] max-w-md truncate">
                    {log.details}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#94a3b8] font-mono">{log.ipAddress}</td>
                  <td className="px-4 py-3 text-sm text-[#94a3b8]">
                    {format(log.timestamp, 'MMM dd, yyyy HH:mm:ss')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Render User Logs
  const renderUserLogs = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <select
            value={userActionFilter}
            onChange={(e) => setUserActionFilter(e.target.value as any)}
            className="px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
          >
            <option value="all">All Actions</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="register">Register</option>
            <option value="package_purchase">Package Purchase</option>
            <option value="withdrawal_request">Withdrawal Request</option>
            <option value="deposit">Deposit</option>
            <option value="kyc_submission">KYC Submission</option>
            <option value="profile_update">Profile Update</option>
            <option value="password_change">Password Change</option>
            <option value="referral_signup">Referral Signup</option>
          </select>

          <input
            type="date"
            value={userDateFrom}
            onChange={(e) => setUserDateFrom(e.target.value)}
            className="px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
          />

          <input
            type="date"
            value={userDateTo}
            onChange={(e) => setUserDateTo(e.target.value)}
            className="px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
          />
        </div>

        <div className="flex gap-4">
          <input
            type="text"
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            placeholder="Search by user name, email, or details..."
            className="flex-1 px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
          />
          <button
            onClick={() => handleExportLogs('user')}
            className="px-4 py-2 bg-[#00C7D1] text-[#000] rounded-lg font-medium hover:bg-[#00e5f0] transition-colors"
          >
            📥 Export Logs
          </button>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#94a3b8]">
          Showing {paginatedUserLogs.length} of {filteredUserLogs.length} logs
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUserPage(Math.max(1, userPage - 1))}
            disabled={userPage === 1}
            className="px-3 py-1 bg-[#334155] text-[#f8fafc] rounded hover:bg-[#475569] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-[#94a3b8]">
            Page {userPage} of {totalUserPages}
          </span>
          <button
            onClick={() => setUserPage(Math.min(totalUserPages, userPage + 1))}
            disabled={userPage === totalUserPages}
            className="px-3 py-1 bg-[#334155] text-[#f8fafc] rounded hover:bg-[#475569] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0f172a] border-b border-[#334155]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#94a3b8]">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#94a3b8]">Action</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#94a3b8]">Details</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#94a3b8]">IP Address</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-[#94a3b8]">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]">
              {paginatedUserLogs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedUserLog(log)}
                  className="hover:bg-[#0f172a] transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-[#f8fafc]">{log.userName}</p>
                      <p className="text-xs text-[#94a3b8]">{log.userEmail}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">{renderActionBadge(log.action)}</td>
                  <td className="px-4 py-3 text-sm text-[#cbd5e1] max-w-md truncate">
                    {log.details}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#94a3b8] font-mono">{log.ipAddress}</td>
                  <td className="px-4 py-3 text-sm text-[#94a3b8]">
                    {format(log.timestamp, 'MMM dd, yyyy HH:mm:ss')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Render System Logs
  const renderSystemLogs = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <select
            value={systemTypeFilter}
            onChange={(e) => setSystemTypeFilter(e.target.value as any)}
            className="px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
          >
            <option value="all">All Types</option>
            <option value="commission_processing">Commission Processing</option>
            <option value="scheduled_job">Scheduled Job</option>
            <option value="error">Error</option>
            <option value="payment_gateway">Payment Gateway</option>
            <option value="email_sent">Email Sent</option>
            <option value="sms_sent">SMS Sent</option>
            <option value="binary_calculation">Binary Calculation</option>
            <option value="rank_calculation">Rank Calculation</option>
          </select>

          <select
            value={systemLevelFilter}
            onChange={(e) => setSystemLevelFilter(e.target.value as any)}
            className="px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>

          <input
            type="date"
            value={systemDateFrom}
            onChange={(e) => setSystemDateFrom(e.target.value)}
            className="px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
          />

          <input
            type="date"
            value={systemDateTo}
            onChange={(e) => setSystemDateTo(e.target.value)}
            className="px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
          />
        </div>

        <div className="flex gap-4">
          <input
            type="text"
            value={systemSearchQuery}
            onChange={(e) => setSystemSearchQuery(e.target.value)}
            placeholder="Search logs..."
            className="flex-1 px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
          />
          <button
            onClick={() => handleExportLogs('system')}
            className="px-4 py-2 bg-[#00C7D1] text-[#000] rounded-lg font-medium hover:bg-[#00e5f0] transition-colors"
          >
            📥 Export Logs
          </button>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#94a3b8]">
          Showing {paginatedSystemLogs.length} of {filteredSystemLogs.length} logs
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSystemPage(Math.max(1, systemPage - 1))}
            disabled={systemPage === 1}
            className="px-3 py-1 bg-[#334155] text-[#f8fafc] rounded hover:bg-[#475569] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-[#94a3b8]">
            Page {systemPage} of {totalSystemPages}
          </span>
          <button
            onClick={() => setSystemPage(Math.min(totalSystemPages, systemPage + 1))}
            disabled={systemPage === totalSystemPages}
            className="px-3 py-1 bg-[#334155] text-[#f8fafc] rounded hover:bg-[#475569] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-2">
        {paginatedSystemLogs.map((log) => (
          <div
            key={log.id}
            onClick={() => setSelectedSystemLog(log)}
            className="bg-[#1e293b] border border-[#334155] rounded-lg p-4 hover:border-[#00C7D1] transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {renderLevelBadge(log.level)}
                <span className="px-2 py-0.5 bg-[#334155] text-[#00C7D1] text-xs rounded font-medium">
                  {log.type.replace(/_/g, ' ')}
                </span>
              </div>
              <span className="text-sm text-[#94a3b8]">
                {format(log.timestamp, 'MMM dd, yyyy HH:mm:ss')}
              </span>
            </div>

            <p className="text-sm text-[#f8fafc] mb-2">{log.message}</p>

            {log.details && (
              <div className="bg-[#0f172a] border border-[#334155] rounded p-3 mb-2">
                <p className="text-xs font-medium text-[#94a3b8] mb-1">Details:</p>
                <pre className="text-xs text-[#cbd5e1] overflow-x-auto">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              </div>
            )}

            {log.errorStack && (
              <details className="bg-[#ef4444]/10 border border-[#ef4444] rounded p-3">
                <summary className="text-xs font-medium text-[#ef4444] cursor-pointer">
                  Error Stack Trace
                </summary>
                <pre className="text-xs text-[#cbd5e1] mt-2 overflow-x-auto">
                  {log.errorStack}
                </pre>
              </details>
            )}

            {(log.processedRecords || log.duration) && (
              <div className="flex items-center gap-4 mt-2 text-xs text-[#94a3b8]">
                {log.processedRecords && (
                  <span>📊 Processed: {log.processedRecords.toLocaleString()} records</span>
                )}
                {log.duration && (
                  <span>⏱️ Duration: {(log.duration / 1000).toFixed(2)}s</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#f8fafc] mb-2">Audit Logs</h1>
          <p className="text-[#94a3b8]">Comprehensive logging and tracking for compliance and security</p>
        </div>

        {/* Log Retention Info */}
        <div className="mb-6 bg-[#3b82f6]/10 border border-[#3b82f6] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <h3 className="font-semibold text-[#f8fafc] mb-1">Log Retention Policy</h3>
              <p className="text-sm text-[#cbd5e1]">
                Logs are retained for 90 days. Admin activity logs are kept for 365 days for compliance purposes.
                Critical security events are archived indefinitely.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-[#94a3b8]">Admin Actions (24h)</h3>
              <span className="text-2xl">👤</span>
            </div>
            <p className="text-3xl font-bold text-[#f8fafc]">{adminLogs.length}</p>
            <p className="text-xs text-[#00C7D1] mt-1">6 unique admins</p>
          </div>

          <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-[#94a3b8]">User Activities (24h)</h3>
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-3xl font-bold text-[#f8fafc]">{userLogs.length}</p>
            <p className="text-xs text-[#10b981] mt-1">+12% from yesterday</p>
          </div>

          <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-[#94a3b8]">System Events (24h)</h3>
              <span className="text-2xl">⚙️</span>
            </div>
            <p className="text-3xl font-bold text-[#f8fafc]">{systemLogs.length}</p>
            <p className="text-xs text-[#ef4444] mt-1">
              {systemLogs.filter(l => l.level === 'error').length} errors
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[#334155]">
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'admin'
                ? 'text-[#00C7D1] border-[#00C7D1]'
                : 'text-[#94a3b8] border-transparent hover:text-[#f8fafc]'
            }`}
          >
            👤 Admin Activity ({filteredAdminLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('user')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'user'
                ? 'text-[#00C7D1] border-[#00C7D1]'
                : 'text-[#94a3b8] border-transparent hover:text-[#f8fafc]'
            }`}
          >
            👥 User Activity ({filteredUserLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'system'
                ? 'text-[#00C7D1] border-[#00C7D1]'
                : 'text-[#94a3b8] border-transparent hover:text-[#f8fafc]'
            }`}
          >
            ⚙️ System Logs ({filteredSystemLogs.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'admin' && renderAdminLogs()}
        {activeTab === 'user' && renderUserLogs()}
        {activeTab === 'system' && renderSystemLogs()}

        {/* Admin Log Details Modal */}
        {selectedAdminLog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1e293b] rounded-lg border border-[#334155] w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-[#334155] flex items-center justify-between sticky top-0 bg-[#1e293b]">
                <h3 className="text-xl font-bold text-[#f8fafc]">Admin Log Details</h3>
                <button
                  onClick={() => setSelectedAdminLog(null)}
                  className="text-[#94a3b8] hover:text-[#f8fafc] text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#94a3b8] mb-1">Log ID</p>
                    <p className="text-sm font-medium text-[#f8fafc]">{selectedAdminLog.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#94a3b8] mb-1">Timestamp</p>
                    <p className="text-sm font-medium text-[#f8fafc]">
                      {format(selectedAdminLog.timestamp, 'MMM dd, yyyy HH:mm:ss')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#94a3b8] mb-1">Admin</p>
                    <p className="text-sm font-medium text-[#f8fafc]">
                      {selectedAdminLog.adminName} ({selectedAdminLog.adminId})
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#94a3b8] mb-1">Action</p>
                    <div>{renderActionBadge(selectedAdminLog.action)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-[#94a3b8] mb-1">Resource</p>
                    <p className="text-sm font-medium text-[#f8fafc]">
                      {selectedAdminLog.resource}
                      {selectedAdminLog.resourceId && (
                        <span className="ml-1 text-xs text-[#94a3b8]">
                          ({selectedAdminLog.resourceId})
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#94a3b8] mb-1">IP Address</p>
                    <p className="text-sm font-medium text-[#f8fafc] font-mono">
                      {selectedAdminLog.ipAddress}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-[#94a3b8] mb-1">Details</p>
                  <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-4">
                    <p className="text-sm text-[#cbd5e1]">{selectedAdminLog.details}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-[#94a3b8] mb-1">User Agent</p>
                  <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-4">
                    <p className="text-xs text-[#cbd5e1] font-mono break-all">
                      {selectedAdminLog.userAgent}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-[#334155] flex justify-end">
                <button
                  onClick={() => setSelectedAdminLog(null)}
                  className="px-4 py-2 bg-[#334155] text-[#f8fafc] rounded-lg hover:bg-[#475569]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Log Details Modal */}
        {selectedUserLog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1e293b] rounded-lg border border-[#334155] w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-[#334155] flex items-center justify-between sticky top-0 bg-[#1e293b]">
                <h3 className="text-xl font-bold text-[#f8fafc]">User Log Details</h3>
                <button
                  onClick={() => setSelectedUserLog(null)}
                  className="text-[#94a3b8] hover:text-[#f8fafc] text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#94a3b8] mb-1">Log ID</p>
                    <p className="text-sm font-medium text-[#f8fafc]">{selectedUserLog.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#94a3b8] mb-1">Timestamp</p>
                    <p className="text-sm font-medium text-[#f8fafc]">
                      {format(selectedUserLog.timestamp, 'MMM dd, yyyy HH:mm:ss')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#94a3b8] mb-1">User Name</p>
                    <p className="text-sm font-medium text-[#f8fafc]">{selectedUserLog.userName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#94a3b8] mb-1">User ID</p>
                    <p className="text-sm font-medium text-[#f8fafc]">{selectedUserLog.userId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#94a3b8] mb-1">Email</p>
                    <p className="text-sm font-medium text-[#f8fafc]">{selectedUserLog.userEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#94a3b8] mb-1">Action</p>
                    <div>{renderActionBadge(selectedUserLog.action)}</div>
                  </div>
                  <div>
                    <p className="text-xs text-[#94a3b8] mb-1">IP Address</p>
                    <p className="text-sm font-medium text-[#f8fafc] font-mono">
                      {selectedUserLog.ipAddress}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-[#94a3b8] mb-1">Details</p>
                  <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-4">
                    <p className="text-sm text-[#cbd5e1]">{selectedUserLog.details}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-[#94a3b8] mb-1">User Agent</p>
                  <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-4">
                    <p className="text-xs text-[#cbd5e1] font-mono break-all">
                      {selectedUserLog.userAgent}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-[#334155] flex justify-end">
                <button
                  onClick={() => setSelectedUserLog(null)}
                  className="px-4 py-2 bg-[#334155] text-[#f8fafc] rounded-lg hover:bg-[#475569]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* System Log Details Modal */}
        {selectedSystemLog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1e293b] rounded-lg border border-[#334155] w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-[#334155] flex items-center justify-between sticky top-0 bg-[#1e293b]">
                <h3 className="text-xl font-bold text-[#f8fafc]">System Log Details</h3>
                <button
                  onClick={() => setSelectedSystemLog(null)}
                  className="text-[#94a3b8] hover:text-[#f8fafc] text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#94a3b8] mb-1">Log ID</p>
                    <p className="text-sm font-medium text-[#f8fafc]">{selectedSystemLog.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#94a3b8] mb-1">Timestamp</p>
                    <p className="text-sm font-medium text-[#f8fafc]">
                      {format(selectedSystemLog.timestamp, 'MMM dd, yyyy HH:mm:ss')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#94a3b8] mb-1">Type</p>
                    <span className="px-2 py-0.5 bg-[#334155] text-[#00C7D1] text-xs rounded font-medium">
                      {selectedSystemLog.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-[#94a3b8] mb-1">Level</p>
                    <div>{renderLevelBadge(selectedSystemLog.level)}</div>
                  </div>
                  {selectedSystemLog.processedRecords && (
                    <div>
                      <p className="text-xs text-[#94a3b8] mb-1">Processed Records</p>
                      <p className="text-sm font-medium text-[#f8fafc]">
                        {selectedSystemLog.processedRecords.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {selectedSystemLog.duration && (
                    <div>
                      <p className="text-xs text-[#94a3b8] mb-1">Duration</p>
                      <p className="text-sm font-medium text-[#f8fafc]">
                        {(selectedSystemLog.duration / 1000).toFixed(2)}s
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs text-[#94a3b8] mb-1">Message</p>
                  <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-4">
                    <p className="text-sm text-[#cbd5e1]">{selectedSystemLog.message}</p>
                  </div>
                </div>

                {selectedSystemLog.details && (
                  <div>
                    <p className="text-xs text-[#94a3b8] mb-1">Details</p>
                    <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-4">
                      <pre className="text-xs text-[#cbd5e1] overflow-x-auto">
                        {JSON.stringify(selectedSystemLog.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {selectedSystemLog.errorStack && (
                  <div>
                    <p className="text-xs text-[#94a3b8] mb-1">Error Stack Trace</p>
                    <div className="bg-[#ef4444]/10 border border-[#ef4444] rounded-lg p-4">
                      <pre className="text-xs text-[#cbd5e1] overflow-x-auto">
                        {selectedSystemLog.errorStack}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-[#334155] flex justify-end">
                <button
                  onClick={() => setSelectedSystemLog(null)}
                  className="px-4 py-2 bg-[#334155] text-[#f8fafc] rounded-lg hover:bg-[#475569]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
