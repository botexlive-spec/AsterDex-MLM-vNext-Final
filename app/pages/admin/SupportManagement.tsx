import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// Enums
type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
type TicketCategory = 'technical' | 'billing' | 'account' | 'general' | 'kyc' | 'withdrawal';
type ChatStatus = 'active' | 'waiting' | 'closed';

// Interfaces
interface Ticket {
  id: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  userId: string;
  userName: string;
  userEmail: string;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: Date;
  updatedAt: Date;
  lastReplyAt: Date;
  messagesCount: number;
  isRead: boolean;
}

interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'admin';
  message: string;
  isInternal: boolean;
  createdAt: Date;
  attachments?: string[];
}

interface CannedResponse {
  id: string;
  title: string;
  content: string;
  category: string;
  shortcut?: string;
  usageCount: number;
  createdAt: Date;
}

interface ChatSession {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: ChatStatus;
  assignedTo?: string;
  assignedToName?: string;
  startedAt: Date;
  lastMessageAt: Date;
  messagesCount: number;
  waitingTime: number; // in minutes
}

interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'admin';
  message: string;
  createdAt: Date;
}

// Mock Data
const mockTickets: Ticket[] = [
  {
    id: 'TKT-001',
    subject: 'Unable to withdraw funds',
    category: 'withdrawal',
    priority: 'high',
    status: 'open',
    userId: 'U001',
    userName: 'John Doe',
    userEmail: 'john.doe@example.com',
    assignedTo: 'A001',
    assignedToName: 'Admin Sarah',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
    lastReplyAt: new Date(Date.now() - 30 * 60 * 1000),
    messagesCount: 5,
    isRead: false,
  },
  {
    id: 'TKT-002',
    subject: 'KYC verification taking too long',
    category: 'kyc',
    priority: 'medium',
    status: 'pending',
    userId: 'U002',
    userName: 'Jane Smith',
    userEmail: 'jane.smith@example.com',
    assignedTo: 'A002',
    assignedToName: 'Admin Mike',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    lastReplyAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    messagesCount: 3,
    isRead: true,
  },
  {
    id: 'TKT-003',
    subject: 'Account balance discrepancy',
    category: 'billing',
    priority: 'urgent',
    status: 'open',
    userId: 'U003',
    userName: 'Robert Johnson',
    userEmail: 'robert.j@example.com',
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000),
    lastReplyAt: new Date(Date.now() - 15 * 60 * 1000),
    messagesCount: 8,
    isRead: false,
  },
  {
    id: 'TKT-004',
    subject: 'How to activate trading robot?',
    category: 'general',
    priority: 'low',
    status: 'resolved',
    userId: 'U004',
    userName: 'Emily Davis',
    userEmail: 'emily.davis@example.com',
    assignedTo: 'A001',
    assignedToName: 'Admin Sarah',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
    lastReplyAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
    messagesCount: 2,
    isRead: true,
  },
];

const mockTicketMessages: TicketMessage[] = [
  {
    id: 'MSG-001',
    ticketId: 'TKT-001',
    senderId: 'U001',
    senderName: 'John Doe',
    senderRole: 'user',
    message: 'I have been trying to withdraw my funds for the past 3 days but the transaction keeps failing. Please help!',
    isInternal: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'MSG-002',
    ticketId: 'TKT-001',
    senderId: 'A001',
    senderName: 'Admin Sarah',
    senderRole: 'admin',
    message: 'Hello John, thank you for reaching out. I can see your withdrawal request. Let me check your account details.',
    isInternal: false,
    createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
  },
  {
    id: 'MSG-003',
    ticketId: 'TKT-001',
    senderId: 'A001',
    senderName: 'Admin Sarah',
    senderRole: 'admin',
    message: 'User has pending KYC verification. Need to resolve that first before processing withdrawal.',
    isInternal: true,
    createdAt: new Date(Date.now() - 1.4 * 60 * 60 * 1000),
  },
  {
    id: 'MSG-004',
    ticketId: 'TKT-001',
    senderId: 'A001',
    senderName: 'Admin Sarah',
    senderRole: 'admin',
    message: 'I noticed your KYC verification is still pending. Could you please complete the verification process first? Once that is approved, your withdrawal will be processed automatically.',
    isInternal: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    id: 'MSG-005',
    ticketId: 'TKT-001',
    senderId: 'U001',
    senderName: 'John Doe',
    senderRole: 'user',
    message: 'I already submitted my KYC documents 2 weeks ago. When will it be approved?',
    isInternal: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  },
];

const mockCannedResponses: CannedResponse[] = [
  {
    id: 'CR-001',
    title: 'Welcome Message',
    content: 'Hello {{USER_NAME}}, thank you for contacting support. How can I help you today?',
    category: 'General',
    shortcut: '/welcome',
    usageCount: 245,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'CR-002',
    title: 'KYC Pending',
    content: 'Your KYC verification is currently under review. Our team typically processes verification within 24-48 hours. You will receive an email notification once it is approved.',
    category: 'KYC',
    shortcut: '/kyc-pending',
    usageCount: 189,
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'CR-003',
    title: 'Withdrawal Processing Time',
    content: 'Withdrawal requests are typically processed within 24-48 hours after approval. Please ensure your KYC verification is complete and all withdrawal requirements are met.',
    category: 'Withdrawal',
    shortcut: '/withdrawal-time',
    usageCount: 156,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'CR-004',
    title: 'Account Verification Required',
    content: 'For security reasons, we need to verify your account. Please provide a government-issued ID and a recent utility bill showing your address.',
    category: 'Account',
    shortcut: '/verify-account',
    usageCount: 92,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
  },
];

