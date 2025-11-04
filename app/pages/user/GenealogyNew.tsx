import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Badge } from '../../components/ui/DesignSystem';
import { Modal } from '../../components/ui/Modal';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getBinaryTree } from '../../services/mlm.service';

// Binary tree node interface
interface BinaryNode {
  id: string;
  name: string;
  email: string;
  investment: number;
  packageStatus: 'active' | 'inactive' | 'new';
  leftVolume: number;
  rightVolume: number;
  joinDate: string;
  leftChild?: BinaryNode;
  rightChild?: BinaryNode;
  position: 'left' | 'right' | 'root';
}

const GenealogyNew: React.FC = () => {
  const { user } = useAuth();
  const [binaryTree, setBinaryTree] = useState<BinaryNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<BinaryNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [maxLevel, setMaxLevel] = useState(5);
  const [hoveredNode, setHoveredNode] = useState<BinaryNode | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedParent, setSelectedParent] = useState<{ node: BinaryNode; position: 'left' | 'right' } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Fetch binary tree data
  useEffect(() => {
    const fetchBinaryTree = async () => {
      if (!user?.id) {
        console.log('⚠️ No user ID available for binary tree');
        return;
      }

      console.log('🌳 Fetching binary tree for user:', user.email, 'ID:', user.id);
      setLoading(true);
      try {
        // Add 10-second timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timed out after 10 seconds')), 10000)
        );

        const treePromise = getBinaryTree(user.id, maxLevel);

        const treeData = await Promise.race([treePromise, timeoutPromise]);
        console.log('✅ Binary tree data received:', treeData);

        // Transform the data to match the BinaryNode interface
        const transformNode = (node: any): BinaryNode | undefined => {
          if (!node) return undefined;

          return {
            id: node.user_id || node.id,
            name: node.full_name || node.name || 'Unknown',
            email: node.email || '',
            investment: node.total_investment || 0,
            packageStatus: 'active', // You can determine this from the data
            leftVolume: node.left_volume || 0,
            rightVolume: node.right_volume || 0,
            joinDate: node.created_at || new Date().toISOString(),
            position: node.position || 'root',
            leftChild: node.children?.[0] ? transformNode(node.children[0]) : undefined,
            rightChild: node.children?.[1] ? transformNode(node.children[1]) : undefined,
          };
        };

        const transformedTree = transformNode(treeData);
        setBinaryTree(transformedTree || null);
      } catch (error: any) {
        console.error('❌ Error fetching binary tree:', error);
        toast.error(error.message || 'Failed to load binary tree');
        setBinaryTree(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBinaryTree();
  }, [user?.id, maxLevel]);

  const nodeWidth = 200;
  const nodeHeight = 120;
  const levelHeight = 180;
  const horizontalSpacing = 60;

  // Calculate statistics
  const stats = {
    leftLegVolume: binaryTree?.leftVolume || 0,
    rightLegVolume: binaryTree?.rightVolume || 0,
    weakerLeg: (binaryTree?.leftVolume || 0) < (binaryTree?.rightVolume || 0) ? 'left' : 'right',
    weakerLegVolume: Math.min(binaryTree?.leftVolume || 0, binaryTree?.rightVolume || 0),
    totalBinaryPoints: Math.min(binaryTree?.leftVolume || 0, binaryTree?.rightVolume || 0),
    matchingBonusToday: 250,
    matchingBonusWeek: 1500,
    matchingBonusMonth: 5800,
    matchingBonusTotal: 28500,
    carryForward: 7000,
    nextMatchingDate: '2024-11-01',
  };

  // Get node color based on status
  const getNodeColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'inactive':
        return '#6b7280';
      case 'new':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  // Get node border color
  const getNodeBorderColor = (status: string, isRoot: boolean) => {
    if (isRoot) return '#00C7D1';
    return getNodeColor(status);
  };

  // Count nodes at each level
  const countNodesAtLevel = (node: BinaryNode | undefined, level: number): number => {
    if (!node || level < 0) return 0;
    if (level === 0) return 1;
    return countNodesAtLevel(node.leftChild, level - 1) + countNodesAtLevel(node.rightChild, level - 1);
  };

  // Calculate tree width
  const calculateTreeWidth = (level: number): number => {
    const nodesAtLevel = Math.pow(2, level);
    return nodesAtLevel * nodeWidth + (nodesAtLevel - 1) * horizontalSpacing;
  };

  // Check if node matches filters/search
  const nodeMatchesFilters = (node: BinaryNode): boolean => {
    // Check status filter
    if (filterStatus !== 'all' && node.packageStatus !== filterStatus) {
      return false;
    }

    // Check search filter
    if (searchTerm &&
        !node.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !node.email.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !node.id.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  };

  // Render binary tree nodes recursively
  const renderNode = (
    node: BinaryNode | undefined,
    x: number,
    y: number,
    level: number,
    offset: number
  ): JSX.Element[] => {
    if (!node || level > maxLevel) return [];

    const elements: JSX.Element[] = [];
    const isRoot = node.id === binaryTree?.id;
    const nodeColor = getNodeColor(node.packageStatus);
    const borderColor = getNodeBorderColor(node.packageStatus, isRoot);
    const matchesFilters = nodeMatchesFilters(node);
    const isFiltered = !matchesFilters;

    // Draw connecting lines to children
    if (node.leftChild && level < maxLevel) {
      const childX = x - offset / 2;
      const childY = y + levelHeight;
      elements.push(
        <line
          key={`line-left-${node.id}`}
          x1={x}
          y1={y + nodeHeight}
          x2={childX}
          y2={childY}
          stroke="#475569"
          strokeWidth="2"
        />
      );
    }

    if (node.rightChild && level < maxLevel) {
      const childX = x + offset / 2;
      const childY = y + levelHeight;
      elements.push(
        <line
          key={`line-right-${node.id}`}
          x1={x}
          y1={y + nodeHeight}
          x2={childX}
          y2={childY}
          stroke="#475569"
          strokeWidth="2"
        />
      );
    }

    // Draw node
    const hasLeftChild = !!node.leftChild;
    const hasRightChild = !!node.rightChild;

    elements.push(
      <g key={`node-${node.id}`} transform={`translate(${x - nodeWidth / 2}, ${y})`}>
        {/* Highlight border for matching nodes */}
        {matchesFilters && (searchTerm || filterStatus !== 'all') && (
          <rect
            x="-5"
            y="-5"
            width={nodeWidth + 10}
            height={nodeHeight + 10}
            rx="12"
            fill="none"
            stroke="#00C7D1"
            strokeWidth="3"
            opacity="0.6"
          >
            <animate
              attributeName="opacity"
              values="0.6;1;0.6"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </rect>
        )}

        {/* Node shadow */}
        <rect
          x="3"
          y="3"
          width={nodeWidth}
          height={nodeHeight}
          rx="12"
          fill="rgba(0,0,0,0.3)"
        />

        {/* Node background gradient */}
        <defs>
          <linearGradient id={`gradient-${node.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isRoot ? "#1e293b" : "#1e293b"} />
            <stop offset="100%" stopColor={isRoot ? "#0f172a" : "#0f172a"} />
          </linearGradient>
        </defs>

        <rect
          width={nodeWidth}
          height={nodeHeight}
          rx="12"
          fill={`url(#gradient-${node.id})`}
          stroke={borderColor}
          strokeWidth={isRoot ? "3" : "2"}
          style={{ cursor: 'pointer', opacity: isFiltered ? 0.3 : 1 }}
          onClick={() => {
            setSelectedNode(node);
            setShowDetailsModal(true);
          }}
          onMouseEnter={() => setHoveredNode(node)}
          onMouseLeave={() => setHoveredNode(null)}
        />

        {/* Status indicator with glow */}
        <circle
          cx="15"
          cy="15"
          r="8"
          fill={nodeColor}
          filter="url(#glow)"
        />
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* User name */}
        <text
          x={nodeWidth / 2}
          y="32"
          textAnchor="middle"
          fill="#f8fafc"
          fontSize="15"
          fontWeight={isRoot ? "bold" : "600"}
          style={{ cursor: 'pointer' }}
          onClick={() => {
            setSelectedNode(node);
            setShowDetailsModal(true);
          }}
        >
          {node.name.length > 16 ? node.name.substring(0, 14) + '...' : node.name}
        </text>

        {/* Email */}
        <text
          x={nodeWidth / 2}
          y="50"
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="10"
        >
          {node.email.length > 20 ? node.email.substring(0, 18) + '...' : node.email}
        </text>

        {/* Investment amount */}
        <text
          x={nodeWidth / 2}
          y="72"
          textAnchor="middle"
          fill="#00C7D1"
          fontSize="16"
          fontWeight="bold"
        >
          ${node.investment.toLocaleString()}
        </text>

        {/* Volume badges */}
        <g transform="translate(10, 85)">
          <rect width="35" height="16" rx="8" fill="#10b981" fillOpacity="0.2" />
          <text x="18" y="12" textAnchor="middle" fill="#10b981" fontSize="9" fontWeight="bold">
            L: {node.leftVolume > 1000 ? (node.leftVolume / 1000).toFixed(0) + 'K' : node.leftVolume}
          </text>
        </g>

        <g transform={`translate(${nodeWidth - 45}, 85)`}>
          <rect width="35" height="16" rx="8" fill="#3b82f6" fillOpacity="0.2" />
          <text x="18" y="12" textAnchor="middle" fill="#3b82f6" fontSize="9" fontWeight="bold">
            R: {node.rightVolume > 1000 ? (node.rightVolume / 1000).toFixed(0) + 'K' : node.rightVolume}
          </text>
        </g>

        {/* Package status badge */}
        <rect
          x={nodeWidth / 2 - 30}
          y="105"
          width="60"
          height="12"
          rx="6"
          fill={nodeColor}
          fillOpacity="0.3"
        />
        <text
          x={nodeWidth / 2}
          y="114"
          textAnchor="middle"
          fill={nodeColor}
          fontSize="9"
          fontWeight="bold"
        >
          {node.packageStatus.toUpperCase()}
        </text>
      </g>
    );

    // Add placement buttons (Left button)
    if (!hasLeftChild && level < maxLevel) {
      elements.push(
        <g
          key={`add-left-${node.id}`}
          transform={`translate(${x - nodeWidth / 2 - 35}, ${y + nodeHeight + 15})`}
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedParent({ node, position: 'left' });
            setShowAddUserModal(true);
          }}
        >
          <circle
            cx="15"
            cy="15"
            r="15"
            fill="#10b981"
            stroke="#059669"
            strokeWidth="2"
          >
            <animate
              attributeName="opacity"
              values="1;0.7;1"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          <text
            x="15"
            y="21"
            textAnchor="middle"
            fill="white"
            fontSize="20"
            fontWeight="bold"
          >
            +
          </text>
          <text
            x="15"
            y="40"
            textAnchor="middle"
            fill="#10b981"
            fontSize="10"
            fontWeight="bold"
          >
            Left
          </text>
        </g>
      );
    }

    // Add placement buttons (Right button)
    if (!hasRightChild && level < maxLevel) {
      elements.push(
        <g
          key={`add-right-${node.id}`}
          transform={`translate(${x + nodeWidth / 2 + 5}, ${y + nodeHeight + 15})`}
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedParent({ node, position: 'right' });
            setShowAddUserModal(true);
          }}
        >
          <circle
            cx="15"
            cy="15"
            r="15"
            fill="#3b82f6"
            stroke="#2563eb"
            strokeWidth="2"
          >
            <animate
              attributeName="opacity"
              values="1;0.7;1"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          <text
            x="15"
            y="21"
            textAnchor="middle"
            fill="white"
            fontSize="20"
            fontWeight="bold"
          >
            +
          </text>
          <text
            x="15"
            y="40"
            textAnchor="middle"
            fill="#3b82f6"
            fontSize="10"
            fontWeight="bold"
          >
            Right
          </text>
        </g>
      );
    }

    // Render children
    if (level < maxLevel) {
      const nextOffset = offset / 2;
      elements.push(...renderNode(node.leftChild, x - offset / 2, y + levelHeight, level + 1, nextOffset));
      elements.push(...renderNode(node.rightChild, x + offset / 2, y + levelHeight, level + 1, nextOffset));
    }

    return elements;
  };

  // Handle zoom
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Handle pan
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // SVG dimensions
  const svgWidth = 1200;
  const svgHeight = (maxLevel + 1) * levelHeight + 100;
  const centerX = svgWidth / 2;
  const initialY = 50;
  const initialOffset = calculateTreeWidth(maxLevel - 1) / 2;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#00C7D1] mx-auto mb-4"></div>
              <p className="text-[#cbd5e1] text-lg font-medium">Loading genealogy tree...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state - no tree data
  if (!binaryTree) {
    return (
      <div className="min-h-screen bg-[#0f172a] p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#f8fafc] mb-2">Binary Genealogy</h1>
            <p className="text-[#94a3b8]">Visual representation of your binary network structure</p>
          </div>
          <Card>
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🌳</div>
              <h3 className="text-xl font-bold text-[#f8fafc] mb-2">No Binary Tree Data</h3>
              <p className="text-[#94a3b8]">You don't have any binary tree structure yet. Start building your network!</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#f8fafc] mb-2">Binary Genealogy</h1>
            <p className="text-[#94a3b8]">Visual representation of your binary network structure</p>
          </div>
        </div>

        {/* Quick Guide Banner */}
        <div className="bg-gradient-to-r from-[#00C7D1]/10 via-[#00e5f0]/5 to-[#00C7D1]/10 border border-[#00C7D1]/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💡</div>
            <div className="flex-1">
              <h3 className="text-[#00C7D1] font-bold text-base mb-2">How to Add New Members</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-[#cbd5e1]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#10b981] flex items-center justify-center text-white font-bold text-xs">+</div>
                  <span><strong className="text-[#10b981]">Green +</strong> = Add to Left position</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#3b82f6] flex items-center justify-center text-white font-bold text-xs">+</div>
                  <span><strong className="text-[#3b82f6]">Blue +</strong> = Add to Right position</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🖱️</span>
                  <span>Click node for details</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Leg Statistics */}
          <Card className="bg-gradient-to-br from-[#10b981]/10 to-[#10b981]/5 border-[#10b981]/20">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-[#f8fafc]">Left Leg</h3>
                {stats.weakerLeg === 'left' && (
                  <Badge variant="warning" size="sm">Weaker Leg</Badge>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[#94a3b8]">Total Volume</span>
                  <span className="text-2xl font-bold text-[#10b981]">
                    ${stats.leftLegVolume.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-[#334155] rounded-full h-3">
                  <div
                    className="bg-[#10b981] h-3 rounded-full transition-all"
                    style={{
                      width: `${(stats.leftLegVolume / (stats.leftLegVolume + stats.rightLegVolume)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Right Leg Statistics */}
          <Card className="bg-gradient-to-br from-[#3b82f6]/10 to-[#3b82f6]/5 border-[#3b82f6]/20">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-[#f8fafc]">Right Leg</h3>
                {stats.weakerLeg === 'right' && (
                  <Badge variant="warning" size="sm">Weaker Leg</Badge>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[#94a3b8]">Total Volume</span>
                  <span className="text-2xl font-bold text-[#3b82f6]">
                    ${stats.rightLegVolume.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-[#334155] rounded-full h-3">
                  <div
                    className="bg-[#3b82f6] h-3 rounded-full transition-all"
                    style={{
                      width: `${(stats.rightLegVolume / (stats.leftLegVolume + stats.rightLegVolume)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Binary Matching Statistics */}
        <Card>
          <div className="p-6">
            <h3 className="text-xl font-bold text-[#f8fafc] mb-6">Binary Matching Bonus</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center p-4 bg-[#1e293b] rounded-lg">
                <p className="text-sm text-[#94a3b8] mb-2">Binary Points</p>
                <p className="text-2xl font-bold text-[#00C7D1]">{stats.totalBinaryPoints.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-[#1e293b] rounded-lg">
                <p className="text-sm text-[#94a3b8] mb-2">Today</p>
                <p className="text-2xl font-bold text-[#10b981]">${stats.matchingBonusToday}</p>
              </div>
              <div className="text-center p-4 bg-[#1e293b] rounded-lg">
                <p className="text-sm text-[#94a3b8] mb-2">This Week</p>
                <p className="text-2xl font-bold text-[#10b981]">${stats.matchingBonusWeek.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-[#1e293b] rounded-lg">
                <p className="text-sm text-[#94a3b8] mb-2">This Month</p>
                <p className="text-2xl font-bold text-[#10b981]">${stats.matchingBonusMonth.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-[#1e293b] rounded-lg">
                <p className="text-sm text-[#94a3b8] mb-2">Total Earned</p>
                <p className="text-2xl font-bold text-[#f59e0b]">${stats.matchingBonusTotal.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-[#1e293b] rounded-lg">
                <p className="text-sm text-[#94a3b8] mb-2">Carry Forward</p>
                <p className="text-2xl font-bold text-[#8b5cf6]">${stats.carryForward.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-lg">
              <p className="text-sm text-[#60a5fa]">
                <span className="font-semibold">Next Matching Bonus:</span> {stats.nextMatchingDate}
              </p>
            </div>
          </div>
        </Card>

        {/* Controls and Tree */}
        <Card>
          <div className="p-6">
            {/* Controls */}
            <div className="space-y-4 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search by name, email, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 pr-10 bg-[#1e293b] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#f8fafc]"
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 bg-[#1e293b] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="new">New This Week</option>
                </select>

                {/* Level selector */}
                <select
                  value={maxLevel}
                  onChange={(e) => setMaxLevel(parseInt(e.target.value))}
                  className="px-4 py-2 bg-[#1e293b] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                >
                  <option value="3">Show 3 Levels</option>
                  <option value="5">Show 5 Levels</option>
                  <option value="7">Show 7 Levels</option>
                  <option value="10">Show 10 Levels</option>
                </select>

                {/* Zoom controls */}
                <div className="flex gap-2">
                  <Button onClick={handleZoomOut} size="sm" variant="outline" title="Zoom Out">
                    🔍−
                  </Button>
                  <Button onClick={handleResetZoom} size="sm" variant="outline" title="Reset View">
                    ↺
                  </Button>
                  <Button onClick={handleZoomIn} size="sm" variant="outline" title="Zoom In">
                    🔍+
                  </Button>
                </div>
              </div>

              {/* Active Filters Indicator */}
              {(searchTerm || filterStatus !== 'all') && (
                <div className="flex items-center gap-3 p-3 bg-[#00C7D1]/10 border border-[#00C7D1]/30 rounded-lg">
                  <span className="text-sm text-[#00C7D1] font-semibold">
                    🔍 Filtering active - Matching nodes are highlighted
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterStatus('all');
                      toast.success('Filters cleared');
                    }}
                    className="ml-auto"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-6 p-4 bg-[#1e293b] rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#10b981]" />
                <span className="text-sm text-[#94a3b8]">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#6b7280]" />
                <span className="text-sm text-[#94a3b8]">Inactive</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#f59e0b]" />
                <span className="text-sm text-[#94a3b8]">New This Week</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-4 border-2 border-[#00C7D1] rounded" />
                <span className="text-sm text-[#94a3b8]">You (Root)</span>
              </div>
              {(searchTerm || filterStatus !== 'all') && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-4 border-2 border-[#00C7D1] rounded animate-pulse" />
                  <span className="text-sm text-[#00C7D1] font-semibold">Matching Filter</span>
                </div>
              )}
            </div>

            {/* Tree Container */}
            <div
              className="relative overflow-auto bg-[#0f172a] rounded-lg border border-[#334155]"
              style={{ height: '600px', cursor: isDragging ? 'grabbing' : 'grab' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <svg
                ref={svgRef}
                width={svgWidth}
                height={svgHeight}
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                }}
              >
                {binaryTree && renderNode(binaryTree, centerX, initialY, 0, initialOffset)}
              </svg>

              {/* Hover Tooltip */}
              {hoveredNode && (
                <div
                  className="absolute top-4 right-4 p-4 bg-[#1e293b] border border-[#00C7D1] rounded-lg shadow-lg z-10"
                  style={{ pointerEvents: 'none' }}
                >
                  <h4 className="text-[#f8fafc] font-bold mb-2">{hoveredNode.name}</h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-[#94a3b8]">ID: {hoveredNode.id}</p>
                    <p className="text-[#94a3b8]">Email: {hoveredNode.email}</p>
                    <p className="text-[#94a3b8]">Joined: {hoveredNode.joinDate}</p>
                    <p className="text-[#00C7D1]">Investment: ${hoveredNode.investment.toLocaleString()}</p>
                    <p className="text-[#10b981]">Left Volume: ${hoveredNode.leftVolume.toLocaleString()}</p>
                    <p className="text-[#3b82f6]">Right Volume: ${hoveredNode.rightVolume.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 text-center text-sm text-[#94a3b8]">
              <p>💡 Tip: Click and drag to pan, use zoom buttons to zoom in/out, click nodes for details</p>
            </div>
          </div>
        </Card>

        {/* Node Details Modal */}
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title="Member Details"
        >
          {selectedNode && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00C7D1] to-[#00e5f0] flex items-center justify-center text-white text-2xl font-bold">
                  {selectedNode.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[#f8fafc]">{selectedNode.name}</h3>
                  <p className="text-[#94a3b8]">{selectedNode.email}</p>
                  <Badge variant={selectedNode.packageStatus === 'active' ? 'success' : 'error'}>
                    {selectedNode.packageStatus.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#1e293b] rounded-lg">
                  <p className="text-sm text-[#94a3b8] mb-1">User ID</p>
                  <p className="text-[#f8fafc] font-semibold">{selectedNode.id}</p>
                </div>
                <div className="p-4 bg-[#1e293b] rounded-lg">
                  <p className="text-sm text-[#94a3b8] mb-1">Join Date</p>
                  <p className="text-[#f8fafc] font-semibold">{selectedNode.joinDate}</p>
                </div>
                <div className="p-4 bg-[#1e293b] rounded-lg">
                  <p className="text-sm text-[#94a3b8] mb-1">Position</p>
                  <p className="text-[#f8fafc] font-semibold">{selectedNode.position.toUpperCase()}</p>
                </div>
                <div className="p-4 bg-[#1e293b] rounded-lg">
                  <p className="text-sm text-[#94a3b8] mb-1">Investment</p>
                  <p className="text-[#00C7D1] font-bold text-xl">${selectedNode.investment.toLocaleString()}</p>
                </div>
              </div>

              {/* Binary Volumes */}
              <div className="space-y-3">
                <h4 className="text-[#f8fafc] font-semibold">Binary Volumes</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#10b981]/10 border border-[#10b981]/30 rounded-lg">
                    <p className="text-sm text-[#94a3b8] mb-1">Left Leg</p>
                    <p className="text-[#10b981] font-bold text-xl">${selectedNode.leftVolume.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-lg">
                    <p className="text-sm text-[#94a3b8] mb-1">Right Leg</p>
                    <p className="text-[#3b82f6] font-bold text-xl">${selectedNode.rightVolume.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    toast.success('Viewing full details for ' + selectedNode.name);
                    setShowDetailsModal(false);
                  }}
                  className="flex-1"
                >
                  View Full Profile
                </Button>
                <Button
                  onClick={() => setShowDetailsModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Add User Modal */}
        <Modal
          isOpen={showAddUserModal}
          onClose={() => {
            setShowAddUserModal(false);
            setSelectedParent(null);
          }}
          title={`Add New Member - ${selectedParent?.position === 'left' ? 'Left' : 'Right'} Position`}
        >
          {selectedParent && (
            <div className="space-y-6">
              {/* Placement Info */}
              <div className="p-4 bg-gradient-to-br from-[#00C7D1]/10 to-[#00e5f0]/5 border border-[#00C7D1]/30 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00C7D1] to-[#00e5f0] flex items-center justify-center text-white text-xl font-bold">
                    {selectedParent.node.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-[#f8fafc] font-semibold">{selectedParent.node.name}</p>
                    <p className="text-[#94a3b8] text-sm">{selectedParent.node.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-[#1e293b] rounded-lg">
                  <div className={`px-3 py-1 rounded-full ${
                    selectedParent.position === 'left' ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#3b82f6]/20 text-[#3b82f6]'
                  }`}>
                    <span className="font-bold text-sm">
                      {selectedParent.position.toUpperCase()} POSITION
                    </span>
                  </div>
                  <span className="text-[#94a3b8] text-sm ml-auto">
                    Parent: {selectedParent.node.name}
                  </span>
                </div>
              </div>

              {/* User Form */}
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const userData = {
                  fullName: formData.get('fullName') as string,
                  email: formData.get('email') as string,
                  phone: formData.get('phone') as string,
                  password: formData.get('password') as string,
                  initialInvestment: parseFloat(formData.get('investment') as string || '0'),
                  parentId: selectedParent.node.id,
                  position: selectedParent.position,
                };

                console.log('Creating new user:', userData);
                toast.success(`User ${userData.fullName} will be added to ${selectedParent.position} position`);

                // TODO: Implement actual user creation via admin service
                // This would call an admin service to create the user with proper binary placement

                setShowAddUserModal(false);
                setSelectedParent(null);
              }}>
                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-[#f8fafc] mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      className="w-full px-4 py-2 bg-[#1e293b] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                      placeholder="John Doe"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-[#f8fafc] mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full px-4 py-2 bg-[#1e293b] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                      placeholder="john@example.com"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-[#f8fafc] mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      className="w-full px-4 py-2 bg-[#1e293b] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                      placeholder="+1 234 567 8900"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-[#f8fafc] mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      required
                      minLength={6}
                      className="w-full px-4 py-2 bg-[#1e293b] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                      placeholder="Min. 6 characters"
                    />
                  </div>

                  {/* Initial Investment */}
                  <div>
                    <label className="block text-sm font-medium text-[#f8fafc] mb-2">
                      Initial Investment (USD)
                    </label>
                    <input
                      type="number"
                      name="investment"
                      min="0"
                      step="0.01"
                      defaultValue="0"
                      className="w-full px-4 py-2 bg-[#1e293b] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Info Box */}
                  <div className="p-4 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg">
                    <p className="text-sm text-[#fbbf24]">
                      <strong>Note:</strong> This user will be placed directly under{' '}
                      <strong>{selectedParent.node.name}</strong> in the{' '}
                      <strong className={selectedParent.position === 'left' ? 'text-[#10b981]' : 'text-[#3b82f6]'}>
                        {selectedParent.position.toUpperCase()}
                      </strong> position.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="flex-1">
                      Create Member
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowAddUserModal(false);
                        setSelectedParent(null);
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default GenealogyNew;
