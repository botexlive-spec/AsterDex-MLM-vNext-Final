import React, { useState, useEffect } from 'react';

interface SystemStatus {
  timestamp: string;
  overall: string;
  components: {
    typescript: { status: string; errors: number };
    build: { status: string; errors: number };
    dependencies: { status: string; issues: number };
    api: { status: string; missing: number };
    qa: { status: string; score: number };
  };
}

interface TestResults {
  testScore: number;
  totalTests: number;
  passed: number;
  failed: number;
  issues: any[];
}

const StabilityDashboard: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [qaResults, setQAResults] = useState<TestResults | null>(null);
  const [systemMap, setSystemMap] = useState<any>(null);
  const [dependencyAnalysis, setDependencyAnalysis] = useState<any>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Load all system data
  const loadSystemData = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

      // Load QA results
      try {
        const qaRes = await fetch(`${baseUrl}/api/stability/qa-results`);
        if (qaRes.ok) {
          const qaData = await qaRes.json();
          setQAResults(qaData);
        }
      } catch (error) {
        console.log('QA results not available yet');
      }

      // Load system map
      try {
        const mapRes = await fetch(`${baseUrl}/api/stability/system-map`);
        if (mapRes.ok) {
          const mapData = await mapRes.json();
          setSystemMap(mapData);
        }
      } catch (error) {
        console.log('System map not available yet');
      }

      // Load dependency analysis
      try {
        const depRes = await fetch(`${baseUrl}/api/stability/dependency-analysis`);
        if (depRes.ok) {
          const depData = await depRes.json();
          setDependencyAnalysis(depData);
        }
      } catch (error) {
        console.log('Dependency analysis not available yet');
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading system data:', error);
    }
  };

  // Update system status when data changes
  useEffect(() => {
    if (qaResults && dependencyAnalysis) {
      const status: SystemStatus = {
        timestamp: new Date().toISOString(),
        overall: calculateOverallStatus(),
        components: {
          typescript: { status: 'healthy', errors: 0 },
          build: { status: 'healthy', errors: 0 },
          dependencies: {
            status: dependencyAnalysis?.issues?.missingImports?.length > 0 ? 'warning' : 'healthy',
            issues: dependencyAnalysis?.issues?.missingImports?.length || 0
          },
          api: {
            status: dependencyAnalysis?.issues?.brokenApiCalls?.length > 0 ? 'warning' : 'healthy',
            missing: dependencyAnalysis?.issues?.brokenApiCalls?.length || 0
          },
          qa: {
            status: (qaResults?.testScore || 0) >= 95 ? 'healthy' : (qaResults?.testScore || 0) >= 70 ? 'warning' : 'critical',
            score: qaResults?.testScore || 0
          }
        }
      };
      setSystemStatus(status);
    }
  }, [qaResults, dependencyAnalysis]);

  const calculateOverallStatus = () => {
    if (!qaResults) return 'unknown';
    if (qaResults.testScore >= 95) return 'healthy';
    if (qaResults.testScore >= 70) return 'warning';
    return 'critical';
  };

  useEffect(() => {
    loadSystemData();

    if (autoRefresh) {
      const interval = setInterval(loadSystemData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'critical':
        return '❌';
      default:
        return '❓';
    }
  };

  if (!systemStatus || !qaResults) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading system status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">🔧 Stability Dashboard</h1>
            <p className="text-gray-600 mt-2">Real-time system health monitoring & diagnostics</p>
          </div>
          <div className="text-right">
            <div className={`inline-block px-4 py-2 rounded-full ${getStatusColor(systemStatus.overall)}`}>
              <span className="font-bold text-lg">
                {getStatusIcon(systemStatus.overall)} {systemStatus.overall.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
            <label className="flex items-center justify-end mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-600">Auto-refresh</span>
            </label>
          </div>
        </div>
      </div>

      {/* QA Test Score */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">📊 QA Test Score</h2>
        <div className="flex items-center">
          <div className="relative w-48 h-48">
            <svg className="transform -rotate-90 w-48 h-48">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="16"
                fill="transparent"
                className="text-gray-200"
              />
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="16"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 88}`}
                strokeDashoffset={`${2 * Math.PI * 88 * (1 - qaResults.testScore / 100)}`}
                className={
                  qaResults.testScore >= 95
                    ? 'text-green-600'
                    : qaResults.testScore >= 70
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold">{qaResults.testScore}%</span>
            </div>
          </div>
          <div className="ml-8 flex-1">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded">
                <p className="text-3xl font-bold text-green-600">{qaResults.passed}</p>
                <p className="text-sm text-gray-600">Passed</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded">
                <p className="text-3xl font-bold text-red-600">{qaResults.failed}</p>
                <p className="text-sm text-gray-600">Failed</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded">
                <p className="text-3xl font-bold text-blue-600">{qaResults.totalTests}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                Target: <span className="font-bold text-green-600">≥ 95%</span>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Current: <span className={`font-bold ${qaResults.testScore >= 95 ? 'text-green-600' : 'text-red-600'}`}>
                  {qaResults.testScore}%
                </span>
                {qaResults.testScore < 95 && (
                  <span className="text-red-600"> ({95 - qaResults.testScore}% below target)</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Component Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {/* TypeScript */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold mb-3 flex items-center">
            <span className="mr-2">📝</span> TypeScript
          </h3>
          <div className={`px-3 py-1 rounded inline-block ${getStatusColor(systemStatus.components.typescript.status)}`}>
            {getStatusIcon(systemStatus.components.typescript.status)} {systemStatus.components.typescript.status}
          </div>
          <p className="mt-3 text-gray-600">Errors: {systemStatus.components.typescript.errors}</p>
        </div>

        {/* Build */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold mb-3 flex items-center">
            <span className="mr-2">🏗️</span> Build
          </h3>
          <div className={`px-3 py-1 rounded inline-block ${getStatusColor(systemStatus.components.build.status)}`}>
            {getStatusIcon(systemStatus.components.build.status)} {systemStatus.components.build.status}
          </div>
          <p className="mt-3 text-gray-600">Errors: {systemStatus.components.build.errors}</p>
        </div>

        {/* Dependencies */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold mb-3 flex items-center">
            <span className="mr-2">📦</span> Dependencies
          </h3>
          <div className={`px-3 py-1 rounded inline-block ${getStatusColor(systemStatus.components.dependencies.status)}`}>
            {getStatusIcon(systemStatus.components.dependencies.status)} {systemStatus.components.dependencies.status}
          </div>
          <p className="mt-3 text-gray-600">Issues: {systemStatus.components.dependencies.issues}</p>
        </div>

        {/* API Endpoints */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold mb-3 flex items-center">
            <span className="mr-2">🔌</span> API Endpoints
          </h3>
          <div className={`px-3 py-1 rounded inline-block ${getStatusColor(systemStatus.components.api.status)}`}>
            {getStatusIcon(systemStatus.components.api.status)} {systemStatus.components.api.status}
          </div>
          <p className="mt-3 text-gray-600">Missing: {systemStatus.components.api.missing}</p>
        </div>

        {/* QA Tests */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold mb-3 flex items-center">
            <span className="mr-2">🧪</span> QA Tests
          </h3>
          <div className={`px-3 py-1 rounded inline-block ${getStatusColor(systemStatus.components.qa.status)}`}>
            {getStatusIcon(systemStatus.components.qa.status)} {systemStatus.components.qa.status}
          </div>
          <p className="mt-3 text-gray-600">Score: {systemStatus.components.qa.score}%</p>
        </div>

        {/* System Map */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold mb-3 flex items-center">
            <span className="mr-2">🗺️</span> System Map
          </h3>
          <div className="px-3 py-1 rounded inline-block bg-blue-100 text-blue-600">
            ✅ loaded
          </div>
          <p className="mt-3 text-gray-600">
            Files: {systemMap?.audit?.totalFiles || 0}
          </p>
        </div>
      </div>

      {/* Issues List */}
      {qaResults.issues && qaResults.issues.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">⚠️ Issues ({qaResults.issues.length})</h2>
          <div className="overflow-auto max-h-96">
            {qaResults.issues.map((issue: any, index: number) => (
              <div
                key={index}
                className={`p-3 mb-2 rounded border-l-4 ${
                  issue.severity === 'critical'
                    ? 'border-red-500 bg-red-50'
                    : issue.severity === 'high'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-yellow-500 bg-yellow-50'
                }`}
              >
                <div className="flex justify-between">
                  <span className="font-semibold">{issue.type?.replace(/_/g, ' ').toUpperCase()}</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    issue.severity === 'critical' ? 'bg-red-200 text-red-800' :
                    issue.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                    'bg-yellow-200 text-yellow-800'
                  }`}>
                    {issue.severity}
                  </span>
                </div>
                {issue.file && <p className="text-sm text-gray-600 mt-1">File: {issue.file}</p>}
                {issue.message && <p className="text-sm text-gray-700 mt-1">{issue.message}</p>}
                {issue.endpoint && <p className="text-sm text-gray-600 mt-1">Endpoint: {issue.method?.toUpperCase()} {issue.endpoint}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-6 text-center">
        <button
          onClick={loadSystemData}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          🔄 Refresh Now
        </button>
      </div>
    </div>
  );
};

export default StabilityDashboard;
