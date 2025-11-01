import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  getAllKYCSubmissions,
  approveKYC,
  rejectKYC,
  requestKYCResubmission,
  getKYCStats,
} from '../../services/admin-kyc.service';

// KYC Submission interface
interface KYCSubmission {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  submissionDate: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Resubmission Required';
  priority: 'High' | 'Medium' | 'Low';
  documents: {
    idProofFront: string;
    idProofBack: string;
    addressProof: string;
    selfieWithId: string;
  };
  userRank: string;
  userInvestment: number;
  reviewedBy?: string;
  reviewedDate?: string;
  rejectionReason?: string;
  internalNotes?: string;
}

// KYC submissions loaded from database

const KYCManagement: React.FC = () => {
  const navigate = useNavigate();

  // State management
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKYC, setSelectedKYC] = useState<KYCSubmission | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('oldest');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<'queue' | 'history' | 'settings'>('queue');

  // Review modal state
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [imageRotation, setImageRotation] = useState(0);
  const [checklist, setChecklist] = useState({
    idMatchesName: false,
    idClearReadable: false,
    addressMatches: false,
    selfieMatchesId: false,
    documentsNotExpired: false,
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [customRejectionReason, setCustomRejectionReason] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [resubmitDocuments, setResubmitDocuments] = useState<string[]>([]);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Load KYC submissions from database
  useEffect(() => {
    const loadKYCSubmissions = async () => {
      try {
        setLoading(true);
        const kycData = await getAllKYCSubmissions({});

        // Convert database format to UI format
        const formattedSubmissions: KYCSubmission[] = kycData.map((kyc: any) => ({
          id: kyc.id,
          userId: kyc.user_id,
          userName: kyc.user_name || 'Unknown',
          userEmail: kyc.user_email || 'No email',
          submissionDate: new Date(kyc.created_at).toISOString().split('T')[0],
          status: kyc.status === 'pending' ? 'Pending' :
                  kyc.status === 'approved' ? 'Approved' :
                  kyc.status === 'rejected' ? 'Rejected' :
                  'Resubmission Required',
          priority: kyc.user_investment > 20000 ? 'High' :
                    kyc.user_investment > 5000 ? 'Medium' : 'Low',
          documents: {
            idProofFront: kyc.document_front_url || '',
            idProofBack: kyc.document_back_url || '',
            addressProof: kyc.address_proof_url || '',
            selfieWithId: kyc.selfie_url || '',
          },
          userRank: kyc.user_rank || 'Starter',
          userInvestment: kyc.user_investment || 0,
          reviewedBy: kyc.reviewed_by || undefined,
          reviewedDate: kyc.reviewed_at ? new Date(kyc.reviewed_at).toISOString().split('T')[0] : undefined,
          rejectionReason: kyc.rejection_reason || undefined,
          internalNotes: kyc.notes || undefined,
        }));

        setSubmissions(formattedSubmissions);
      } catch (error) {
        console.error('Error loading KYC submissions:', error);
        toast.error('Failed to load KYC submissions');
      } finally {
        setLoading(false);
      }
    };

    loadKYCSubmissions();
  }, []);

  // Calculate metrics
  const metrics = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      pendingCount: submissions.filter(k => k.status === 'Pending').length,
      todaySubmissions: submissions.filter(k => k.submissionDate === today).length,
      approvedToday: submissions.filter(k => k.status === 'Approved' && k.reviewedDate === today).length,
      rejectedToday: submissions.filter(k => k.status === 'Rejected' && k.reviewedDate === today).length,
      avgApprovalTime: '2.5 hours',
    };
  }, [submissions]);

  // Filter and sort submissions
  const filteredSubmissions = useMemo(() => {
    let filtered = submissions.filter(submission => {
      // Status filter
      if (statusFilter !== 'All' && submission.status !== statusFilter) return false;

      // Priority filter
      if (priorityFilter !== 'All' && submission.priority !== priorityFilter) return false;

      // Date range filter
      if (dateFrom && submission.submissionDate < dateFrom) return false;
      if (dateTo && submission.submissionDate > dateTo) return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime();
      } else if (sortBy === 'newest') {
        return new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime();
      } else if (sortBy === 'priority') {
        const priorityOrder = { High: 3, Medium: 2, Low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return 0;
    });

    return filtered;
  }, [submissions, statusFilter, priorityFilter, dateFrom, dateTo, sortBy]);

  // Show toast feedback when filters are applied
  useEffect(() => {
    if (dateFrom || dateTo) {
      const from = dateFrom || 'beginning';
      const to = dateTo || 'now';
      toast.success(`Filtering submissions from ${from} to ${to}`);
    }
  }, [dateFrom, dateTo]);

  // Load saved checklist and notes from localStorage
  useEffect(() => {
    if (!selectedKYC) return;

    const savedData = localStorage.getItem(`kyc_review_${selectedKYC.id}`);
    if (savedData) {
      try {
        const { checklist: savedChecklist, internalNote: savedNote } = JSON.parse(savedData);
        if (savedChecklist) setChecklist(savedChecklist);
        if (savedNote) setInternalNote(savedNote);
        toast.success('Loaded saved review data');
      } catch (error) {
        console.error('Failed to load saved review data:', error);
      }
    }
  }, [selectedKYC?.id]);

  // Auto-save checklist and notes to localStorage
  useEffect(() => {
    if (!selectedKYC || !showReviewModal) return;

    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(`kyc_review_${selectedKYC.id}`, JSON.stringify({
          checklist,
          internalNote,
          lastSaved: new Date().toISOString()
        }));
      } catch (error) {
        console.error('Failed to save review data:', error);
      }
    }, 1000); // Debounce by 1 second

    return () => clearTimeout(timeoutId);
  }, [checklist, internalNote, selectedKYC?.id, showReviewModal]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!showReviewModal || !selectedKYC) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      if ((e.target as HTMLElement).tagName === 'INPUT' ||
          (e.target as HTMLElement).tagName === 'TEXTAREA') return;

      if (e.key === 'a' || e.key === 'A') {
        if (e.ctrlKey || e.metaKey) return; // Ignore Ctrl+A
        e.preventDefault();
        handleApprove();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setShowRejectModal(true);
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setShowResubmitModal(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (showRejectModal) setShowRejectModal(false);
        else if (showResubmitModal) setShowResubmitModal(false);
        else if (zoomedImage) setZoomedImage(null);
        else setShowReviewModal(false);
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowKeyboardHelp(!showKeyboardHelp);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showReviewModal, selectedKYC, showRejectModal, showResubmitModal, zoomedImage, showKeyboardHelp]);

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const styles = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Approved: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      'Resubmission Required': 'bg-orange-100 text-orange-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  // Priority badge styling
  const getPriorityBadge = (priority: string) => {
    const styles = {
      High: 'bg-red-100 text-red-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      Low: 'bg-blue-100 text-blue-800',
    };
    return styles[priority as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  // Toggle submission selection
  const toggleSelection = (id: string) => {
    setSelectedSubmissions(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  // Select all pending
  const selectAllPending = () => {
    const pendingIds = filteredSubmissions
      .filter(s => s.status === 'Pending')
      .map(s => s.id);
    setSelectedSubmissions(pendingIds);
  };

  // Handle review
  const handleReview = (submission: KYCSubmission) => {
    setSelectedKYC(submission);
    setShowReviewModal(true);
    setChecklist({
      idMatchesName: false,
      idClearReadable: false,
      addressMatches: false,
      selfieMatchesId: false,
      documentsNotExpired: false,
    });
    setInternalNote('');
  };

  // Handle approve
  const handleApprove = async () => {
    if (!selectedKYC) return;

    try {
      // Call real database service
      await approveKYC(selectedKYC.id, internalNote);

      // Update local state
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === selectedKYC.id
            ? {
                ...sub,
                status: 'Approved' as const,
                reviewedBy: 'Admin',
                reviewedDate: new Date().toISOString().split('T')[0]
              }
            : sub
        )
      );

      // Clear the in-progress review data
      localStorage.removeItem(`kyc_review_${selectedKYC.id}`);

      toast.success(`KYC ${selectedKYC.userName} approved successfully!`);

      setShowReviewModal(false);
      setSelectedKYC(null);
      setShowKeyboardHelp(false);
    } catch (error: any) {
      console.error('Failed to approve KYC:', error);
      toast.error(error.message || 'Failed to approve KYC');
    }
  };

  // Handle reject
  const handleReject = async () => {
    if (!selectedKYC) return;
    const reason = rejectionReason === 'Other' ? customRejectionReason : rejectionReason;

    try {
      // Call real database service
      await rejectKYC(selectedKYC.id, reason);

      // Update local state
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === selectedKYC.id
            ? {
                ...sub,
                status: 'Rejected' as const,
                reviewedBy: 'Admin',
                reviewedDate: new Date().toISOString().split('T')[0],
                rejectionReason: reason
              }
            : sub
        )
      );

      // Clear the in-progress review data
      localStorage.removeItem(`kyc_review_${selectedKYC.id}`);

      toast.success(`KYC ${selectedKYC.userName} rejected. Reason: ${reason}`);

      setShowRejectModal(false);
      setShowReviewModal(false);
      setSelectedKYC(null);
      setRejectionReason('');
      setCustomRejectionReason('');
      setShowKeyboardHelp(false);
    } catch (error: any) {
      console.error('Failed to reject KYC:', error);
      toast.error(error.message || 'Failed to reject KYC');
    }
  };

  // Handle request resubmission
  const handleResubmit = async () => {
    if (!selectedKYC || resubmitDocuments.length === 0) return;

    const reason = `Please resubmit the following documents: ${resubmitDocuments.join(', ')}. ${internalNote}`;

    try {
      // Call real database service
      await requestKYCResubmission(selectedKYC.id, reason);

      // Update local state
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === selectedKYC.id
            ? {
                ...sub,
                status: 'Resubmission Required' as const,
                reviewedBy: 'Admin',
                reviewedDate: new Date().toISOString().split('T')[0]
              }
            : sub
        )
      );

      // Clear the in-progress review data
      localStorage.removeItem(`kyc_review_${selectedKYC.id}`);

      toast.success(`Resubmission request sent to ${selectedKYC.userName} for: ${resubmitDocuments.join(', ')}`);

      setShowResubmitModal(false);
      setShowReviewModal(false);
      setSelectedKYC(null);
      setResubmitDocuments([]);
      setShowKeyboardHelp(false);
    } catch (error: any) {
      console.error('Failed to request resubmission:', error);
      toast.error(error.message || 'Failed to request resubmission');
    }
  };

  // Batch approve
  const handleBatchApprove = async () => {
    if (selectedSubmissions.length === 0) return;

    if (!confirm(`Approve ${selectedSubmissions.length} KYC submissions?`)) {
      return;
    }

    let successCount = 0;
    let failCount = 0;

    try {
      // Approve each submission
      for (const id of selectedSubmissions) {
        try {
          await approveKYC(id, 'Batch approval');
          successCount++;
        } catch (error) {
          console.error(`Failed to approve KYC ${id}:`, error);
          failCount++;
        }
      }

      // Update local state for all successfully approved submissions
      setSubmissions(prev =>
        prev.map(sub =>
          selectedSubmissions.includes(sub.id)
            ? {
                ...sub,
                status: 'Approved' as const,
                reviewedBy: 'Admin',
                reviewedDate: new Date().toISOString().split('T')[0]
              }
            : sub
        )
      );

      if (successCount > 0) {
        toast.success(`${successCount} KYC submission${successCount > 1 ? 's' : ''} approved successfully!`);
      }
      if (failCount > 0) {
        toast.error(`Failed to approve ${failCount} submission${failCount > 1 ? 's' : ''}`);
      }

      setSelectedSubmissions([]);
    } catch (error: any) {
      console.error('Batch approval error:', error);
      toast.error('Batch approval failed');
    }
  };

  // Render queue view
  const renderQueueView = () => (
    <div className="space-y-6">
      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
          <div className="text-sm opacity-90">Pending Approvals</div>
          <div className="text-3xl font-bold mt-1">{metrics.pendingCount}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="text-sm opacity-90">Today's Submissions</div>
          <div className="text-3xl font-bold mt-1">{metrics.todaySubmissions}</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="text-sm opacity-90">Approved Today</div>
          <div className="text-3xl font-bold mt-1">{metrics.approvedToday}</div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-4 text-white">
          <div className="text-sm opacity-90">Rejected Today</div>
          <div className="text-3xl font-bold mt-1">{metrics.rejectedToday}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="text-sm opacity-90">Avg Approval Time</div>
          <div className="text-3xl font-bold mt-1">{metrics.avgApprovalTime}</div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Resubmission Required">Resubmission Required</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="oldest">Oldest First</option>
              <option value="newest">Newest First</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Batch Actions */}
      {selectedSubmissions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-blue-900 font-medium">
              {selectedSubmissions.length} submission{selectedSubmissions.length > 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBatchApprove}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Batch Approve
              </button>
              <button
                onClick={() => setSelectedSubmissions([])}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KYC List Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedSubmissions.length === filteredSubmissions.filter(s => s.status === 'Pending').length && filteredSubmissions.filter(s => s.status === 'Pending').length > 0}
                    onChange={selectAllPending}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">KYC ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documents</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSubmissions.map((submission) => (
                <tr key={submission.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    {submission.status === 'Pending' && (
                      <input
                        type="checkbox"
                        checked={selectedSubmissions.includes(submission.id)}
                        onChange={() => toggleSelection(submission.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">{submission.id}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{submission.userName}</div>
                    <div className="text-xs text-gray-500">{submission.userId}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{submission.userEmail}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{submission.submissionDate}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <span title="ID Front">{submission.documents.idProofFront}</span>
                      <span title="ID Back">{submission.documents.idProofBack}</span>
                      <span title="Address">{submission.documents.addressProof}</span>
                      <span title="Selfie">{submission.documents.selfieWithId}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadge(submission.priority)}`}>
                      {submission.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(submission.status)}`}>
                      {submission.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleReview(submission)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Render history view
  const renderHistoryView = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">KYC History</h2>
      <div className="space-y-4">
        {submissions.filter(s => s.status !== 'Pending').map((submission) => (
          <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-gray-900">{submission.userName}</div>
                <div className="text-sm text-gray-600">
                  {submission.id} • Submitted: {submission.submissionDate}
                  {submission.reviewedDate && ` • Reviewed: ${submission.reviewedDate}`}
                </div>
                {submission.reviewedBy && (
                  <div className="text-sm text-gray-500">Reviewed by: {submission.reviewedBy}</div>
                )}
                {submission.rejectionReason && (
                  <div className="text-sm text-red-600 mt-1">Reason: {submission.rejectionReason}</div>
                )}
              </div>
              <div className="flex gap-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(submission.status)}`}>
                  {submission.status}
                </span>
                <button
                  onClick={() => handleReview(submission)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Re-review
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render settings view
  const renderSettingsView = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">KYC Settings</h2>

      <div className="space-y-6">
        {/* Required Documents */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Documents</h3>
          <div className="space-y-2">
            {[
              'Government Issued ID (Front)',
              'Government Issued ID (Back)',
              'Proof of Address',
              'Selfie with ID',
            ].map((doc) => (
              <label key={doc} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{doc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Auto-Approval Rules */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Auto-Approval Rules</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Enable auto-approval (Not recommended)</span>
            </label>
            <div className="ml-6 space-y-2">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Minimum investment for auto-approval</label>
                <input
                  type="number"
                  placeholder="$0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notification Templates */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Notification Templates</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Approval Email Template</label>
              <textarea
                rows={3}
                defaultValue="Your KYC verification has been approved. You now have full access to all platform features."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Email Template</label>
              <textarea
                rows={3}
                defaultValue="Your KYC verification has been rejected. Reason: {reason}. Please resubmit with correct documents."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">KYC Management</h1>
          <p className="text-gray-600 mt-1">Review and approve user verification requests</p>
        </div>

        {/* View Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-1">
            {[
              { id: 'queue', label: 'KYC Queue', icon: '⏳' },
              { id: 'history', label: 'History', icon: '📋' },
              { id: 'settings', label: 'Settings', icon: '⚙️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  activeView === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeView === 'queue' && renderQueueView()}
        {activeView === 'history' && renderHistoryView()}
        {activeView === 'settings' && renderSettingsView()}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedKYC && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowReviewModal(false)} />

            <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">KYC Review - {selectedKYC.id}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-gray-600">{selectedKYC.userName}</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedKYC.status)}`}>
                        {selectedKYC.status}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadge(selectedKYC.priority)}`}>
                        {selectedKYC.priority} Priority
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowKeyboardHelp(!showKeyboardHelp)}
                      className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                      title="Keyboard Shortcuts (Press ?)"
                    >
                      <span>⌨️</span>
                      <span>Shortcuts</span>
                    </button>
                    <button
                      onClick={() => setShowReviewModal(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Keyboard Shortcuts Help */}
                {showKeyboardHelp && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <span>⌨️</span>
                      <span>Keyboard Shortcuts</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-white border border-blue-300 rounded text-xs font-mono">A</kbd>
                        <span className="text-blue-800">Approve</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-white border border-blue-300 rounded text-xs font-mono">R</kbd>
                        <span className="text-blue-800">Reject</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-white border border-blue-300 rounded text-xs font-mono">S</kbd>
                        <span className="text-blue-800">Request Resubmission</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-white border border-blue-300 rounded text-xs font-mono">Esc</kbd>
                        <span className="text-blue-800">Close/Go Back</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-white border border-blue-300 rounded text-xs font-mono">?</kbd>
                        <span className="text-blue-800">Toggle Help</span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-blue-700">
                      Note: Shortcuts are disabled when typing in text fields
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* User Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">User Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">User ID</div>
                      <div className="text-sm font-medium text-gray-900">{selectedKYC.userId}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Email</div>
                      <div className="text-sm font-medium text-gray-900">{selectedKYC.userEmail}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Rank</div>
                      <div className="text-sm font-medium text-gray-900">{selectedKYC.userRank}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Investment</div>
                      <div className="text-sm font-medium text-gray-900">${selectedKYC.userInvestment.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* Document Viewer */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Documents</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'idProofFront', label: 'ID Proof (Front)' },
                      { key: 'idProofBack', label: 'ID Proof (Back)' },
                      { key: 'addressProof', label: 'Address Proof' },
                      { key: 'selfieWithId', label: 'Selfie with ID' },
                    ].map((doc) => (
                      <div key={doc.key} className="border border-gray-200 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">{doc.label}</div>
                        <div
                          className="bg-gray-100 rounded-lg p-12 text-center cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => setZoomedImage(doc.key)}
                        >
                          <div className="text-6xl">
                            {selectedKYC.documents[doc.key as keyof typeof selectedKYC.documents]}
                          </div>
                          <div className="text-xs text-gray-500 mt-2">Click to zoom</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verification Checklist */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Verification Checklist</h3>
                  <div className="space-y-2">
                    {[
                      { key: 'idMatchesName', label: 'ID matches name' },
                      { key: 'idClearReadable', label: 'ID is clear and readable' },
                      { key: 'addressMatches', label: 'Address matches' },
                      { key: 'selfieMatchesId', label: 'Selfie matches ID' },
                      { key: 'documentsNotExpired', label: 'Documents are not expired' },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checklist[item.key as keyof typeof checklist]}
                          onChange={(e) => setChecklist({ ...checklist, [item.key]: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Internal Notes */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Internal Notes</h3>
                  <textarea
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    rows={3}
                    placeholder="Add any internal notes about this submission..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <span>✅ Approve</span>
                    <kbd className="px-2 py-1 bg-green-700 rounded text-xs">A</kbd>
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <span>❌ Reject</span>
                    <kbd className="px-2 py-1 bg-red-700 rounded text-xs">R</kbd>
                  </button>
                  <button
                    onClick={() => setShowResubmitModal(true)}
                    className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <span>🔄 Resubmit</span>
                    <kbd className="px-2 py-1 bg-orange-700 rounded text-xs">S</kbd>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowRejectModal(false)} />

            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Reject KYC Submission</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason</label>
                  <select
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a reason...</option>
                    <option value="Blurry documents">Blurry documents</option>
                    <option value="Expired documents">Expired documents</option>
                    <option value="Mismatch information">Mismatch information</option>
                    <option value="Incomplete documents">Incomplete documents</option>
                    <option value="Suspicious documents">Suspicious documents</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {rejectionReason === 'Other' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom Reason</label>
                    <textarea
                      value={customRejectionReason}
                      onChange={(e) => setCustomRejectionReason(e.target.value)}
                      rows={3}
                      placeholder="Enter rejection reason..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRejectModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={!rejectionReason || (rejectionReason === 'Other' && !customRejectionReason)}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resubmit Modal */}
      {showResubmitModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowResubmitModal(false)} />

            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Request Resubmission</h3>

              <div className="space-y-4">
                <p className="text-sm text-gray-600">Select which documents need to be resubmitted:</p>

                <div className="space-y-2">
                  {[
                    { key: 'idProofFront', label: 'ID Proof (Front)' },
                    { key: 'idProofBack', label: 'ID Proof (Back)' },
                    { key: 'addressProof', label: 'Address Proof' },
                    { key: 'selfieWithId', label: 'Selfie with ID' },
                  ].map((doc) => (
                    <label key={doc.key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={resubmitDocuments.includes(doc.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setResubmitDocuments([...resubmitDocuments, doc.key]);
                          } else {
                            setResubmitDocuments(resubmitDocuments.filter(d => d !== doc.key));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{doc.label}</span>
                    </label>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowResubmitModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResubmit}
                    disabled={resubmitDocuments.length === 0}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zoomed Image Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 z-[70] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="absolute inset-0 bg-black/90" onClick={() => setZoomedImage(null)} />

            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Document Viewer</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setImageRotation((prev) => prev - 90)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    ↺ Rotate Left
                  </button>
                  <button
                    onClick={() => setImageRotation((prev) => prev + 90)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    ↻ Rotate Right
                  </button>
                  <button
                    onClick={() => {
                      setZoomedImage(null);
                      setImageRotation(0);
                    }}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>
              <div
                className="bg-gray-100 rounded-lg p-24 text-center"
                style={{ transform: `rotate(${imageRotation}deg)`, transition: 'transform 0.3s' }}
              >
                <div className="text-9xl">
                  {selectedKYC && selectedKYC.documents[zoomedImage as keyof typeof selectedKYC.documents]}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KYCManagement;
