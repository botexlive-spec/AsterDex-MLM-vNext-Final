import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Badge } from '../../components/ui/DesignSystem';
import { Modal } from '../../components/ui/Modal';
import toast from 'react-hot-toast';

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

// Mock binary tree data
const mockBinaryTree: BinaryNode = {
  id: 'user001',
  name: 'You',
  email: 'you@example.com',
  investment: 10000,
  packageStatus: 'active',
  leftVolume: 45000,
  rightVolume: 38000,
  joinDate: '2024-01-01',
  position: 'root',
  leftChild: {
    id: 'user002',
    name: 'John Doe',
    email: 'john@example.com',
    investment: 5000,
    packageStatus: 'active',
    leftVolume: 12000,
    rightVolume: 8000,
    joinDate: '2024-02-01',
    position: 'left',
    leftChild: {
      id: 'user004',
      name: 'Alice Smith',
      email: 'alice@example.com',
      investment: 3000,
      packageStatus: 'active',
      leftVolume: 3000,
      rightVolume: 2000,
      joinDate: '2024-03-15',
      position: 'left',
    },
    rightChild: {
      id: 'user005',
      name: 'Bob Wilson',
      email: 'bob@example.com',
      investment: 2000,
      packageStatus: 'inactive',
      leftVolume: 0,
      rightVolume: 0,
      joinDate: '2024-03-20',
      position: 'right',
    },
  },
  rightChild: {
    id: 'user003',
    name: 'Jane Williams',
    email: 'jane@example.com',
    investment: 8000,
    packageStatus: 'active',
    leftVolume: 15000,
    rightVolume: 10000,
    joinDate: '2024-02-10',
    position: 'right',
    leftChild: {
      id: 'user006',
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      investment: 4000,
      packageStatus: 'new',
      leftVolume: 0,
      rightVolume: 0,
      joinDate: '2024-10-28',
      position: 'left',
    },
    rightChild: {
      id: 'user007',
      name: 'Diana Prince',
      email: 'diana@example.com',
      investment: 3000,
      packageStatus: 'active',
      leftVolume: 2000,
      rightVolume: 1500,
      joinDate: '2024-04-01',
      position: 'right',
    },
  },
};

const GenealogyNew: React.FC = () => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<BinaryNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [maxLevel, setMaxLevel] = useState(5);
  const [hoveredNode, setHoveredNode] = useState<BinaryNode | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const nodeWidth = 180;
  const nodeHeight = 100;
  const levelHeight = 150;
  const horizontalSpacing = 50;

  // Calculate statistics
  const stats = {
    leftLegVolume: mockBinaryTree.leftVolume,
    rightLegVolume: mockBinaryTree.rightVolume,
    weakerLeg: mockBinaryTree.leftVolume < mockBinaryTree.rightVolume ? 'left' : 'right',
    weakerLegVolume: Math.min(mockBinaryTree.leftVolume, mockBinaryTree.rightVolume),
    totalBinaryPoints: Math.min(mockBinaryTree.leftVolume, mockBinaryTree.rightVolume),
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
    const isRoot = node.id === mockBinaryTree.id;
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
    elements.push(
      <g
        key={`node-${node.id}`}
        transform={`translate(${x - nodeWidth / 2}, ${y})`}
        style={{ cursor: 'pointer', opacity: isFiltered ? 0.3 : 1 }}
        onClick={() => {
          setSelectedNode(node);
          setShowDetailsModal(true);
        }}
        onMouseEnter={() => setHoveredNode(node)}
        onMouseLeave={() => setHoveredNode(null)}
      >
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
          rx="8"
          fill="rgba(0,0,0,0.2)"
        />
        {/* Node background */}
        <rect
          width={nodeWidth}
          height={nodeHeight}
          rx="8"
          fill="#1e293b"
          stroke={borderColor}
          strokeWidth={isRoot ? "3" : "2"}
        />

        {/* Status indicator */}
        <circle
          cx="15"
          cy="15"
          r="6"
          fill={nodeColor}
        />

        {/* User name */}
        <text
          x={nodeWidth / 2}
          y="30"
          textAnchor="middle"
          fill="#f8fafc"
          fontSize="14"
          fontWeight={isRoot ? "bold" : "normal"}
        >
          {node.name}
        </text>

        {/* User ID */}
        <text
          x={nodeWidth / 2}
          y="48"
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="11"
        >
          {node.id}
        </text>

        {/* Investment amount */}
        <text
          x={nodeWidth / 2}
          y="66"
          textAnchor="middle"
          fill="#00C7D1"
          fontSize="13"
          fontWeight="bold"
        >
          ${node.investment.toLocaleString()}
        </text>

        {/* Package status badge */}
        <rect
          x={nodeWidth / 2 - 25}
          y="75"
          width="50"
          height="18"
          rx="9"
          fill={nodeColor}
          fillOpacity="0.2"
        />
        <text
          x={nodeWidth / 2}
          y="87"
          textAnchor="middle"
          fill={nodeColor}
          fontSize="10"
          fontWeight="bold"
        >
          {node.packageStatus.toUpperCase()}
        </text>
      </g>
    );

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
                {renderNode(mockBinaryTree, centerX, initialY, 0, initialOffset)}
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
      </div>
    </div>
  );
};

export default GenealogyNew;
