import React, { memo, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  deepEqual,
  compareChartData,
  throttle,
  sampleChartData,
  chartPerformanceMonitor,
} from '../../utils/chartOptimization';

/**
 * Props comparison function for React.memo
 * Deeply compares data and config props
 */
export const chartPropsAreEqual = (prevProps: any, nextProps: any): boolean => {
  // Quick reference check
  if (prevProps === nextProps) return true;

  // Compare data arrays
  if (prevProps.data !== nextProps.data) {
    if (!compareChartData(prevProps.data, nextProps.data)) {
      return false;
    }
  }

  // Compare config objects
  if (prevProps.config !== nextProps.config) {
    if (!deepEqual(prevProps.config, nextProps.config)) {
      return false;
    }
  }

  // Compare other props
  const propsToCompare = ['width', 'height', 'loading', 'error', 'className'];
  for (const prop of propsToCompare) {
    if (prevProps[prop] !== nextProps[prop]) {
      return false;
    }
  }

  return true;
};

/**
 * Base props for memoized charts
 */
interface MemoizedChartProps {
  data: any[];
  config?: Record<string, any>;
  width?: number | string;
  height?: number | string;
  loading?: boolean;
  error?: string | null;
  className?: string;
  onDataPointClick?: (data: any) => void;
  maxDataPoints?: number; // Auto-sample if data exceeds this
  enablePerformanceMonitoring?: boolean;
  children: (props: {
    data: any[];
    config: Record<string, any>;
    width: number | string;
    height: number | string;
  }) => React.ReactNode;
}

/**
 * Memoized Chart Wrapper
 * Prevents unnecessary re-renders of expensive chart components
 *
 * Usage:
 * <MemoizedChart data={chartData} config={chartConfig}>
 *   {({ data, config }) => <YourChartComponent data={data} {...config} />}
 * </MemoizedChart>
 */
export const MemoizedChart: React.FC<MemoizedChartProps> = memo(
  ({
    data,
    config = {},
    width = '100%',
    height = 300,
    loading = false,
    error = null,
    className = '',
    onDataPointClick,
    maxDataPoints = 1000,
    enablePerformanceMonitoring = false,
    children,
  }) => {
    const startTimeRef = useRef<number>(0);

    // Record render start time
    if (enablePerformanceMonitoring) {
      startTimeRef.current = performance.now();
    }

    // Sample data if it exceeds max points
    const optimizedData = useMemo(() => {
      if (data.length <= maxDataPoints) return data;
      return sampleChartData(data, maxDataPoints);
    }, [data, maxDataPoints]);

    // Memoize config to prevent recreation
    const memoizedConfig = useMemo(() => config, [JSON.stringify(config)]);

    // Throttled click handler
    const handleDataPointClick = useCallback(
      throttle((clickData: any) => {
        onDataPointClick?.(clickData);
      }, 100),
      [onDataPointClick]
    );

    // Record render completion
    useEffect(() => {
      if (enablePerformanceMonitoring && startTimeRef.current > 0) {
        chartPerformanceMonitor.recordRender(startTimeRef.current);
      }
    });

    // Loading state
    if (loading) {
      return (
        <div
          className={`flex items-center justify-center bg-[#334155] rounded-lg ${className}`}
          style={{ width, height }}
        >
          <div className="text-center">
            <svg
              className="animate-spin h-10 w-10 text-[#00C7D1] mx-auto mb-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-[#94a3b8]">Loading chart...</p>
          </div>
        </div>
      );
    }

    // Error state
    if (error) {
      return (
        <div
          className={`flex items-center justify-center bg-[#334155] rounded-lg ${className}`}
          style={{ width, height }}
        >
          <div className="text-center text-[#ef4444] p-6">
            <svg
              className="w-12 h-12 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="font-medium mb-1">Failed to load chart</p>
            <p className="text-sm text-[#94a3b8]">{error}</p>
          </div>
        </div>
      );
    }

    // Empty state
    if (!optimizedData || optimizedData.length === 0) {
      return (
        <div
          className={`flex items-center justify-center bg-[#334155] rounded-lg ${className}`}
          style={{ width, height }}
        >
          <div className="text-center text-[#94a3b8] p-6">
            <svg
              className="w-12 h-12 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p className="font-medium">No data available</p>
          </div>
        </div>
      );
    }

    // Render chart
    return (
      <div className={className}>
        {children({
          data: optimizedData,
          config: {
            ...memoizedConfig,
            onClick: handleDataPointClick,
          },
          width,
          height,
        })}
      </div>
    );
  },
  chartPropsAreEqual
);

MemoizedChart.displayName = 'MemoizedChart';

/**
 * Hook for chart configuration memoization
 */
export const useChartConfig = <T extends Record<string, any>>(
  configFactory: () => T,
  dependencies: any[]
): T => {
  return useMemo(configFactory, dependencies);
};

/**
 * Hook for chart data processing
 */
export const useChartData = <T extends any[]>(
  data: T,
  processor?: (data: T) => T,
  dependencies: any[] = []
): T => {
  return useMemo(() => {
    return processor ? processor(data) : data;
  }, [data, ...dependencies]);
};

/**
 * Hook for responsive chart sizing
 */
export const useChartSize = (containerRef: React.RefObject<HTMLDivElement>) => {
  const [size, setSize] = React.useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [containerRef]);

  return size;
};

/**
 * Example usage component with Recharts-style API
 */
interface LineChartData {
  timestamp: number;
  value: number;
  label?: string;
}

interface OptimizedLineChartProps {
  data: LineChartData[];
  xKey?: string;
  yKey?: string;
  lineColor?: string;
  width?: number | string;
  height?: number | string;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

/**
 * Example of a memoized line chart component
 */
export const OptimizedLineChart: React.FC<OptimizedLineChartProps> = memo(
  ({
    data,
    xKey = 'timestamp',
    yKey = 'value',
    lineColor = '#00C7D1',
    width = '100%',
    height = 300,
    loading = false,
    error = null,
    className = '',
  }) => {
    const config = useChartConfig(
      () => ({
        xKey,
        yKey,
        stroke: lineColor,
        strokeWidth: 2,
      }),
      [xKey, yKey, lineColor]
    );

    return (
      <MemoizedChart
        data={data}
        config={config}
        width={width}
        height={height}
        loading={loading}
        error={error}
        className={className}
        maxDataPoints={500}
      >
        {({ data: chartData, config: chartConfig, width: chartWidth, height: chartHeight }) => (
          // Replace this with your actual chart library component
          <div
            className="bg-[#334155] rounded-lg p-4"
            style={{ width: chartWidth, height: chartHeight }}
          >
            <p className="text-[#94a3b8] text-sm text-center">
              Chart with {chartData.length} data points
            </p>
            <p className="text-[#94a3b8] text-xs text-center mt-2">
              Replace this with your chart library (Recharts, Chart.js, etc.)
            </p>
          </div>
        )}
      </MemoizedChart>
    );
  },
  chartPropsAreEqual
);

OptimizedLineChart.displayName = 'OptimizedLineChart';

export default MemoizedChart;
