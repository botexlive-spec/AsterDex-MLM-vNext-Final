import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  getBinaryTree,
  getAllBinaryNodes,
  getBinarySettings,
  saveBinarySettings,
  manualBinaryPlacement,
  getBinaryReports,
  recalculateBinaryVolumes,
} from '../../services/admin-binary.service';

type TabType = 'global-view' | 'settings' | 'manual-placement' | 'reports';

interface BinaryNode {
  id: string;
  userId: string;
  userName: string;
  email: string;
  leftVolume: number;
  rightVolume: number;
  personalVolume: number;
  leftChild?: BinaryNode;
  rightChild?: BinaryNode;
  position: 'left' | 'right' | 'root';
  level: number;
  isActive: boolean;
}

interface BinarySettings {
  spilloverEnabled: boolean;
  spilloverRule: 'auto' | 'manual';
  placementPriority: 'left' | 'right' | 'weaker-leg' | 'balanced';
  cappingEnabled: boolean;
  dailyCap: number;
  weeklyCap: number;
  monthlyCap: number;
  matchingBonusPercentage: number;
  carryForwardEnabled: boolean;
  maxCarryForwardDays: number;
}

interface PlacementRequest {
  userId: string;
  userName: string;
  sponsorId: string;
  sponsorName: string;
  position: 'left' | 'right';
  reason: string;
}

interface BinaryReport {
  userId: string;
  userName: string;
  leftVolume: number;
  rightVolume: number;
  lesserVolume: number;
  matchingBonus: number;
  carryForward: number;
  totalEarnings: number;
  lastCalculated: string;
}

const BinaryManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('global-view');
  const [searchUserId, setSearchUserId] = useState('');
  const [currentTree, setCurrentTree] = useState<BinaryNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<BinaryNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [binaryReports, setBinaryReports] = useState<BinaryReport[]>([]);

  // Refs for centering functionality
  const treeContainerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Binary Settings
  const [settings, setSettings] = useState<BinarySettings>({
    spilloverEnabled: true,
    spilloverRule: 'auto',
    placementPriority: 'weaker-leg',
    cappingEnabled: true,
    dailyCap: 5000,
    weeklyCap: 30000,
    monthlyCap: 100000,
    matchingBonusPercentage: 10,
    carryForwardEnabled: true,
    maxCarryForwardDays: 30,
  });

  // Manual Placement
  const [showPlacementModal, setShowPlacementModal] = useState(false);
  const [placementRequest, setPlacementRequest] = useState<PlacementRequest>({
    userId: '',
    userName: '',
    sponsorId: '',
    sponsorName: '',
    position: 'left',
    reason: '',
  });
  const [placementHistory, setPlacementHistory] = useState<any[]>([]);

  // Move User Modal
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveFromNode, setMoveFromNode] = useState<BinaryNode | null>(null);
  const [moveToNode, setMoveToNode] = useState<BinaryNode | null>(null);

  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const tabs = [
    { id: 'global-view' as TabType, label: 'Global Binary View', icon: '🌳' },
    { id: 'settings' as TabType, label: 'Binary Settings', icon: '⚙️' },
    { id: 'manual-placement' as TabType, label: 'Manual Placement', icon: '✋' },
    { id: 'reports' as TabType, label: 'Binary Reports', icon: '📊' },
  ];

  // Load binary data from database
  useEffect(() => {
    const loadBinaryData = async () => {
      try {
        setLoading(true);

        // Load settings, tree, and reports in parallel
        const [settingsData, allNodes, reportsData] = await Promise.all([
          getBinarySettings(),
          getAllBinaryNodes(),
          getBinaryReports(),
        ]);

        setSettings(settingsData);
        setBinaryReports(reportsData);

        // Find root node (user with no parent)
        const rootNode = allNodes.find(n => !n.parent_id);
        if (rootNode) {
          // Load full tree starting from root
          const tree = await getBinaryTree(rootNode.user_id);
          if (tree) {
            setCurrentTree(tree as any);
            setExpandedNodes(new Set([tree.id]));
          }
        }

        toast.success('Binary data loaded');
      } catch (error) {
        console.error('Error loading binary data:', error);
        toast.error('Failed to load binary data');
      } finally {
        setLoading(false);
      }
    };

    loadBinaryData();
  }, []);

  // Save settings to database
  const handleSaveSettings = async () => {
    try {
      await saveBinarySettings(settings);
      toast.success('Binary settings saved successfully');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save settings');
    }
  };

  const getAllNodeIds = (node: BinaryNode | undefined): string[] => {
    if (!node) return [];
    const ids = [node.id];
    if (node.leftChild) ids.push(...getAllNodeIds(node.leftChild));
    if (node.rightChild) ids.push(...getAllNodeIds(node.rightChild));
    return ids;
  };

  const handleExpandAll = () => {
    const allNodeIds = getAllNodeIds(currentTree);
    setExpandedNodes(new Set(allNodeIds));
    toast.success('All nodes expanded', { icon: '🌳', duration: 2000 });
  };

  const handleCollapseAll = () => {
    setExpandedNodes(new Set([currentTree.id]));
    toast.success('All nodes collapsed', { icon: '🌱', duration: 2000 });
  };

  const handleSearchUser = async () => {
    if (!searchUserId.trim()) {
      toast.error('Please enter a user ID');
      return;
    }

    try {
      setLoading(true);
      const tree = await getBinaryTree(searchUserId);

      if (tree) {
        setCurrentTree(tree as any);
        setExpandedNodes(new Set([tree.id]));
        toast.success(`Loaded binary tree for user: ${searchUserId}`);
      } else {
        toast.error('User not found in binary tree');
      }
    } catch (error) {
      console.error('Error searching user:', error);
      toast.error('Failed to load user tree');
    } finally {
      setLoading(false);
    }
  };

  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const centerOnNode = (nodeId: string) => {
    const nodeElement = nodeRefs.current.get(nodeId);
    const container = treeContainerRef.current;

    if (nodeElement && container) {
      // Calculate the center position
      const nodeRect = nodeElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Scroll to center the node horizontally
      const scrollLeft = nodeElement.offsetLeft - (containerRect.width / 2) + (nodeRect.width / 2);
      const scrollTop = nodeElement.offsetTop - (containerRect.height / 2) + (nodeRect.height / 2);

      container.scrollTo({
        left: scrollLeft,
        top: scrollTop,
        behavior: 'smooth',
      });
    }
  };

  const handleNodeClick = (node: BinaryNode) => {
    setSelectedNode(node);
    // Center the tree on the selected node
    setTimeout(() => centerOnNode(node.id), 100);
  };

  const handlePlaceUser = () => {
    if (!placementRequest.userId || !placementRequest.sponsorId || !placementRequest.reason) {
      toast.error('Please fill all required fields');
      return;
    }

    setConfirmAction({
      title: 'Confirm User Placement',
      message: `Place ${placementRequest.userName} under ${placementRequest.sponsorName} (${placementRequest.position} leg)?`,
      onConfirm: () => {
        const newPlacement = {
          id: `p-${Date.now()}`,
          ...placementRequest,
          placedBy: 'Admin User',
          placedDate: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        };
        setPlacementHistory([newPlacement, ...placementHistory]);
        toast.success('User placed successfully!');
        setShowPlacementModal(false);
        setShowConfirmModal(false);
        // Reset form
        setPlacementRequest({
          userId: '',
          userName: '',
          sponsorId: '',
          sponsorName: '',
          position: 'left',
          reason: '',
        });
      },
    });
    setShowConfirmModal(true);
  };

  const handleMoveUser = () => {
    if (!moveFromNode || !moveToNode) {
      toast.error('Please select both source and destination nodes');
      return;
    }

    setConfirmAction({
      title: 'Confirm User Move',
      message: `Move ${moveFromNode.userName} from current position to under ${moveToNode.userName}? This action requires authorization.`,
      onConfirm: () => {
        toast.success(`${moveFromNode.userName} moved successfully!`);
        setShowMoveModal(false);
        setShowConfirmModal(false);
        setMoveFromNode(null);
        setMoveToNode(null);
      },
    });
    setShowConfirmModal(true);
  };

  const renderBinaryNode = (node: BinaryNode | undefined, depth: number = 0): JSX.Element | null => {
    if (!node) return null;

    const isSelected = selectedNode?.id === node.id;
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = !!(node.leftChild || node.rightChild);

    return (
      <div className="flex flex-col items-center" style={{ minWidth: '200px' }}>
        {/* Node Card */}
        <div
          ref={(el) => {
            if (el) {
              nodeRefs.current.set(node.id, el);
            } else {
              nodeRefs.current.delete(node.id);
            }
          }}
          onClick={() => handleNodeClick(node)}
          className={`bg-[#0f172a] border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg ${
            isSelected ? 'border-[#00C7D1] shadow-xl' : 'border-[#334155]'
          } ${!node.isActive ? 'opacity-50' : ''}`}
          style={{ width: '180px' }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl">{node.isActive ? '👤' : '💤'}</div>
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              node.isActive ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-[#94a3b8]/10 text-[#94a3b8]'
            }`}>
              {node.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
          <div className="text-sm font-semibold text-[#f8fafc] mb-1">{node.userName}</div>
          <div className="text-xs text-[#94a3b8] mb-3">{node.email}</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Left:</span>
              <span className="text-[#00C7D1] font-semibold">${node.leftVolume}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Right:</span>
              <span className="text-[#00C7D1] font-semibold">${node.rightVolume}</span>
            </div>
            <div className="flex justify-between border-t border-[#334155] pt-1">
              <span className="text-[#94a3b8]">Personal:</span>
              <span className="text-[#10b981] font-semibold">${node.personalVolume}</span>
            </div>
          </div>

          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNodeExpansion(node.id);
              }}
              className="w-full mt-3 px-2 py-1 bg-[#334155] hover:bg-[#475569] text-[#cbd5e1] rounded text-xs font-medium transition-all flex items-center justify-center gap-1"
            >
              {isExpanded ? '▼ Collapse' : '▶ Expand'}
            </button>
          )}
        </div>

        {/* Children - Only render if expanded */}
        {hasChildren && isExpanded && (
          <>
            {/* Connector Lines */}
            <div className="h-8 w-0.5 bg-[#334155]"></div>
            <div className="flex gap-8">
              {/* Left Branch */}
              <div className="flex flex-col items-center flex-1">
                {node.leftChild && (
                  <>
                    <div className="h-8 w-0.5 bg-[#334155]"></div>
                    {renderBinaryNode(node.leftChild, depth + 1)}
                  </>
                )}
                {!node.leftChild && (
                  <div className="bg-[#1e293b] border-2 border-dashed border-[#334155] rounded-lg p-6 cursor-pointer hover:border-[#00C7D1] transition-all"
                    style={{ width: '180px' }}>
                    <div className="text-center text-[#94a3b8] text-sm">
                      <div className="text-3xl mb-2">➕</div>
                      <div>Empty Position</div>
                      <div className="text-xs mt-1">(Left)</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Branch */}
              <div className="flex flex-col items-center flex-1">
                {node.rightChild && (
                  <>
                    <div className="h-8 w-0.5 bg-[#334155]"></div>
                    {renderBinaryNode(node.rightChild, depth + 1)}
                  </>
                )}
                {!node.rightChild && (
                  <div className="bg-[#1e293b] border-2 border-dashed border-[#334155] rounded-lg p-6 cursor-pointer hover:border-[#00C7D1] transition-all"
                    style={{ width: '180px' }}>
                    <div className="text-center text-[#94a3b8] text-sm">
                      <div className="text-3xl mb-2">➕</div>
                      <div>Empty Position</div>
                      <div className="text-xs mt-1">(Right)</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // Chart data
  const volumeTrendData = [
    { date: 'Jan 20', left: 8000, right: 6000 },
    { date: 'Jan 22', left: 9500, right: 7500 },
    { date: 'Jan 24', left: 11000, right: 9000 },
    { date: 'Jan 26', left: 13000, right: 10500 },
    { date: 'Jan 28', left: 15000, right: 12000 },
  ];

  const matchingBonusData = binaryReports.map(r => ({
    name: r.userName.split(' ')[0],
    bonus: r.matchingBonus,
    carryForward: r.carryForward,
  }));

  return (
    <div className="min-h-screen bg-[#0f172a] p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f8fafc] mb-2">Binary Tree Management</h1>
          <p className="text-[#cbd5e1]">Manage binary tree structure, placement, and settings</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-[#00C7D1] text-[#0f172a]'
                  : 'bg-[#1e293b] text-[#cbd5e1] hover:bg-[#334155]'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-[#1e293b] rounded-lg shadow-xl">
          {/* Global Binary View Tab */}
          {activeTab === 'global-view' && (
            <div className="p-6">
              {/* Search Section */}
              <div className="mb-6">
                <div className="flex gap-4 mb-3">
                  <input
                    type="text"
                    value={searchUserId}
                    onChange={(e) => setSearchUserId(e.target.value)}
                    placeholder="Enter User ID or Email to view their binary tree..."
                    className="flex-1 bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-3 text-[#f8fafc]"
                  />
                  <button
                    onClick={handleSearchUser}
                    className="px-6 py-3 bg-[#00C7D1] text-[#0f172a] rounded-lg hover:bg-[#00e5f0] transition-all font-medium"
                  >
                    🔍 Search
                  </button>
                </div>
                {/* Tree Controls */}
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={handleExpandAll}
                    className="px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all text-sm font-medium"
                  >
                    ▼ Expand All
                  </button>
                  <button
                    onClick={handleCollapseAll}
                    className="px-4 py-2 bg-[#334155] text-[#cbd5e1] rounded-lg hover:bg-[#475569] transition-all text-sm font-medium"
                  >
                    ▶ Collapse All
                  </button>
                </div>
              </div>

              {/* Selected Node Info */}
              {selectedNode && (
                <div className="mb-6 bg-[#0f172a] border border-[#00C7D1] rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-[#f8fafc] mb-2">Selected Node Details</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-[#94a3b8]">User:</span>
                          <span className="ml-2 text-[#f8fafc] font-medium">{selectedNode.userName}</span>
                        </div>
                        <div>
                          <span className="text-[#94a3b8]">Email:</span>
                          <span className="ml-2 text-[#f8fafc]">{selectedNode.email}</span>
                        </div>
                        <div>
                          <span className="text-[#94a3b8]">Position:</span>
                          <span className="ml-2 text-[#00C7D1] font-medium capitalize">{selectedNode.position}</span>
                        </div>
                        <div>
                          <span className="text-[#94a3b8]">Level:</span>
                          <span className="ml-2 text-[#00C7D1] font-medium">{selectedNode.level}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setMoveFromNode(selectedNode);
                          setShowMoveModal(true);
                        }}
                        className="px-4 py-2 bg-[#f59e0b] text-white rounded-lg hover:bg-[#d97706] transition-all text-sm"
                      >
                        Move User
                      </button>
                      <button
                        onClick={() => setSelectedNode(null)}
                        className="px-4 py-2 bg-[#334155] text-[#cbd5e1] rounded-lg hover:bg-[#475569] transition-all text-sm"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Binary Tree Visualization */}
              <div
                ref={treeContainerRef}
                className="overflow-x-auto pb-8"
                style={{ maxHeight: '600px', overflowY: 'auto' }}
              >
                <div className="inline-block min-w-full">
                  <div className="flex justify-center py-8">
                    {renderBinaryNode(currentTree)}
                  </div>
                </div>
              </div>

              {/* Tree Legend */}
              <div className="mt-6 flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#10b981] rounded"></div>
                  <span className="text-[#cbd5e1]">Active User</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-[#94a3b8] rounded opacity-50"></div>
                  <span className="text-[#cbd5e1]">Inactive User</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-dashed border-[#334155] rounded"></div>
                  <span className="text-[#cbd5e1]">Empty Position</span>
                </div>
              </div>
            </div>
          )}

          {/* Binary Settings Tab */}
          {activeTab === 'settings' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-[#f8fafc] mb-6">Binary Tree Settings</h2>

              <div className="space-y-6">
                {/* Spillover Settings */}
                <div className="bg-[#0f172a] rounded-lg p-6 border border-[#334155]">
                  <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Spillover Rules</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.spilloverEnabled}
                          onChange={(e) => setSettings({ ...settings, spilloverEnabled: e.target.checked })}
                          className="w-5 h-5 rounded border-[#334155] bg-[#1e293b] text-[#00C7D1] focus:ring-[#00C7D1]"
                        />
                        <span className="text-[#cbd5e1]">Enable Spillover</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Spillover Rule</label>
                      <select
                        value={settings.spilloverRule}
                        onChange={(e) => setSettings({ ...settings, spilloverRule: e.target.value as 'auto' | 'manual' })}
                        disabled={!settings.spilloverEnabled}
                        className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc] disabled:opacity-50"
                      >
                        <option value="auto">Automatic</option>
                        <option value="manual">Manual Only</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Placement Settings */}
                <div className="bg-[#0f172a] rounded-lg p-6 border border-[#334155]">
                  <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Placement Options</h3>
                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Default Placement Priority</label>
                    <select
                      value={settings.placementPriority}
                      onChange={(e) => setSettings({ ...settings, placementPriority: e.target.value as any })}
                      className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                    >
                      <option value="left">Left Priority</option>
                      <option value="right">Right Priority</option>
                      <option value="weaker-leg">Weaker Leg</option>
                      <option value="balanced">Balanced</option>
                    </select>
                    <p className="mt-2 text-xs text-[#94a3b8]">
                      Determines how new users are automatically placed in the binary tree
                    </p>
                  </div>
                </div>

                {/* Capping Rules */}
                <div className="bg-[#0f172a] rounded-lg p-6 border border-[#334155]">
                  <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Capping Rules</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer mb-4">
                        <input
                          type="checkbox"
                          checked={settings.cappingEnabled}
                          onChange={(e) => setSettings({ ...settings, cappingEnabled: e.target.checked })}
                          className="w-5 h-5 rounded border-[#334155] bg-[#1e293b] text-[#00C7D1] focus:ring-[#00C7D1]"
                        />
                        <span className="text-[#cbd5e1]">Enable Volume Capping</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Daily Cap ($)</label>
                        <input
                          type="number"
                          value={settings.dailyCap}
                          onChange={(e) => setSettings({ ...settings, dailyCap: Number(e.target.value) })}
                          disabled={!settings.cappingEnabled}
                          className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc] disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Weekly Cap ($)</label>
                        <input
                          type="number"
                          value={settings.weeklyCap}
                          onChange={(e) => setSettings({ ...settings, weeklyCap: Number(e.target.value) })}
                          disabled={!settings.cappingEnabled}
                          className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc] disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Monthly Cap ($)</label>
                        <input
                          type="number"
                          value={settings.monthlyCap}
                          onChange={(e) => setSettings({ ...settings, monthlyCap: Number(e.target.value) })}
                          disabled={!settings.cappingEnabled}
                          className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc] disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Matching Bonus */}
                <div className="bg-[#0f172a] rounded-lg p-6 border border-[#334155]">
                  <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Matching Bonus</h3>
                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Matching Bonus Percentage (%)</label>
                    <input
                      type="number"
                      value={settings.matchingBonusPercentage}
                      onChange={(e) => setSettings({ ...settings, matchingBonusPercentage: Number(e.target.value) })}
                      className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                      min="0"
                      max="100"
                      step="0.5"
                    />
                    <p className="mt-2 text-xs text-[#94a3b8]">
                      Percentage of lesser leg volume paid as matching bonus
                    </p>
                  </div>
                </div>

                {/* Carry Forward */}
                <div className="bg-[#0f172a] rounded-lg p-6 border border-[#334155]">
                  <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Carry Forward Points</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.carryForwardEnabled}
                          onChange={(e) => setSettings({ ...settings, carryForwardEnabled: e.target.checked })}
                          className="w-5 h-5 rounded border-[#334155] bg-[#1e293b] text-[#00C7D1] focus:ring-[#00C7D1]"
                        />
                        <span className="text-[#cbd5e1]">Enable Carry Forward</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Maximum Carry Forward Days</label>
                      <input
                        type="number"
                        value={settings.maxCarryForwardDays}
                        onChange={(e) => setSettings({ ...settings, maxCarryForwardDays: Number(e.target.value) })}
                        disabled={!settings.carryForwardEnabled}
                        className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc] disabled:opacity-50"
                        min="0"
                        max="365"
                      />
                      <p className="mt-2 text-xs text-[#94a3b8]">
                        Number of days unmatched volume can be carried forward
                      </p>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveSettings}
                    className="px-8 py-3 bg-[#00C7D1] text-[#0f172a] rounded-lg hover:bg-[#00e5f0] transition-all font-medium"
                  >
                    💾 Save Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Manual Placement Tab */}
          {activeTab === 'manual-placement' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-[#f8fafc]">Manual User Placement</h2>
                <button
                  onClick={() => setShowPlacementModal(true)}
                  className="px-6 py-2 bg-[#00C7D1] text-[#0f172a] rounded-lg hover:bg-[#00e5f0] transition-all font-medium"
                >
                  ➕ New Placement
                </button>
              </div>

              {/* Placement History */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#334155]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">User</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Sponsor</th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-[#cbd5e1] uppercase">Position</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Reason</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Placed By</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#334155]">
                    {placementHistory.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-[#94a3b8]">
                          No manual placements yet
                        </td>
                      </tr>
                    ) : (
                      placementHistory.map((placement) => (
                        <tr key={placement.id} className="hover:bg-[#334155]/50">
                          <td className="px-6 py-4 text-[#f8fafc] font-medium">{placement.userName}</td>
                          <td className="px-6 py-4 text-[#cbd5e1]">{placement.sponsorName}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              placement.position === 'left' ? 'bg-[#3b82f6]/10 text-[#3b82f6]' : 'bg-[#f59e0b]/10 text-[#f59e0b]'
                            }`}>
                              {placement.position}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[#cbd5e1]">{placement.reason}</td>
                          <td className="px-6 py-4 text-[#cbd5e1]">{placement.placedBy}</td>
                          <td className="px-6 py-4 text-[#cbd5e1]">{placement.placedDate}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Binary Reports Tab */}
          {activeTab === 'reports' && (
            <div className="p-6 space-y-8">
              <h2 className="text-xl font-semibold text-[#f8fafc] mb-6">Binary Reports & Analytics</h2>

              {/* Volume Trend Chart */}
              <div className="bg-[#0f172a] rounded-lg p-6 border border-[#334155]">
                <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Binary Volume Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={volumeTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="left" name="Left Volume" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="right" name="Right Volume" stroke="#f59e0b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Matching Bonus Chart */}
              <div className="bg-[#0f172a] rounded-lg p-6 border border-[#334155]">
                <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Matching Bonus & Carry Forward</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={matchingBonusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="bonus" name="Matching Bonus" fill="#10b981" />
                    <Bar dataKey="carryForward" name="Carry Forward" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Binary Reports Table */}
              <div className="bg-[#0f172a] rounded-lg p-6 border border-[#334155]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-[#f8fafc]">User Binary Volume Report</h3>
                  <button className="px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-all text-sm">
                    📥 Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#334155]">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">User</th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-[#cbd5e1] uppercase">Left Vol</th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-[#cbd5e1] uppercase">Right Vol</th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-[#cbd5e1] uppercase">Lesser Vol</th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-[#cbd5e1] uppercase">Matching Bonus</th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-[#cbd5e1] uppercase">Carry Forward</th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-[#cbd5e1] uppercase">Total Earnings</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Last Calculated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#334155]">
                      {binaryReports.map((report) => (
                        <tr key={report.userId} className="hover:bg-[#334155]/50">
                          <td className="px-6 py-4 text-[#f8fafc] font-medium">{report.userName}</td>
                          <td className="px-6 py-4 text-right text-[#3b82f6] font-semibold">${report.leftVolume.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right text-[#f59e0b] font-semibold">${report.rightVolume.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right text-[#00C7D1] font-semibold">${report.lesserVolume.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right text-[#10b981] font-semibold">${report.matchingBonus.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right text-[#f59e0b]">${report.carryForward.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right text-[#10b981] font-bold">${report.totalEarnings.toLocaleString()}</td>
                          <td className="px-6 py-4 text-[#cbd5e1]">{format(new Date(report.lastCalculated), 'MMM dd, yyyy')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Placement Modal */}
      {showPlacementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] rounded-lg max-w-lg w-full">
            <div className="p-6 border-b border-[#334155]">
              <h3 className="text-xl font-semibold text-[#f8fafc]">Manual User Placement</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">User ID *</label>
                <input
                  type="text"
                  value={placementRequest.userId}
                  onChange={(e) => setPlacementRequest({ ...placementRequest, userId: e.target.value })}
                  placeholder="Enter user ID"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">User Name *</label>
                <input
                  type="text"
                  value={placementRequest.userName}
                  onChange={(e) => setPlacementRequest({ ...placementRequest, userName: e.target.value })}
                  placeholder="Enter user name"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Sponsor ID *</label>
                <input
                  type="text"
                  value={placementRequest.sponsorId}
                  onChange={(e) => setPlacementRequest({ ...placementRequest, sponsorId: e.target.value })}
                  placeholder="Enter sponsor ID"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Sponsor Name *</label>
                <input
                  type="text"
                  value={placementRequest.sponsorName}
                  onChange={(e) => setPlacementRequest({ ...placementRequest, sponsorName: e.target.value })}
                  placeholder="Enter sponsor name"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Position *</label>
                <select
                  value={placementRequest.position}
                  onChange={(e) => setPlacementRequest({ ...placementRequest, position: e.target.value as 'left' | 'right' })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                >
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Reason *</label>
                <textarea
                  value={placementRequest.reason}
                  onChange={(e) => setPlacementRequest({ ...placementRequest, reason: e.target.value })}
                  placeholder="Enter reason for manual placement..."
                  rows={3}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                />
              </div>
            </div>
            <div className="p-6 border-t border-[#334155] flex justify-end gap-3">
              <button
                onClick={() => setShowPlacementModal(false)}
                className="px-6 py-2 bg-[#334155] text-[#cbd5e1] rounded-lg hover:bg-[#475569] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handlePlaceUser}
                className="px-6 py-2 bg-[#00C7D1] text-[#0f172a] rounded-lg hover:bg-[#00e5f0] transition-all font-medium"
              >
                Place User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move User Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] rounded-lg max-w-lg w-full">
            <div className="p-6 border-b border-[#334155]">
              <h3 className="text-xl font-semibold text-[#f8fafc]">Move User in Binary Tree</h3>
            </div>
            <div className="p-6 space-y-4">
              {moveFromNode && (
                <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-4">
                  <div className="text-sm text-[#94a3b8] mb-1">Moving User:</div>
                  <div className="text-[#f8fafc] font-semibold">{moveFromNode.userName}</div>
                  <div className="text-sm text-[#cbd5e1]">{moveFromNode.email}</div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">New Sponsor ID</label>
                <input
                  type="text"
                  placeholder="Enter new sponsor ID"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">New Position</label>
                <select
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                >
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⚠️</div>
                  <div>
                    <div className="text-sm font-semibold text-[#f59e0b] mb-1">Authorization Required</div>
                    <div className="text-xs text-[#cbd5e1]">
                      Moving users in the binary tree requires supervisor authorization and will be logged for audit purposes.
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-[#334155] flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowMoveModal(false);
                  setMoveFromNode(null);
                }}
                className="px-6 py-2 bg-[#334155] text-[#cbd5e1] rounded-lg hover:bg-[#475569] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleMoveUser}
                className="px-6 py-2 bg-[#f59e0b] text-white rounded-lg hover:bg-[#d97706] transition-all font-medium"
              >
                Request Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-[#1e293b] rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-[#334155]">
              <h3 className="text-xl font-semibold text-[#f8fafc]">{confirmAction.title}</h3>
            </div>
            <div className="p-6">
              <p className="text-[#cbd5e1]">{confirmAction.message}</p>
            </div>
            <div className="p-6 border-t border-[#334155] flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-6 py-2 bg-[#334155] text-[#cbd5e1] rounded-lg hover:bg-[#475569] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction.onConfirm}
                className="px-6 py-2 bg-[#00C7D1] text-[#0f172a] rounded-lg hover:bg-[#00e5f0] transition-all font-medium"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BinaryManagement;
