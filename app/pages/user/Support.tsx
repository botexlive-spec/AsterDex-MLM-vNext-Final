import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Button, Card, Badge } from '../../components/ui/DesignSystem';
import { Modal } from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { z } from 'zod';
import apiClient from '../../utils/api-client';

// Interfaces
interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdDate: string;
  lastUpdate: string;
  description: string;
  messages: TicketMessage[];
}

interface TicketMessage {
  id: string;
  sender: 'user' | 'support';
  senderName: string;
  message: string;
  timestamp: string;
  attachments?: string[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  senderName: string;
  message: string;
  timestamp: string;
}

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  helpful?: number;
  notHelpful?: number;
  videoUrl?: string;
}

interface HelpDoc {
  id: string;
  category: string;
  title: string;
  description: string;
  icon: string;
  duration: string;
}

// Validation Schema
const ticketSchema = z.object({
  category: z.string().min(1, 'Please select a category'),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(100, 'Subject must not exceed 100 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000, 'Description must not exceed 1000 characters'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
});

const Support: React.FC = () => {
  // API Loading States
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [isLoadingFaqs, setIsLoadingFaqs] = useState(true);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);

  // Data State
  const [allTickets, setAllTickets] = useState<SupportTicket[]>([]);
  const [allFAQs, setAllFAQs] = useState<FAQItem[]>([]);
  const [helpDocuments, setHelpDocuments] = useState<HelpDoc[]>([]);

  // Ticket System State
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [ticketSearchTerm, setTicketSearchTerm] = useState('');

  // Create Ticket Form
  const [newTicket, setNewTicket] = useState({
    category: '',
    subject: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    attachments: [] as string[]
  });

  // Validation Errors
  const [ticketErrors, setTicketErrors] = useState<{ [key: string]: string }>({});

  // File Upload State
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'agent',
      senderName: 'Support Agent',
      message: 'Hello! How can I help you today?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // FAQ State
  const [faqSearchTerm, setFaqSearchTerm] = useState('');
  const [selectedFaqCategory, setSelectedFaqCategory] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [faqFeedback, setFaqFeedback] = useState<{ [key: string]: 'helpful' | 'not_helpful' }>({});

  // Help Docs State
  const [docSearchTerm, setDocSearchTerm] = useState('');
  const [selectedDocCategory, setSelectedDocCategory] = useState('all');

  // Ticket Reply State
  const [replyMessage, setReplyMessage] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<string[]>([]);

  // Load data from API on mount
  useEffect(() => {
    loadTickets();
    loadFAQs();
    loadHelpDocs();
  }, []);

  const loadTickets = async () => {
    try {
      setIsLoadingTickets(true);
      const response = await apiClient.get<{ success: boolean; data: SupportTicket[] }>('/user/support/tickets');
      if (response.data.success) {
        setAllTickets(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Error loading tickets:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to load support tickets');
      }
      setAllTickets([]);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const loadFAQs = async () => {
    try {
      setIsLoadingFaqs(true);
      const response = await apiClient.get<{ success: boolean; data: FAQItem[] }>('/user/support/faqs');
      if (response.data.success) {
        setAllFAQs(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Error loading FAQs:', error);
      toast.error('Failed to load FAQs');
      setAllFAQs([]);
    } finally {
      setIsLoadingFaqs(false);
    }
  };

  const loadHelpDocs = async () => {
    try {
      setIsLoadingDocs(true);
      const response = await apiClient.get<{ success: boolean; data: HelpDoc[] }>('/user/support/help-docs');
      if (response.data.success) {
        setHelpDocuments(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Error loading help docs:', error);
      toast.error('Failed to load help documentation');
      setHelpDocuments([]);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  // Scroll chat to bottom
  useEffect(() => {
    if (chatOpen && chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatOpen]);

  // Update unread messages when chat is closed
  useEffect(() => {
    if (!chatOpen && chatMessages.length > 1 && chatMessages[chatMessages.length - 1].sender === 'agent') {
      setUnreadMessages(prev => prev + 1);
    }
  }, [chatMessages, chatOpen]);

  // Clear unread when chat opens
  useEffect(() => {
    if (chatOpen) {
      setUnreadMessages(0);
    }
  }, [chatOpen]);

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return allTickets.filter(ticket => {
      const matchesFilter = ticketFilter === 'all' || ticket.status === ticketFilter;
      const matchesSearch = ticket.subject.toLowerCase().includes(ticketSearchTerm.toLowerCase()) ||
                           ticket.id.toLowerCase().includes(ticketSearchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [allTickets, ticketFilter, ticketSearchTerm]);

  // Filtered FAQs
  const filteredFAQs = useMemo(() => {
    return allFAQs.filter(faq => {
      const matchesCategory = selectedFaqCategory === 'all' || faq.category === selectedFaqCategory;
      const matchesSearch = faq.question.toLowerCase().includes(faqSearchTerm.toLowerCase()) ||
                           faq.answer.toLowerCase().includes(faqSearchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allFAQs, selectedFaqCategory, faqSearchTerm]);

  // Filtered Docs
  const filteredDocs = useMemo(() => {
    return helpDocuments.filter(doc => {
      const matchesCategory = selectedDocCategory === 'all' || doc.category === selectedDocCategory;
      const matchesSearch = doc.title.toLowerCase().includes(docSearchTerm.toLowerCase()) ||
                           doc.description.toLowerCase().includes(docSearchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [helpDocuments, selectedDocCategory, docSearchTerm]);

  // FAQ Categories
  const faqCategories = useMemo(() => {
    const categories = Array.from(new Set(allFAQs.map(faq => faq.category)));
    return ['all', ...categories];
  }, [allFAQs]);

  const docCategories = useMemo(() => {
    const categories = Array.from(new Set(helpDocuments.map(doc => doc.category)));
    return ['all', ...categories];
  }, [helpDocuments]);

  // Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File size exceeds 5MB limit`);
      } else if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: File type not supported`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
    }

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      setNewTicket({ ...newTicket, attachments: [...newTicket.attachments, ...validFiles.map(f => f.name)] });
      toast.success(`${validFiles.length} file(s) added successfully`);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setNewTicket({ ...newTicket, attachments: newTicket.attachments.filter((_, i) => i !== index) });
    toast.success('File removed');
  };

  const handleCreateTicket = async () => {
    try {
      // Clear previous errors
      setTicketErrors({});

      // Validate form
      ticketSchema.parse({
        category: newTicket.category,
        subject: newTicket.subject,
        description: newTicket.description,
        priority: newTicket.priority
      });

      // Call API to create ticket
      const response = await apiClient.post('/user/support/tickets', {
        category: newTicket.category,
        subject: newTicket.subject,
        description: newTicket.description,
        priority: newTicket.priority,
        attachments: newTicket.attachments
      });

      if (response.data.success) {
        toast.success('Ticket created successfully! You will receive updates via email.');
        setShowCreateTicket(false);
        setNewTicket({
          category: '',
          subject: '',
          description: '',
          priority: 'medium',
          attachments: []
        });
        setUploadedFiles([]);

        // Reload tickets
        loadTickets();
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const errors: { [key: string]: string } = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setTicketErrors(errors);
        toast.error('Please fix the validation errors');
      } else {
        console.error('Error creating ticket:', error);
        toast.error(error.response?.data?.error || 'Failed to create ticket');
      }
    }
  };

  const handleSendChatMessage = () => {
    if (!chatInput.trim()) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      senderName: 'You',
      message: chatInput,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, newMessage]);
    setChatInput('');

    // Simulate agent typing and response
    setIsAgentTyping(true);
    setTimeout(() => {
      setIsAgentTyping(false);
      const agentResponse: ChatMessage = {
        id: `msg-${Date.now()}-agent`,
        sender: 'agent',
        senderName: 'Support Agent',
        message: 'Thank you for your message. Our team is reviewing your inquiry and will respond shortly.',
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, agentResponse]);
    }, 2000);
  };

  const handleSendTicketReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;

    try {
      const response = await apiClient.post(`/user/support/tickets/${selectedTicket.id}/reply`, {
        message: replyMessage,
        attachments: replyAttachments
      });

      if (response.data.success) {
        toast.success('Reply sent successfully!');
        setReplyMessage('');
        setReplyAttachments([]);

        // Reload tickets to get updated messages
        loadTickets();

        // Update selected ticket
        const updatedTickets = allTickets.find(t => t.id === selectedTicket.id);
        if (updatedTickets) {
          setSelectedTicket(updatedTickets);
        }
      }
    } catch (error: any) {
      console.error('Error sending reply:', error);
      toast.error(error.response?.data?.error || 'Failed to send reply');
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;

    if (confirm('Are you sure you want to close this ticket? You can reopen it later if needed.')) {
      try {
        const response = await apiClient.put(`/user/support/tickets/${selectedTicket.id}/close`);

        if (response.data.success) {
          toast.success('Ticket closed successfully!');
          setSelectedTicket(null);
          loadTickets();
        }
      } catch (error: any) {
        console.error('Error closing ticket:', error);
        toast.error(error.response?.data?.error || 'Failed to close ticket');
      }
    }
  };

  const handleFAQFeedback = async (faqId: string, feedback: 'helpful' | 'not_helpful') => {
    setFaqFeedback(prev => ({ ...prev, [faqId]: feedback }));

    try {
      await apiClient.post(`/user/support/faqs/${faqId}/feedback`, {
        helpful: feedback === 'helpful'
      });
    } catch (error: any) {
      console.error('Error submitting FAQ feedback:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (selectedTicket) {
    // Ticket Details View
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => setSelectedTicket(null)}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <span>←</span>
            <span>Back to Tickets</span>
          </button>

          {/* Ticket Header */}
          <Card className="mb-6">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">{selectedTicket.subject}</h1>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Ticket ID: {selectedTicket.id}</p>
                </div>
                {selectedTicket.status !== 'closed' && (
                  <Button onClick={handleCloseTicket} className="bg-red-600 hover:bg-red-700">
                    Close Ticket
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Category:</span>
                  <span className="ml-2 font-medium">{selectedTicket.category}</span>
                </div>
                <div>
                  <span className="text-gray-500">Created:</span>
                  <span className="ml-2 font-medium">{formatDateTime(selectedTicket.createdDate)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Last Update:</span>
                  <span className="ml-2 font-medium">{formatDateTime(selectedTicket.lastUpdate)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Conversation Thread */}
          <Card className="mb-6">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Conversation</h2>
              <div className="space-y-4">
                {selectedTicket.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-blue-50 border-l-4 border-blue-500'
                        : 'bg-gray-50 border-l-4 border-green-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">{message.senderName}</span>
                      <span className="text-xs text-gray-500">{formatDateTime(message.timestamp)}</span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 flex gap-2">
                        {message.attachments.map((file, idx) => (
                          <span key={idx} className="text-xs bg-white px-2 py-1 rounded border border-gray-300">
                            📎 {file}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Reply Section */}
          {selectedTicket.status !== 'closed' && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Add Reply</h2>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={5}
                  placeholder="Type your message here..."
                />
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <input
                      type="file"
                      id="reply-attachments"
                      className="hidden"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []).map(f => f.name);
                        setReplyAttachments(files);
                      }}
                    />
                    <label
                      htmlFor="reply-attachments"
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer inline-flex items-center gap-2"
                    >
                      📎 Attach Files
                    </label>
                    {replyAttachments.length > 0 && (
                      <span className="ml-3 text-sm text-gray-600">
                        {replyAttachments.length} file(s) selected
                      </span>
                    )}
                  </div>
                  <Button onClick={handleSendTicketReply} className="bg-blue-600 hover:bg-blue-700">
                    Send Reply
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Status Timeline */}
          <Card className="mt-6">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Status Timeline</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white flex-shrink-0">
                    ✓
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Ticket Created</p>
                    <p className="text-sm text-gray-500">{formatDateTime(selectedTicket.createdDate)}</p>
                  </div>
                </div>
                {selectedTicket.status !== 'open' && (
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white flex-shrink-0">
                      ✓
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">In Progress</p>
                      <p className="text-sm text-gray-500">{formatDateTime(selectedTicket.lastUpdate)}</p>
                    </div>
                  </div>
                )}
                {(selectedTicket.status === 'resolved' || selectedTicket.status === 'closed') && (
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white flex-shrink-0">
                      ✓
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Resolved</p>
                      <p className="text-sm text-gray-500">{formatDateTime(selectedTicket.lastUpdate)}</p>
                    </div>
                  </div>
                )}
                {selectedTicket.status === 'closed' && (
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white flex-shrink-0">
                      ✓
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Closed</p>
                      <p className="text-sm text-gray-500">{formatDateTime(selectedTicket.lastUpdate)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Support & Help Center</h1>
          <p className="text-gray-600">Get the help you need, whenever you need it</p>
        </div>

        {/* Quick Help Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="p-6 text-center">
              <div className="text-5xl mb-4">❓</div>
              <h3 className="text-xl font-semibold mb-2">FAQs</h3>
              <p className="text-gray-600 text-sm mb-4">Quick answers to common questions</p>
              <a href="#faq" className="text-blue-600 hover:text-blue-700 font-medium">
                Browse FAQs →
              </a>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="p-6 text-center">
              <div className="text-5xl mb-4">🎥</div>
              <h3 className="text-xl font-semibold mb-2">Video Tutorials</h3>
              <p className="text-gray-600 text-sm mb-4">Step-by-step video guides</p>
              <a href="#docs" className="text-blue-600 hover:text-blue-700 font-medium">
                Watch Videos →
              </a>
            </div>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <div className="p-6 text-center">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-2">Documentation</h3>
              <p className="text-gray-600 text-sm mb-4">Comprehensive guides and tutorials</p>
              <a href="#docs" className="text-blue-600 hover:text-blue-700 font-medium">
                Read Docs →
              </a>
            </div>
          </Card>
        </div>

        {/* Contact Options */}
        <Card className="mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Contact Support</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl">💬</div>
                <div>
                  <p className="font-semibold">Live Chat</p>
                  <p className="text-sm text-gray-600">Available 24/7</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <div className="text-3xl">✉️</div>
                <div>
                  <p className="font-semibold">Email Support</p>
                  <p className="text-sm text-gray-600">support@asterdex.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl">📞</div>
                <div>
                  <p className="font-semibold">Phone Support</p>
                  <p className="text-sm text-gray-600">+1 (800) 123-4567</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Support Tickets Section */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">My Support Tickets</h2>
              <Button
                onClick={() => setShowCreateTicket(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                + Create Ticket
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={ticketSearchTerm}
                  onChange={(e) => setTicketSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setTicketFilter(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      ticketFilter === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Tickets List */}
            {isLoadingTickets ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-gray-600">Loading tickets...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTickets.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎫</div>
                    <p className="text-gray-600 mb-2">No tickets found</p>
                    <p className="text-sm text-gray-500">Create a ticket to get support from our team</p>
                  </div>
                ) : (
                  filteredTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicket(ticket)}
                      className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                              {ticket.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>ID: {ticket.id}</span>
                            <span>•</span>
                            <span>{ticket.category}</span>
                            <span>•</span>
                            <span>Created: {formatDateTime(ticket.createdDate)}</span>
                            <span>•</span>
                            <span>Updated: {formatDateTime(ticket.lastUpdate)}</span>
                          </div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-700">
                          View →
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </Card>

        {/* FAQ Section */}
        <div id="faq" className="mb-8">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Frequently Asked Questions</h2>

              {/* FAQ Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search FAQs..."
                    value={faqSearchTerm}
                    onChange={(e) => setFaqSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedFaqCategory}
                  onChange={(e) => setSelectedFaqCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {faqCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* FAQ List */}
              {isLoadingFaqs ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">⏳</div>
                  <p className="text-gray-600">Loading FAQs...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFAQs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No FAQs found matching your search
                    </div>
                  ) : (
                    filteredFAQs.map((faq) => (
                      <div key={faq.id} className="border border-gray-200 rounded-lg">
                        <button
                          onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-medium text-left text-gray-900">{faq.question}</span>
                          <span className="text-gray-500 text-xl">
                            {expandedFaq === faq.id ? '−' : '+'}
                          </span>
                        </button>
                        {expandedFaq === faq.id && (
                          <div className="px-4 pb-4">
                            <div className="pt-2 border-t border-gray-100">
                              <p className="text-gray-700 mb-4">{faq.answer}</p>
                              {faq.videoUrl && (
                                <div className="mb-4">
                                  <a href={faq.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                                    🎥 Watch video tutorial
                                  </a>
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Was this helpful?</span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleFAQFeedback(faq.id, 'helpful')}
                                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                      faqFeedback[faq.id] === 'helpful'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                  >
                                    👍 Yes {faq.helpful ? `(${faq.helpful})` : ''}
                                  </button>
                                  <button
                                    onClick={() => handleFAQFeedback(faq.id, 'not_helpful')}
                                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                      faqFeedback[faq.id] === 'not_helpful'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                  >
                                    👎 No {faq.notHelpful ? `(${faq.notHelpful})` : ''}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Help Documentation */}
        <div id="docs">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Help Documentation</h2>

              {/* Docs Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search documentation..."
                    value={docSearchTerm}
                    onChange={(e) => setDocSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedDocCategory}
                  onChange={(e) => setSelectedDocCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {docCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Docs Grid */}
              {isLoadingDocs ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">⏳</div>
                  <p className="text-gray-600">Loading documentation...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredDocs.length === 0 ? (
                    <div className="col-span-2 text-center py-8 text-gray-500">
                      No documentation found matching your search
                    </div>
                  ) : (
                    filteredDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-3xl">{doc.icon}</div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{doc.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">{doc.duration}</span>
                              <span className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                                Read more →
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Live Chat Widget */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col max-h-[600px]">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-2xl">
                👨‍💼
              </div>
              <div>
                <p className="font-semibold">Support Agent</p>
                <p className="text-xs opacity-90">Online</p>
              </div>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="text-white hover:bg-blue-800 rounded-full w-8 h-8 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            <div className="space-y-3">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-lg ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              {isAgentTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg">
                    <p className="text-sm">Agent is typing...</p>
                  </div>
                </div>
              )}
              <div ref={chatMessagesEndRef} />
            </div>
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                onClick={handleSendChatMessage}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center text-2xl"
      >
        {chatOpen ? '✕' : '💬'}
        {!chatOpen && unreadMessages > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadMessages}
          </span>
        )}
      </button>

      {/* Create Ticket Modal */}
      {showCreateTicket && (
        <Modal
          isOpen={showCreateTicket}
          onClose={() => setShowCreateTicket(false)}
          title="Create Support Ticket"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={newTicket.category}
                onChange={(e) => {
                  setNewTicket({ ...newTicket, category: e.target.value });
                  if (ticketErrors.category) {
                    setTicketErrors({ ...ticketErrors, category: '' });
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  ticketErrors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a category</option>
                <option value="Account & Verification">Account & Verification</option>
                <option value="Wallet & Transactions">Wallet & Transactions</option>
                <option value="Earnings & Commissions">Earnings & Commissions</option>
                <option value="Referrals & Team">Referrals & Team</option>
                <option value="Technical Issues">Technical Issues</option>
                <option value="Other">Other</option>
              </select>
              {ticketErrors.category && (
                <p className="text-red-500 text-sm mt-1">{ticketErrors.category}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newTicket.subject}
                onChange={(e) => {
                  setNewTicket({ ...newTicket, subject: e.target.value });
                  if (ticketErrors.subject) {
                    setTicketErrors({ ...ticketErrors, subject: '' });
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  ticketErrors.subject ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Brief description of your issue"
              />
              {ticketErrors.subject && (
                <p className="text-red-500 text-sm mt-1">{ticketErrors.subject}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={newTicket.description}
                onChange={(e) => {
                  setNewTicket({ ...newTicket, description: e.target.value });
                  if (ticketErrors.description) {
                    setTicketErrors({ ...ticketErrors, description: '' });
                  }
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  ticketErrors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                rows={5}
                placeholder="Please provide detailed information about your issue..."
              />
              {ticketErrors.description && (
                <p className="text-red-500 text-sm mt-1">{ticketErrors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['low', 'medium', 'high', 'urgent'] as const).map((priority) => (
                  <button
                    key={priority}
                    onClick={() => setNewTicket({ ...newTicket, priority })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      newTicket.priority === priority
                        ? getPriorityColor(priority)
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments
              </label>
              <input
                type="file"
                id="ticket-attachments"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.doc,.docx"
                onChange={handleFileUpload}
              />
              <label
                htmlFor="ticket-attachments"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer inline-flex items-center justify-center gap-2 transition-colors"
              >
                📎 Attach Files (Max 5MB each)
              </label>
              {uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-sm">📄</span>
                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                        <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="text-red-500 hover:text-red-700 px-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Supported formats: JPG, PNG, GIF, PDF, TXT, DOC, DOCX
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setShowCreateTicket(false)}
                className="flex-1 bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTicket}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Create Ticket
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Support;