const mockChatSessions: ChatSession[] = [
  {
    id: 'CHAT-001',
    userId: 'U005',
    userName: 'Michael Brown',
    userEmail: 'michael.b@example.com',
    status: 'active',
    assignedTo: 'A001',
    assignedToName: 'Admin Sarah',
    startedAt: new Date(Date.now() - 15 * 60 * 1000),
    lastMessageAt: new Date(Date.now() - 2 * 60 * 1000),
    messagesCount: 12,
    waitingTime: 0,
  },
  {
    id: 'CHAT-002',
    userId: 'U006',
    userName: 'Sarah Wilson',
    userEmail: 'sarah.w@example.com',
    status: 'waiting',
    startedAt: new Date(Date.now() - 8 * 60 * 1000),
    lastMessageAt: new Date(Date.now() - 8 * 60 * 1000),
    messagesCount: 1,
    waitingTime: 8,
  },
  {
    id: 'CHAT-003',
    userId: 'U007',
    userName: 'David Martinez',
    userEmail: 'david.m@example.com',
    status: 'waiting',
    startedAt: new Date(Date.now() - 5 * 60 * 1000),
    lastMessageAt: new Date(Date.now() - 5 * 60 * 1000),
    messagesCount: 1,
    waitingTime: 5,
  },
];

const mockChatMessages: ChatMessage[] = [
  {
    id: 'CMSG-001',
    chatId: 'CHAT-001',
    senderId: 'U005',
    senderName: 'Michael Brown',
    senderRole: 'user',
    message: 'Hello, I need help with my account',
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
  },
  {
    id: 'CMSG-002',
    chatId: 'CHAT-001',
    senderId: 'A001',
    senderName: 'Admin Sarah',
    senderRole: 'admin',
    message: 'Hello Michael! I\'d be happy to help you. What seems to be the issue with your account?',
    createdAt: new Date(Date.now() - 14 * 60 * 1000),
  },
  {
    id: 'CMSG-003',
    chatId: 'CHAT-001',
    senderId: 'U005',
    senderName: 'Michael Brown',
    senderRole: 'user',
    message: 'I can\'t seem to access my trading dashboard',
    createdAt: new Date(Date.now() - 2 * 60 * 1000),
  },
];

const SupportManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tickets' | 'canned' | 'livechat'>('dashboard');
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>(mockTicketMessages);
  const [replyMessage, setReplyMessage] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'all'>('all');
  const [assignedFilter, setAssignedFilter] = useState<string>('all');

  // Canned Responses
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>(mockCannedResponses);
  const [showCannedModal, setShowCannedModal] = useState(false);
  const [editingCanned, setEditingCanned] = useState<CannedResponse | null>(null);
  const [cannedCategoryFilter, setCannedCategoryFilter] = useState<string>('all');

  // Live Chat
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(mockChatSessions);
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(mockChatMessages);

  // Split view
  const [isSplitView, setIsSplitView] = useState(true);

  // Calculate dashboard metrics
  const openTicketsCount = tickets.filter(t => t.status === 'open').length;
  const avgResponseTime = '2h 15m'; // Mock value
  const avgResolutionTime = '8h 30m'; // Mock value
  const ticketsByPriority = {
    low: tickets.filter(t => t.priority === 'low').length,
    medium: tickets.filter(t => t.priority === 'medium').length,
    high: tickets.filter(t => t.priority === 'high').length,
    urgent: tickets.filter(t => t.priority === 'urgent').length,
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Focus search implementation
      }
      // Ctrl/Cmd + Enter to send reply
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (selectedTicket && replyMessage) {
          handleSendReply();
        }
      }
      // Esc to close ticket details
      if (e.key === 'Escape' && selectedTicket) {
        setSelectedTicket(null);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedTicket, replyMessage]);

  // Real-time updates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time status updates (in production, this would be WebSocket/polling)
      const shouldUpdate = Math.random() > 0.95; // 5% chance every interval

      if (shouldUpdate && tickets.length > 0) {
        const randomIndex = Math.floor(Math.random() * tickets.length);
        const ticket = tickets[randomIndex];

        // Simulate status changes
        const statuses: TicketStatus[] = ['open', 'pending', 'resolved', 'closed'];
        const currentStatusIndex = statuses.indexOf(ticket.status);
        const nextStatus = statuses[(currentStatusIndex + 1) % statuses.length];

        setTickets(prevTickets =>
          prevTickets.map((t, i) =>
            i === randomIndex
              ? { ...t, status: nextStatus, updatedAt: new Date() }
              : t
          )
        );

        // Show notification for status change
        toast.success(`Ticket ${ticket.id} status changed to ${nextStatus}`, {
          duration: 3000,
        });
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [tickets]);

  // Auto-refresh ticket timestamps
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update relative timestamps
      setTickets(prevTickets => [...prevTickets]);
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  // Filter tickets
  const filteredTickets = tickets.filter(ticket => {
    if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && ticket.priority !== priorityFilter) return false;
    if (categoryFilter !== 'all' && ticket.category !== categoryFilter) return false;
    if (assignedFilter !== 'all' && ticket.assignedTo !== assignedFilter) return false;
    return true;
  });

  // Handlers
  const handleSendReply = () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    const newMessage: TicketMessage = {
      id: `MSG-${Date.now()}`,
      ticketId: selectedTicket.id,
      senderId: 'A001',
      senderName: 'Admin Sarah',
      senderRole: 'admin',
      message: replyMessage,
      isInternal: false,
      createdAt: new Date(),
    };

    setTicketMessages([...ticketMessages, newMessage]);
    setReplyMessage('');
    toast.success('Reply sent successfully');

    // Update ticket
    setTickets(tickets.map(t =>
      t.id === selectedTicket.id
        ? { ...t, lastReplyAt: new Date(), messagesCount: t.messagesCount + 1, updatedAt: new Date() }
        : t
    ));
  };

  const handleAddInternalNote = () => {
    if (!selectedTicket || !internalNote.trim()) return;

    const newNote: TicketMessage = {
      id: `NOTE-${Date.now()}`,
      ticketId: selectedTicket.id,
      senderId: 'A001',
      senderName: 'Admin Sarah',
      senderRole: 'admin',
      message: internalNote,
      isInternal: true,
      createdAt: new Date(),
    };

    setTicketMessages([...ticketMessages, newNote]);
    setInternalNote('');
    toast.success('Internal note added');
  };

  const handleUpdateTicketStatus = (ticketId: string, status: TicketStatus) => {
    setTickets(tickets.map(t =>
      t.id === ticketId ? { ...t, status, updatedAt: new Date() } : t
    ));
    toast.success(`Ticket status updated to ${status}`);
  };

  const handleUpdateTicketPriority = (ticketId: string, priority: TicketPriority) => {
    setTickets(tickets.map(t =>
      t.id === ticketId ? { ...t, priority, updatedAt: new Date() } : t
    ));
    toast.success(`Ticket priority updated to ${priority}`);
  };

  const handleAssignTicket = (ticketId: string, adminId: string, adminName: string) => {
    setTickets(tickets.map(t =>
      t.id === ticketId ? { ...t, assignedTo: adminId, assignedToName: adminName, updatedAt: new Date() } : t
    ));

    // Update selected ticket if it's the one being assigned
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, assignedTo: adminId, assignedToName: adminName, updatedAt: new Date() });
    }

    toast.success(`Ticket ${ticketId} assigned to ${adminName}`, {
      icon: '👤',
    });
  };

  const handleBulkAction = (action: 'close' | 'assign' | 'priority', value?: string) => {
    if (selectedTicketIds.length === 0) {
      toast.error('Please select tickets first');
      return;
    }

    if (action === 'close') {
      setTickets(tickets.map(t =>
        selectedTicketIds.includes(t.id) ? { ...t, status: 'closed', updatedAt: new Date() } : t
      ));
      toast.success(`${selectedTicketIds.length} ticket(s) closed successfully`, {
        icon: '✅',
      });
    } else if (action === 'assign' && value) {
      const adminName = value === 'A001' ? 'Admin Sarah' : value === 'A002' ? 'Admin Mike' : 'Unassigned';

      setTickets(tickets.map(t =>
        selectedTicketIds.includes(t.id)
          ? { ...t, assignedTo: value, assignedToName: adminName, updatedAt: new Date() }
          : t
      ));
      toast.success(`${selectedTicketIds.length} ticket(s) assigned to ${adminName}`, {
        icon: '👤',
      });
    } else if (action === 'priority' && value) {
      setTickets(tickets.map(t =>
        selectedTicketIds.includes(t.id)
          ? { ...t, priority: value as TicketPriority, updatedAt: new Date() }
          : t
      ));
      toast.success(`${selectedTicketIds.length} ticket(s) priority updated to ${value}`, {
        icon: '⚡',
      });
    }

    setSelectedTicketIds([]);
  };

  const handleInsertCanned = (content: string) => {
    // Replace variables with actual values
    let processedContent = content;
    if (selectedTicket) {
      processedContent = processedContent
        .replace(/\{\{USER_NAME\}\}/g, selectedTicket.userName)
        .replace(/\{\{USER_EMAIL\}\}/g, selectedTicket.userEmail)
        .replace(/\{\{TICKET_ID\}\}/g, selectedTicket.id);
    }

    // Add spacing if there's already content
    const newContent = replyMessage
      ? replyMessage + '\n\n' + processedContent
      : processedContent;

    setReplyMessage(newContent);
    toast.success('Canned response inserted');
  };

  const handleSaveCannedResponse = () => {
    if (!editingCanned) return;

    if (editingCanned.id.startsWith('NEW')) {
      setCannedResponses([...cannedResponses, { ...editingCanned, id: `CR-${Date.now()}` }]);
      toast.success('Canned response created');
    } else {
      setCannedResponses(cannedResponses.map(c => c.id === editingCanned.id ? editingCanned : c));
      toast.success('Canned response updated');
    }

    setEditingCanned(null);
    setShowCannedModal(false);
  };

  const handleDeleteCannedResponse = (id: string) => {
    setCannedResponses(cannedResponses.filter(c => c.id !== id));
    toast.success('Canned response deleted');
  };

  const handleTakeoverChat = (chatId: string) => {
    setChatSessions(chatSessions.map(c =>
      c.id === chatId
        ? { ...c, status: 'active', assignedTo: 'A001', assignedToName: 'Admin Sarah' }
        : c
    ));
    toast.success('Chat session taken over');
  };

  const handleTransferChat = (chatId: string, adminId: string, adminName: string) => {
    setChatSessions(chatSessions.map(c =>
      c.id === chatId
        ? { ...c, assignedTo: adminId, assignedToName: adminName }
        : c
    ));
    toast.success(`Chat transferred to ${adminName}`);
  };

  const handleCloseChat = (chatId: string) => {
    setChatSessions(chatSessions.map(c =>
      c.id === chatId ? { ...c, status: 'closed' } : c
    ));
    toast.success('Chat session closed');
  };

  const handleSendChatMessage = () => {
    if (!selectedChat || !chatMessage.trim()) return;

    const newMessage: ChatMessage = {
      id: `CMSG-${Date.now()}`,
      chatId: selectedChat.id,
      senderId: 'A001',
      senderName: 'Admin Sarah',
      senderRole: 'admin',
      message: chatMessage,
      createdAt: new Date(),
    };

    setChatMessages([...chatMessages, newMessage]);
    setChatMessage('');
    toast.success('Message sent');

    // Update chat session
    setChatSessions(chatSessions.map(c =>
      c.id === selectedChat.id
        ? { ...c, lastMessageAt: new Date(), messagesCount: c.messagesCount + 1 }
        : c
    ));
  };

  // Get messages for selected ticket
  const selectedTicketMessages = selectedTicket
    ? ticketMessages.filter(m => m.ticketId === selectedTicket.id)
    : [];

  // Render priority badge
  const renderPriorityBadge = (priority: TicketPriority) => {
    const colors = {
      low: 'bg-[#94a3b8]/10 text-[#94a3b8]',
      medium: 'bg-[#3b82f6]/10 text-[#3b82f6]',
      high: 'bg-[#f59e0b]/10 text-[#f59e0b]',
      urgent: 'bg-[#ef4444]/10 text-[#ef4444]',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[priority]}`}>
        {priority}
      </span>
    );
  };

  // Render status badge
  const renderStatusBadge = (status: TicketStatus) => {
    const colors = {
      open: 'bg-[#10b981]/10 text-[#10b981]',
      pending: 'bg-[#f59e0b]/10 text-[#f59e0b]',
      resolved: 'bg-[#3b82f6]/10 text-[#3b82f6]',
      closed: 'bg-[#94a3b8]/10 text-[#94a3b8]',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status]}`}>
        {status}
      </span>
    );
  };

  // Render category badge
  const renderCategoryBadge = (category: TicketCategory) => {
    const icons = {
      technical: '🔧',
      billing: '💰',
      account: '👤',
      general: '💬',
      kyc: '🆔',
      withdrawal: '⬆️',
    };
    return (
      <span className="flex items-center gap-1 text-xs text-[#94a3b8]">
        <span>{icons[category]}</span>
        <span>{category}</span>
      </span>
    );
  };

  // Render Dashboard
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-[#94a3b8]">Open Tickets</h3>
            <span className="text-2xl">🎫</span>
          </div>
          <p className="text-3xl font-bold text-[#f8fafc]">{openTicketsCount}</p>
          <p className="text-xs text-[#00C7D1] mt-1">+3 in last 24h</p>
        </div>

        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-[#94a3b8]">Avg Response Time</h3>
            <span className="text-2xl">⏱️</span>
          </div>
          <p className="text-3xl font-bold text-[#f8fafc]">{avgResponseTime}</p>
          <p className="text-xs text-[#10b981] mt-1">-15% from yesterday</p>
        </div>

        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-[#94a3b8]">Avg Resolution Time</h3>
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-3xl font-bold text-[#f8fafc]">{avgResolutionTime}</p>
          <p className="text-xs text-[#10b981] mt-1">-8% from yesterday</p>
        </div>

        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-[#94a3b8]">Total Tickets</h3>
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-3xl font-bold text-[#f8fafc]">{tickets.length}</p>
          <p className="text-xs text-[#94a3b8] mt-1">All time</p>
        </div>
      </div>

      {/* Tickets by Priority */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-6">
        <h3 className="text-lg font-bold text-[#f8fafc] mb-4">Tickets by Priority</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#94a3b8]">Low</span>
              {renderPriorityBadge('low')}
            </div>
            <p className="text-2xl font-bold text-[#f8fafc]">{ticketsByPriority.low}</p>
          </div>

          <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#94a3b8]">Medium</span>
              {renderPriorityBadge('medium')}
            </div>
            <p className="text-2xl font-bold text-[#f8fafc]">{ticketsByPriority.medium}</p>
          </div>

          <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#94a3b8]">High</span>
              {renderPriorityBadge('high')}
            </div>
            <p className="text-2xl font-bold text-[#f8fafc]">{ticketsByPriority.high}</p>
          </div>

          <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#94a3b8]">Urgent</span>
              {renderPriorityBadge('urgent')}
            </div>
            <p className="text-2xl font-bold text-[#f8fafc]">{ticketsByPriority.urgent}</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-6">
        <h3 className="text-lg font-bold text-[#f8fafc] mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {tickets.slice(0, 5).map((ticket) => (
            <div
              key={ticket.id}
              className="flex items-center justify-between p-3 bg-[#0f172a] border border-[#334155] rounded-lg hover:border-[#00C7D1] transition-colors cursor-pointer"
              onClick={() => {
                setSelectedTicket(ticket);
                setActiveTab('tickets');
              }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-[#f8fafc]">{ticket.id}</span>
                  {renderStatusBadge(ticket.status)}
                  {renderPriorityBadge(ticket.priority)}
                </div>
                <p className="text-sm text-[#cbd5e1]">{ticket.subject}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#94a3b8]">{ticket.userName}</p>
                <p className="text-xs text-[#94a3b8]">{format(ticket.updatedAt, 'MMM dd, HH:mm')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render Ticket List
  const renderTicketList = () => (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
          >
            <option value="all">All Categories</option>
            <option value="technical">Technical</option>
            <option value="billing">Billing</option>
            <option value="account">Account</option>
            <option value="general">General</option>
            <option value="kyc">KYC</option>
            <option value="withdrawal">Withdrawal</option>
          </select>

          <select
            value={assignedFilter}
            onChange={(e) => setAssignedFilter(e.target.value)}
            className="px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
          >
            <option value="all">All Admins</option>
            <option value="A001">Admin Sarah</option>
            <option value="A002">Admin Mike</option>
            <option value="">Unassigned</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedTicketIds.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-[#00C7D1]/10 border border-[#00C7D1] rounded-lg">
            <span className="text-sm text-[#f8fafc]">
              {selectedTicketIds.length} ticket(s) selected
            </span>
            <button
              onClick={() => handleBulkAction('close')}
              className="px-3 py-1 bg-[#334155] text-[#f8fafc] text-sm rounded hover:bg-[#475569]"
            >
              Close Selected
            </button>
            <select
              onChange={(e) => {
                if (e.target.value) handleBulkAction('assign', e.target.value);
                e.target.value = '';
              }}
              className="px-3 py-1 bg-[#334155] text-[#f8fafc] text-sm rounded"
            >
              <option value="">Assign to...</option>
              <option value="A001">Admin Sarah</option>
              <option value="A002">Admin Mike</option>
            </select>
            <select
              onChange={(e) => {
                if (e.target.value) handleBulkAction('priority', e.target.value);
                e.target.value = '';
              }}
              className="px-3 py-1 bg-[#334155] text-[#f8fafc] text-sm rounded"
            >
              <option value="">Change Priority...</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        )}
      </div>

      {/* Split View Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#f8fafc]">
          Tickets ({filteredTickets.length})
        </h3>
        <button
          onClick={() => setIsSplitView(!isSplitView)}
          className="px-4 py-2 bg-[#334155] text-[#f8fafc] rounded-lg hover:bg-[#475569] transition-colors"
        >
          {isSplitView ? '📋 List View' : '⬌ Split View'}
        </button>
      </div>

      {/* Tickets Table/List */}
      <div className={`grid ${isSplitView && selectedTicket ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
        {/* Ticket List */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0f172a] border-b border-[#334155]">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedTicketIds.length === filteredTickets.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTicketIds(filteredTickets.map(t => t.id));
                        } else {
                          setSelectedTicketIds([]);
                        }
                      }}
                      className="rounded border-[#334155] bg-[#0f172a] text-[#00C7D1]"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#94a3b8]">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#94a3b8]">Subject</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#94a3b8]">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#94a3b8]">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#94a3b8]">Priority</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#94a3b8]">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-[#94a3b8]">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]">
                {filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`hover:bg-[#0f172a] cursor-pointer transition-colors ${
                      selectedTicket?.id === ticket.id ? 'bg-[#0f172a] border-l-4 border-l-[#00C7D1]' : ''
                    } ${!ticket.isRead ? 'font-semibold' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedTicketIds.includes(ticket.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (e.target.checked) {
                            setSelectedTicketIds([...selectedTicketIds, ticket.id]);
                          } else {
                            setSelectedTicketIds(selectedTicketIds.filter(id => id !== ticket.id));
                          }
                        }}
                        className="rounded border-[#334155] bg-[#0f172a] text-[#00C7D1]"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-[#00C7D1]">{ticket.id}</td>
                    <td className="px-4 py-3 text-sm text-[#f8fafc] max-w-xs truncate">
                      {ticket.subject}
                      {!ticket.isRead && <span className="ml-2 text-[#00C7D1]">●</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#cbd5e1]">{ticket.userName}</td>
                    <td className="px-4 py-3">{renderCategoryBadge(ticket.category)}</td>
                    <td className="px-4 py-3">{renderPriorityBadge(ticket.priority)}</td>
                    <td className="px-4 py-3">{renderStatusBadge(ticket.status)}</td>
                    <td className="px-4 py-3 text-sm text-[#94a3b8]">
                      {format(ticket.updatedAt, 'MMM dd, HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ticket Details (Split View) */}
        {isSplitView && selectedTicket && renderTicketDetails()}
      </div>

      {/* Ticket Details (Full View) */}
      {!isSplitView && selectedTicket && (
        <div className="mt-4">
          {renderTicketDetails()}
        </div>
      )}
    </div>
  );

  // Render Ticket Details
  const renderTicketDetails = () => {
    if (!selectedTicket) return null;

    return (
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#334155]">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-[#f8fafc]">{selectedTicket.id}</h3>
                {renderStatusBadge(selectedTicket.status)}
                {renderPriorityBadge(selectedTicket.priority)}
                {renderCategoryBadge(selectedTicket.category)}
              </div>
              <p className="text-lg text-[#cbd5e1]">{selectedTicket.subject}</p>
            </div>
            {!isSplitView && (
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-[#94a3b8] hover:text-[#f8fafc] text-2xl"
              >
                ×
              </button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedTicket.status}
              onChange={(e) => handleUpdateTicketStatus(selectedTicket.id, e.target.value as TicketStatus)}
              className="px-3 py-1 bg-[#0f172a] border border-[#334155] rounded text-sm text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
            >
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={selectedTicket.priority}
              onChange={(e) => handleUpdateTicketPriority(selectedTicket.id, e.target.value as TicketPriority)}
              className="px-3 py-1 bg-[#0f172a] border border-[#334155] rounded text-sm text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <select
              value={selectedTicket.assignedTo || ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value) {
                  const name = value === 'A001' ? 'Admin Sarah' : value === 'A002' ? 'Admin Mike' : 'Unassigned';
                  handleAssignTicket(selectedTicket.id, value, name);
                }
              }}
              className="px-3 py-1 bg-[#0f172a] border border-[#334155] rounded text-sm text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
            >
              <option value="">{selectedTicket.assignedTo ? selectedTicket.assignedToName : 'Assign to...'}</option>
              <option value="A001">Admin Sarah</option>
              <option value="A002">Admin Mike</option>
              <option value="">Unassign</option>
            </select>

            <button
              onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'resolved')}
              className="px-3 py-1 bg-[#10b981] text-[#f8fafc] text-sm rounded hover:bg-[#059669]"
            >
              Mark Resolved
            </button>

            <button
              onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'closed')}
              className="px-3 py-1 bg-[#ef4444] text-[#f8fafc] text-sm rounded hover:bg-[#dc2626]"
            >
              Close Ticket
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 p-6">
          {/* Conversation Thread */}
          <div className="col-span-2 space-y-4">
            <h4 className="font-semibold text-[#f8fafc]">Conversation</h4>

            {/* Messages */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {selectedTicketMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg ${
                    message.isInternal
                      ? 'bg-[#f59e0b]/10 border border-[#f59e0b]'
                      : message.senderRole === 'admin'
                      ? 'bg-[#00C7D1]/10 border border-[#00C7D1]'
                      : 'bg-[#0f172a] border border-[#334155]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-medium text-[#f8fafc]">{message.senderName}</span>
                      <span className="ml-2 text-xs text-[#94a3b8]">
                        {message.senderRole === 'admin' ? '👤 Admin' : '👥 User'}
                      </span>
                      {message.isInternal && (
                        <span className="ml-2 px-2 py-0.5 bg-[#f59e0b] text-[#000] text-xs rounded font-medium">
                          Internal Note
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#94a3b8]">
                      {format(message.createdAt, 'MMM dd, HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-[#cbd5e1] whitespace-pre-wrap">{message.message}</p>
                </div>
              ))}
            </div>

            {/* Reply Section */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-[#cbd5e1]">Reply to User</label>
                  <button
                    onClick={() => setShowCannedModal(true)}
                    className="text-xs text-[#00C7D1] hover:text-[#00e5f0]"
                  >
                    📋 Insert Canned Response
                  </button>
                </div>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                  placeholder="Type your reply... (Ctrl+Enter to send)"
                />
              </div>

              <button
                onClick={handleSendReply}
                disabled={!replyMessage.trim()}
                className="px-4 py-2 bg-[#00C7D1] text-[#000] rounded-lg font-medium hover:bg-[#00e5f0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send Reply (Ctrl+Enter)
              </button>
            </div>

            {/* Internal Notes */}
            <div className="space-y-3 pt-4 border-t border-[#334155]">
              <label className="text-sm font-medium text-[#cbd5e1]">Add Internal Note (Not visible to user)</label>
              <textarea
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                placeholder="Add internal note for team reference..."
              />
              <button
                onClick={handleAddInternalNote}
                disabled={!internalNote.trim()}
                className="px-4 py-2 bg-[#f59e0b] text-[#000] rounded-lg font-medium hover:bg-[#f59e0b]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Internal Note
              </button>
            </div>
          </div>

          {/* User Information Sidebar */}
          <div className="space-y-4">
            <h4 className="font-semibold text-[#f8fafc]">User Information</h4>

            <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-4 space-y-3">
              <div>
                <p className="text-xs text-[#94a3b8] mb-1">Name</p>
                <p className="text-sm font-medium text-[#f8fafc]">{selectedTicket.userName}</p>
              </div>

              <div>
                <p className="text-xs text-[#94a3b8] mb-1">Email</p>
                <p className="text-sm font-medium text-[#f8fafc]">{selectedTicket.userEmail}</p>
              </div>

              <div>
                <p className="text-xs text-[#94a3b8] mb-1">User ID</p>
                <p className="text-sm font-medium text-[#f8fafc]">{selectedTicket.userId}</p>
              </div>

              <div>
                <p className="text-xs text-[#94a3b8] mb-1">Assigned To</p>
                <p className="text-sm font-medium text-[#f8fafc]">
                  {selectedTicket.assignedToName || 'Unassigned'}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#94a3b8] mb-1">Created</p>
                <p className="text-sm font-medium text-[#f8fafc]">
                  {format(selectedTicket.createdAt, 'MMM dd, yyyy HH:mm')}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#94a3b8] mb-1">Last Updated</p>
                <p className="text-sm font-medium text-[#f8fafc]">
                  {format(selectedTicket.updatedAt, 'MMM dd, yyyy HH:mm')}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#94a3b8] mb-1">Messages</p>
                <p className="text-sm font-medium text-[#f8fafc]">{selectedTicket.messagesCount}</p>
              </div>
            </div>

            <button
              className="w-full px-4 py-2 bg-[#334155] text-[#f8fafc] rounded-lg hover:bg-[#475569] transition-colors"
            >
              View User Profile
            </button>

            <button
              className="w-full px-4 py-2 bg-[#334155] text-[#f8fafc] rounded-lg hover:bg-[#475569] transition-colors"
            >
              View User Tickets
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render Canned Responses
  const renderCannedResponses = () => {
    const categories = ['All', ...Array.from(new Set(cannedResponses.map(c => c.category)))];
    const filteredCanned = cannedCategoryFilter === 'all'
      ? cannedResponses
      : cannedResponses.filter(c => c.category.toLowerCase() === cannedCategoryFilter);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#f8fafc]">Canned Responses ({cannedResponses.length})</h3>
          <button
            onClick={() => {
              setEditingCanned({
                id: 'NEW-' + Date.now(),
                title: '',
                content: '',
                category: 'General',
                usageCount: 0,
                createdAt: new Date(),
              });
              setShowCannedModal(true);
            }}
            className="px-4 py-2 bg-[#00C7D1] text-[#000] rounded-lg font-medium hover:bg-[#00e5f0] transition-colors"
          >
            + Create New Response
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCannedCategoryFilter(cat.toLowerCase())}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                cannedCategoryFilter === cat.toLowerCase()
                  ? 'bg-[#00C7D1] text-[#000]'
                  : 'bg-[#334155] text-[#f8fafc] hover:bg-[#475569]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Canned Responses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCanned.map((canned) => (
            <div
              key={canned.id}
              className="bg-[#1e293b] border border-[#334155] rounded-lg p-4 hover:border-[#00C7D1] transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-[#f8fafc] mb-1">{canned.title}</h4>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#334155] text-[#00C7D1] text-xs rounded">
                      {canned.category}
                    </span>
                    {canned.shortcut && (
                      <span className="px-2 py-0.5 bg-[#475569] text-[#94a3b8] text-xs rounded font-mono">
                        {canned.shortcut}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingCanned(canned);
                      setShowCannedModal(true);
                    }}
                    className="text-[#00C7D1] hover:text-[#00e5f0] text-sm"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteCannedResponse(canned.id)}
                    className="text-[#ef4444] hover:text-[#dc2626] text-sm"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <p className="text-sm text-[#cbd5e1] mb-3 line-clamp-3">{canned.content}</p>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[#94a3b8]">
                  Used {canned.usageCount} times
                </span>
                <button
                  onClick={() => handleInsertCanned(canned.content)}
                  className="px-3 py-1 bg-[#334155] text-[#f8fafc] text-xs rounded hover:bg-[#475569]"
                >
                  Insert
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Canned Response Modal */}
        {showCannedModal && editingCanned && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1e293b] rounded-lg border border-[#334155] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-[#334155]">
                <h3 className="text-xl font-bold text-[#f8fafc]">
                  {editingCanned.id.startsWith('NEW') ? 'Create' : 'Edit'} Canned Response
                </h3>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editingCanned.title}
                    onChange={(e) => setEditingCanned({ ...editingCanned, title: e.target.value })}
                    className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                    placeholder="Enter response title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                    Category
                  </label>
                  <select
                    value={editingCanned.category}
                    onChange={(e) => setEditingCanned({ ...editingCanned, category: e.target.value })}
                    className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                  >
                    <option value="General">General</option>
                    <option value="KYC">KYC</option>
                    <option value="Withdrawal">Withdrawal</option>
                    <option value="Account">Account</option>
                    <option value="Technical">Technical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                    Shortcut (Optional)
                  </label>
                  <input
                    type="text"
                    value={editingCanned.shortcut || ''}
                    onChange={(e) => setEditingCanned({ ...editingCanned, shortcut: e.target.value })}
                    className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                    placeholder="e.g., /welcome"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                    Content
                  </label>
                  <textarea
                    value={editingCanned.content}
                    onChange={(e) => setEditingCanned({ ...editingCanned, content: e.target.value })}
                    rows={8}
                    className="w-full px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                    placeholder="Enter response content... Use {{USER_NAME}} for personalization"
                  />
                  <p className="text-xs text-[#94a3b8] mt-1">
                    Available variables: {'{'}{'{'} USER_NAME {'}'}{'}'},  {'{'}{'{'} USER_EMAIL {'}'}{'}'}, {'{'}{'{'} TICKET_ID {'}'}{'}'}
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-[#334155] flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowCannedModal(false);
                    setEditingCanned(null);
                  }}
                  className="px-4 py-2 bg-[#334155] text-[#f8fafc] rounded-lg hover:bg-[#475569]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCannedResponse}
                  className="px-4 py-2 bg-[#00C7D1] text-[#000] rounded-lg font-medium hover:bg-[#00e5f0]"
                >
                  {editingCanned.id.startsWith('NEW') ? 'Create' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Live Chat
  const renderLiveChat = () => {
    const activeSessions = chatSessions.filter(c => c.status === 'active');
    const waitingSessions = chatSessions.filter(c => c.status === 'waiting');
    const closedSessions = chatSessions.filter(c => c.status === 'closed');

    return (
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-[#94a3b8]">Active Chats</h4>
              <span className="text-2xl">💬</span>
            </div>
            <p className="text-3xl font-bold text-[#10b981]">{activeSessions.length}</p>
          </div>

          <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-[#94a3b8]">Waiting in Queue</h4>
              <span className="text-2xl">⏳</span>
            </div>
            <p className="text-3xl font-bold text-[#f59e0b]">{waitingSessions.length}</p>
          </div>

          <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-[#94a3b8]">Total Today</h4>
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-3xl font-bold text-[#f8fafc]">{chatSessions.length}</p>
          </div>
        </div>

        {/* Waiting Queue */}
        {waitingSessions.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-[#f8fafc] mb-3">Waiting Queue ({waitingSessions.length})</h3>
            <div className="space-y-2">
              {waitingSessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-[#1e293b] border border-[#f59e0b] rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-[#f8fafc]">{session.userName}</h4>
                        <span className="px-2 py-0.5 bg-[#f59e0b]/10 text-[#f59e0b] text-xs rounded font-medium">
                          Waiting {session.waitingTime}m
                        </span>
                      </div>
                      <p className="text-sm text-[#94a3b8]">{session.userEmail}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTakeoverChat(session.id)}
                        className="px-4 py-2 bg-[#10b981] text-[#f8fafc] rounded-lg hover:bg-[#059669]"
                      >
                        Take Chat
                      </button>
                      <button
                        onClick={() => handleCloseChat(session.id)}
                        className="px-4 py-2 bg-[#ef4444] text-[#f8fafc] rounded-lg hover:bg-[#dc2626]"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Sessions */}
        <div>
          <h3 className="text-lg font-bold text-[#f8fafc] mb-3">Active Sessions ({activeSessions.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="bg-[#1e293b] border border-[#334155] rounded-lg p-4 hover:border-[#00C7D1] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-[#f8fafc]">{session.userName}</h4>
                      <span className="w-2 h-2 bg-[#10b981] rounded-full"></span>
                    </div>
                    <p className="text-sm text-[#94a3b8]">{session.userEmail}</p>
                  </div>
                  <div className="text-right text-sm text-[#94a3b8]">
                    <p>{format(session.startedAt, 'HH:mm')}</p>
                    <p>{session.messagesCount} msgs</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3 text-xs text-[#94a3b8]">
                  <span>Assigned to: {session.assignedToName}</span>
                  <span>Last msg: {format(session.lastMessageAt, 'HH:mm')}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedChat(session)}
                    className="flex-1 px-3 py-2 bg-[#00C7D1] text-[#000] rounded-lg font-medium hover:bg-[#00e5f0]"
                  >
                    View Chat
                  </button>
                  <button
                    onClick={() => {
                      // Transfer chat modal would open here
                      toast.success('Transfer feature');
                    }}
                    className="px-3 py-2 bg-[#334155] text-[#f8fafc] rounded-lg hover:bg-[#475569]"
                  >
                    Transfer
                  </button>
                  <button
                    onClick={() => handleCloseChat(session.id)}
                    className="px-3 py-2 bg-[#ef4444] text-[#f8fafc] rounded-lg hover:bg-[#dc2626]"
                  >
                    Close
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat History */}
        {closedSessions.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-[#f8fafc] mb-3">Recent History</h3>
            <div className="space-y-2">
              {closedSessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-[#1e293b] border border-[#334155] rounded-lg p-4 opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-[#f8fafc]">{session.userName}</h4>
                        <span className="px-2 py-0.5 bg-[#94a3b8]/10 text-[#94a3b8] text-xs rounded font-medium">
                          Closed
                        </span>
                      </div>
                      <p className="text-sm text-[#94a3b8]">
                        {session.assignedToName} • {session.messagesCount} messages • {format(session.startedAt, 'MMM dd, HH:mm')}
                      </p>
                    </div>
                    <button className="px-3 py-1 bg-[#334155] text-[#f8fafc] text-sm rounded hover:bg-[#475569]">
                      View Transcript
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Interface Modal */}
        {selectedChat && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1e293b] rounded-lg border border-[#334155] w-full max-w-4xl max-h-[90vh] flex flex-col">
              {/* Chat Header */}
              <div className="p-6 border-b border-[#334155] flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#f8fafc] mb-1">
                    Chat with {selectedChat.userName}
                  </h3>
                  <p className="text-sm text-[#94a3b8]">{selectedChat.userEmail}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCloseChat(selectedChat.id)}
                    className="px-3 py-1 bg-[#ef4444] text-[#f8fafc] text-sm rounded hover:bg-[#dc2626]"
                  >
                    End Chat
                  </button>
                  <button
                    onClick={() => setSelectedChat(null)}
                    className="text-[#94a3b8] hover:text-[#f8fafc] text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {chatMessages
                  .filter(m => m.chatId === selectedChat.id)
                  .map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-4 ${
                          message.senderRole === 'admin'
                            ? 'bg-[#00C7D1]/10 border border-[#00C7D1]'
                            : 'bg-[#0f172a] border border-[#334155]'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-[#f8fafc]">
                            {message.senderName}
                          </span>
                          <span className="text-xs text-[#94a3b8]">
                            {format(message.createdAt, 'HH:mm')}
                          </span>
                        </div>
                        <p className="text-sm text-[#cbd5e1] whitespace-pre-wrap">
                          {message.message}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Message Input */}
              <div className="p-6 border-t border-[#334155]">
                <div className="flex gap-3">
                  <textarea
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChatMessage();
                      }
                    }}
                    rows={3}
                    className="flex-1 px-4 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                    placeholder="Type your message... (Enter to send)"
                  />
                  <button
                    onClick={handleSendChatMessage}
                    disabled={!chatMessage.trim()}
                    className="px-6 bg-[#00C7D1] text-[#000] rounded-lg font-medium hover:bg-[#00e5f0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f172a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#f8fafc] mb-2">Support Management</h1>
          <p className="text-[#94a3b8]">Manage tickets, live chat, and customer support</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[#334155]">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'dashboard'
                ? 'text-[#00C7D1] border-[#00C7D1]'
                : 'text-[#94a3b8] border-transparent hover:text-[#f8fafc]'
            }`}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setActiveTab('tickets')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'tickets'
                ? 'text-[#00C7D1] border-[#00C7D1]'
                : 'text-[#94a3b8] border-transparent hover:text-[#f8fafc]'
            }`}
          >
            🎫 Tickets ({tickets.length})
          </button>
          <button
            onClick={() => setActiveTab('canned')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'canned'
                ? 'text-[#00C7D1] border-[#00C7D1]'
                : 'text-[#94a3b8] border-transparent hover:text-[#f8fafc]'
            }`}
          >
            📋 Canned Responses
          </button>
          <button
            onClick={() => setActiveTab('livechat')}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === 'livechat'
                ? 'text-[#00C7D1] border-[#00C7D1]'
                : 'text-[#94a3b8] border-transparent hover:text-[#f8fafc]'
            }`}
          >
            💬 Live Chat {chatSessions.filter(c => c.status === 'waiting').length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-[#f59e0b] text-[#000] text-xs rounded font-bold">
                {chatSessions.filter(c => c.status === 'waiting').length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'tickets' && renderTicketList()}
        {activeTab === 'canned' && renderCannedResponses()}
        {activeTab === 'livechat' && renderLiveChat()}

        {/* Keyboard Shortcuts Info */}
        <div className="mt-6 p-4 bg-[#1e293b] border border-[#334155] rounded-lg">
          <h4 className="text-sm font-semibold text-[#f8fafc] mb-2">⌨️ Keyboard Shortcuts</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-[#94a3b8]">
            <div><kbd className="px-2 py-1 bg-[#0f172a] rounded">Ctrl+K</kbd> Search</div>
            <div><kbd className="px-2 py-1 bg-[#0f172a] rounded">Ctrl+Enter</kbd> Send Reply</div>
            <div><kbd className="px-2 py-1 bg-[#0f172a] rounded">Esc</kbd> Close Ticket</div>
            <div><kbd className="px-2 py-1 bg-[#0f172a] rounded">Tab</kbd> Switch Tabs</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportManagement;
