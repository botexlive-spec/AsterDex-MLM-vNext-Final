# Performance Optimization Guide

This guide explains how to use the performance optimization utilities created for this application.

## Table of Contents

1. [Pagination](#pagination)
2. [Image Optimization](#image-optimization)
3. [API Call Optimization with Caching](#api-call-optimization-with-caching)
4. [Chart Memoization](#chart-memoization)

---

## 1. Pagination

### Components

Located in: `app/components/ui/Pagination.tsx`

#### Pagination Component

The main pagination component with smart ellipsis handling.

**Props:**
- `currentPage`: number - Current active page
- `totalPages`: number - Total number of pages
- `onPageChange`: (page: number) => void - Callback when page changes
- `maxVisible?`: number - Maximum visible page numbers (default: 5)
- `showFirstLast?`: boolean - Show first/last page buttons (default: true)

**Example Usage:**

```typescript
import { Pagination } from '../components/ui/Pagination';

function UserList() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const totalItems = 250;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Paginate your data
  const paginatedData = allData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div>
      {/* Your data display */}
      <table>
        {paginatedData.map(item => (
          <tr key={item.id}>...</tr>
        ))}
      </table>

      {/* Pagination controls */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
```

#### PaginationInfo Component

Shows "Showing X to Y of Z results" information.

**Example:**

```typescript
import { PaginationInfo } from '../components/ui/Pagination';

<PaginationInfo
  currentPage={currentPage}
  pageSize={pageSize}
  totalItems={totalItems}
/>
// Outputs: "Showing 1 to 25 of 250 results"
```

#### PageSizeSelector Component

Dropdown to change number of items per page.

**Example:**

```typescript
import { PageSizeSelector } from '../components/ui/Pagination';

<PageSizeSelector
  pageSize={pageSize}
  onPageSizeChange={setPageSize}
  options={[10, 25, 50, 100]}
/>
```

### Complete Example

```typescript
import React, { useState } from 'react';
import { Pagination, PaginationInfo, PageSizeSelector } from '../components/ui/Pagination';

function UserManagementPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const allUsers = [...]; // Your data
  const totalPages = Math.ceil(allUsers.length / pageSize);
  const paginatedUsers = allUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset to page 1 when page size changes
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  return (
    <div>
      {/* Page size selector */}
      <div className="flex justify-between items-center mb-4">
        <PageSizeSelector
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
        />
        <PaginationInfo
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={allUsers.length}
        />
      </div>

      {/* Your table */}
      <table>
        {paginatedUsers.map(user => (
          <tr key={user.id}>...</tr>
        ))}
      </table>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
```

---

## 2. Image Optimization

### Components and Utilities

Located in:
- `app/components/ui/OptimizedImage.tsx`
- `app/utils/imageOptimization.ts`
- `app/hooks/useImageLoading.ts`

### OptimizedImage Component

Main component for optimized image loading with lazy loading, blur placeholders, and responsive support.

**Props:**
- `src`: string - Image source URL
- `alt`: string - Alt text for accessibility
- `width?`: number - Image width
- `height?`: number - Image height
- `lazy?`: boolean - Enable lazy loading (default: true)
- `priority?`: 'high' | 'low' | 'auto' - Loading priority (default: 'auto')
- `showPlaceholder?`: boolean - Show blur placeholder while loading (default: true)
- `maxDataPoints?`: number - Auto-sample large datasets (default: 1000)

**Example Usage:**

```typescript
import { OptimizedImage } from '../components/ui/OptimizedImage';

// Basic usage
<OptimizedImage
  src="/images/user-avatar.jpg"
  alt="User avatar"
  width={200}
  height={200}
/>

// With lazy loading disabled for above-the-fold content
<OptimizedImage
  src="/images/hero-banner.jpg"
  alt="Hero banner"
  priority="high"
  lazy={false}
/>

// With responsive images
<OptimizedImage
  src="/images/product.jpg"
  alt="Product"
  srcSet="/images/product-320w.jpg 320w, /images/product-640w.jpg 640w"
  sizes="(max-width: 640px) 100vw, 50vw"
/>
```

### Avatar Component

Pre-configured component for user avatars with fallback initials.

```typescript
import { Avatar } from '../components/ui/OptimizedImage';

<Avatar
  src={user.avatarUrl}
  alt={user.name}
  size="md"
  fallback={user.name[0]}
/>
```

### HeroImage Component

For large banner/hero images with optional overlay.

```typescript
import { HeroImage } from '../components/ui/OptimizedImage';

<HeroImage
  src="/images/banner.jpg"
  alt="Welcome banner"
  overlay={true}
>
  <h1 className="text-white text-4xl">Welcome!</h1>
</HeroImage>
```

### Image Utility Functions

```typescript
import {
  generateBlurDataURL,
  generateSrcSet,
  getThumbnailPath,
  formatChartNumber
} from '../utils/imageOptimization';

// Generate blur placeholder
const placeholder = generateBlurDataURL(20, 20);

// Generate srcset for responsive images
const srcSet = generateSrcSet('/images/product', [320, 640, 1024], 'jpg');

// Get thumbnail path
const thumb = getThumbnailPath('/images/original.jpg', 'medium');
```

---

## 3. API Call Optimization with Caching

### Utilities and Hooks

Located in:
- `app/utils/apiCache.ts`
- `app/hooks/useApiQuery.ts`

### useApiQuery Hook

Custom hook for API queries with automatic caching, deduplication, and stale-while-revalidate.

**Features:**
- Automatic caching with TTL
- Request deduplication (prevents multiple identical requests)
- Stale-while-revalidate pattern
- Retry logic
- Refetch on window focus

**Example Usage:**

```typescript
import { useApiQuery } from '../hooks/useApiQuery';

function UserProfile({ userId }: { userId: string }) {
  const {
    data,
    isLoading,
    isError,
    error,
    isStale,
    refetch,
    invalidate
  } = useApiQuery<User>(
    `/api/users/${userId}`,
    undefined,
    {
      enabled: true,
      refetchOnMount: false,
      refetchOnWindowFocus: true,
      retry: 3,
      retryDelay: 1000,
      onSuccess: (data) => {
        console.log('User loaded:', data);
      },
      onError: (error) => {
        console.error('Failed to load user:', error);
      }
    }
  );

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <div>Error: {error?.message}</div>;

  return (
    <div>
      <h1>{data?.name}</h1>
      {isStale && <button onClick={refetch}>Refresh</button>}
    </div>
  );
}
```

### useApiMutation Hook

For POST, PUT, DELETE operations with automatic cache invalidation.

```typescript
import { useApiMutation } from '../hooks/useApiQuery';

function EditUserForm({ userId }: { userId: string }) {
  const {
    mutate,
    isLoading,
    isError,
    error
  } = useApiMutation<User, UpdateUserData>(
    `/api/users/${userId}`,
    'PUT',
    {
      onSuccess: (data) => {
        toast.success('User updated successfully!');
      },
      onError: (error) => {
        toast.error('Failed to update user');
      },
      // Invalidate all queries matching this pattern
      invalidateQueries: ['/api/users']
    }
  );

  const handleSubmit = async (formData: UpdateUserData) => {
    try {
      await mutate(formData);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
```

### Manual Cache Management

```typescript
import { apiCache } from '../utils/apiCache';

// Invalidate specific cache entry
apiCache.invalidate('/api/users/123');

// Invalidate all entries matching a pattern
apiCache.invalidatePattern('/api/users');

// Clear all cache
apiCache.clear();

// Preload data into cache
apiCache.preload('/api/users/123', userData);

// Get cache statistics
const stats = apiCache.getStats();
console.log(`Cache size: ${stats.size}/${stats.maxSize}`);
```

---

## 4. Chart Memoization

### Components and Utilities

Located in:
- `app/components/ui/MemoizedChart.tsx`
- `app/utils/chartOptimization.ts`

### MemoizedChart Component

Wrapper component that prevents unnecessary re-renders of expensive chart components.

**Features:**
- Deep comparison of data props
- Automatic data sampling for large datasets
- Loading and error states
- Performance monitoring

**Example Usage:**

```typescript
import { MemoizedChart } from '../components/ui/MemoizedChart';

function Dashboard() {
  const [chartData, setChartData] = useState([...]);
  const chartConfig = {
    xKey: 'timestamp',
    yKey: 'value',
    color: '#00C7D1'
  };

  return (
    <MemoizedChart
      data={chartData}
      config={chartConfig}
      width="100%"
      height={400}
      loading={false}
      error={null}
      maxDataPoints={500}
      enablePerformanceMonitoring={true}
    >
      {({ data, config, width, height }) => (
        // Your chart library component
        <YourChartComponent
          data={data}
          {...config}
          width={width}
          height={height}
        />
      )}
    </MemoizedChart>
  );
}
```

### Chart Optimization Hooks

```typescript
import { useChartConfig, useChartData } from '../components/ui/MemoizedChart';

function ChartComponent() {
  // Memoize chart configuration
  const config = useChartConfig(
    () => ({
      xAxis: { type: 'time' },
      yAxis: { type: 'value' },
      series: [
        { type: 'line', name: 'Sales', color: '#00C7D1' }
      ]
    }),
    [/* dependencies */]
  );

  // Process and memoize chart data
  const processedData = useChartData(
    rawData,
    (data) => data.map(item => ({
      ...item,
      value: item.value * 100 // Convert to percentage
    })),
    [/* dependencies */]
  );

  return <Chart data={processedData} config={config} />;
}
```

### Chart Utility Functions

```typescript
import {
  sampleChartData,
  aggregateTimeSeriesData,
  throttle,
  debounce,
  formatChartNumber,
  getChartColors
} from '../utils/chartOptimization';

// Sample large datasets
const sampledData = sampleChartData(largeDataset, 100);

// Aggregate time-series data
const aggregated = aggregateTimeSeriesData(
  timeSeriesData,
  60000 // 1 minute buckets
);

// Throttle chart updates
const handleChartUpdate = throttle((data) => {
  updateChart(data);
}, 100);

// Format large numbers
formatChartNumber(1250000); // "1.2M"
formatChartNumber(45000); // "45.0K"

// Get consistent color schemes
const colors = getChartColors('blue', 5);
```

### Performance Monitoring

```typescript
import { chartPerformanceMonitor } from '../utils/chartOptimization';

// Get performance statistics
const stats = chartPerformanceMonitor.getStats();
console.log(`Average render time: ${stats.average.toFixed(2)}ms`);
console.log(`Max render time: ${stats.max.toFixed(2)}ms`);

// Reset monitoring
chartPerformanceMonitor.reset();
```

---

## Best Practices

### 1. Pagination
- Use pagination for lists with more than 25 items
- Reset to page 1 when filters change
- Show total count and current range

### 2. Images
- Use `OptimizedImage` for all images
- Set `priority="high"` and `lazy={false}` for above-the-fold images
- Provide proper `width` and `height` to prevent layout shift
- Use `Avatar` component for user avatars

### 3. API Calls
- Use `useApiQuery` for all GET requests
- Use `useApiMutation` for POST/PUT/DELETE operations
- Specify `invalidateQueries` in mutations to auto-refresh related data
- Set appropriate `staleTime` based on data freshness requirements

### 4. Charts
- Wrap all charts with `MemoizedChart`
- Sample data for datasets with more than 500 points
- Use `useChartConfig` to prevent config object recreation
- Enable performance monitoring during development

---

## Migration Checklist

When updating existing components:

### For Lists/Tables:
- [ ] Replace custom pagination with `Pagination` component
- [ ] Add `PaginationInfo` for user feedback
- [ ] Add `PageSizeSelector` for flexibility
- [ ] Ensure pagination resets when filters change

### For Images:
- [ ] Replace `<img>` tags with `OptimizedImage`
- [ ] Add proper `alt` text
- [ ] Set `priority` for important images
- [ ] Use `Avatar` for profile pictures

### For API Calls:
- [ ] Replace `useEffect` + `fetch` with `useApiQuery`
- [ ] Replace form submissions with `useApiMutation`
- [ ] Add error handling and loading states
- [ ] Configure cache invalidation

### For Charts:
- [ ] Wrap charts with `MemoizedChart`
- [ ] Memoize chart configuration
- [ ] Sample large datasets
- [ ] Add loading states

---

## Performance Targets

After implementing these optimizations:

- **Initial page load**: < 2 seconds
- **Time to interactive**: < 3 seconds
- **API response caching**: 90%+ cache hit rate
- **Chart render time**: < 100ms per update
- **Image lazy loading**: Only load images in viewport
- **Pagination**: Render only current page data

---

## Troubleshooting

### Pagination not working?
- Ensure `totalPages` is calculated correctly
- Check that `onPageChange` updates state
- Verify data slicing logic

### Images not loading?
- Check browser console for errors
- Verify image paths are correct
- Ensure CORS is configured for external images

### API cache not working?
- Check that URLs are consistent (including query params)
- Verify cache is not being cleared unnecessarily
- Check cache TTL settings

### Charts re-rendering too often?
- Ensure data and config are properly memoized
- Use `chartPropsAreEqual` comparison function
- Check that parent component isn't re-rendering unnecessarily

---

## Additional Resources

- React Performance: https://react.dev/learn/render-and-commit
- Image Optimization: https://web.dev/fast/#optimize-your-images
- API Caching Strategies: https://web.dev/stale-while-revalidate/
- Chart Performance: https://www.chartjs.org/docs/latest/general/performance.html
