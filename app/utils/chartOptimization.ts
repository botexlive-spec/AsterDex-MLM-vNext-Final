/**
 * Chart Optimization Utilities
 * Utilities for preventing unnecessary chart re-renders
 */

/**
 * Deep equality check for objects and arrays
 * Specifically optimized for chart data structures
 */
export const deepEqual = (obj1: any, obj2: any): boolean => {
  // Same reference
  if (obj1 === obj2) return true;

  // Null or undefined check
  if (obj1 == null || obj2 == null) return false;

  // Type check
  if (typeof obj1 !== typeof obj2) return false;

  // Primitive types
  if (typeof obj1 !== 'object') return obj1 === obj2;

  // Array check
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) return false;
    return obj1.every((item, index) => deepEqual(item, obj2[index]));
  }

  // Array vs Object mismatch
  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;

  // Object comparison
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  return keys1.every((key) => deepEqual(obj1[key], obj2[key]));
};

/**
 * Shallow comparison for chart props
 * Faster than deep comparison for simple props
 */
export const shallowEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return obj1 === obj2;
  if (obj1 == null || obj2 == null) return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  return keys1.every((key) => obj1[key] === obj2[key]);
};

/**
 * Compares chart data arrays specifically
 * Optimized for typical chart data structures
 */
export const compareChartData = (data1: any[], data2: any[]): boolean => {
  if (data1 === data2) return true;
  if (data1.length !== data2.length) return false;

  // For large datasets, do a quick check on first, middle, and last items
  if (data1.length > 100) {
    const midIndex = Math.floor(data1.length / 2);
    return (
      deepEqual(data1[0], data2[0]) &&
      deepEqual(data1[midIndex], data2[midIndex]) &&
      deepEqual(data1[data1.length - 1], data2[data1.length - 1])
    );
  }

  // For smaller datasets, do full comparison
  return data1.every((item, index) => deepEqual(item, data2[index]));
};

/**
 * Memoizes chart configuration objects
 * Prevents recreation of config objects on every render
 */
export const memoizeChartConfig = <T extends Record<string, any>>(
  config: T,
  dependencies: any[]
): T => {
  // This is a helper that should be used with useMemo
  // The actual memoization happens in the component
  return config;
};

/**
 * Throttles chart updates for real-time data
 * Prevents excessive re-renders when data updates frequently
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;

  return (...args: Parameters<T>) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(
        () => {
          func(...args);
          lastExecTime = Date.now();
        },
        delay - (currentTime - lastExecTime)
      );
    }
  };
};

/**
 * Debounces chart updates
 * Useful for charts that update based on user input
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Samples data for large datasets
 * Reduces the number of data points for better performance
 */
export const sampleChartData = <T extends Record<string, any>>(
  data: T[],
  maxPoints: number = 100
): T[] => {
  if (data.length <= maxPoints) return data;

  const step = Math.ceil(data.length / maxPoints);
  const sampled: T[] = [];

  for (let i = 0; i < data.length; i += step) {
    sampled.push(data[i]);
  }

  // Always include the last point
  if (sampled[sampled.length - 1] !== data[data.length - 1]) {
    sampled.push(data[data.length - 1]);
  }

  return sampled;
};

/**
 * Aggregates data points for time-series charts
 * Useful for reducing granularity of large datasets
 */
export const aggregateTimeSeriesData = <T extends { timestamp: number; value: number }>(
  data: T[],
  bucketSize: number = 60000 // 1 minute default
): Array<{ timestamp: number; value: number; count: number }> => {
  if (data.length === 0) return [];

  const buckets = new Map<number, { sum: number; count: number }>();

  data.forEach((point) => {
    const bucketTime = Math.floor(point.timestamp / bucketSize) * bucketSize;
    const bucket = buckets.get(bucketTime) || { sum: 0, count: 0 };

    bucket.sum += point.value;
    bucket.count += 1;

    buckets.set(bucketTime, bucket);
  });

  return Array.from(buckets.entries())
    .map(([timestamp, { sum, count }]) => ({
      timestamp,
      value: sum / count, // Average
      count,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
};

/**
 * Calculates optimal number of data points based on container width
 */
export const calculateOptimalDataPoints = (
  containerWidth: number,
  pixelsPerPoint: number = 5
): number => {
  return Math.floor(containerWidth / pixelsPerPoint);
};

/**
 * Formats large numbers for chart labels
 */
export const formatChartNumber = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Creates a stable reference for chart callbacks
 * Prevents unnecessary re-renders due to callback reference changes
 */
export const createStableCallback = <T extends (...args: any[]) => any>(
  callback: T,
  dependencies: any[]
): T => {
  // This is meant to be used with useCallback
  return callback;
};

/**
 * Optimizes chart color arrays by caching
 */
const colorCache = new Map<string, string[]>();

export const getChartColors = (
  colorScheme: 'default' | 'blue' | 'green' | 'purple' | 'mixed',
  count: number
): string[] => {
  const cacheKey = `${colorScheme}-${count}`;

  if (colorCache.has(cacheKey)) {
    return colorCache.get(cacheKey)!;
  }

  const colorSchemes = {
    default: ['#00C7D1', '#00e5f0', '#00a8b0', '#008a90', '#006c70'],
    blue: ['#3b82f6', '#60a5fa', '#2563eb', '#1d4ed8', '#1e40af'],
    green: ['#10b981', '#34d399', '#059669', '#047857', '#065f46'],
    purple: ['#8b5cf6', '#a78bfa', '#7c3aed', '#6d28d9', '#5b21b6'],
    mixed: ['#00C7D1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
  };

  const baseColors = colorSchemes[colorScheme] || colorSchemes.default;
  const colors: string[] = [];

  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }

  colorCache.set(cacheKey, colors);
  return colors;
};

/**
 * Performance monitoring for chart renders
 */
export class ChartPerformanceMonitor {
  private renderTimes: number[] = [];
  private maxSamples: number = 100;

  recordRender(startTime: number): void {
    const renderTime = performance.now() - startTime;
    this.renderTimes.push(renderTime);

    if (this.renderTimes.length > this.maxSamples) {
      this.renderTimes.shift();
    }
  }

  getAverageRenderTime(): number {
    if (this.renderTimes.length === 0) return 0;
    const sum = this.renderTimes.reduce((acc, time) => acc + time, 0);
    return sum / this.renderTimes.length;
  }

  getMaxRenderTime(): number {
    if (this.renderTimes.length === 0) return 0;
    return Math.max(...this.renderTimes);
  }

  reset(): void {
    this.renderTimes = [];
  }

  getStats(): {
    average: number;
    max: number;
    samples: number;
  } {
    return {
      average: this.getAverageRenderTime(),
      max: this.getMaxRenderTime(),
      samples: this.renderTimes.length,
    };
  }
}

export const chartPerformanceMonitor = new ChartPerformanceMonitor();
