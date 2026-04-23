# Loading and Error States Documentation

## Overview

The LeadsDashboard component now includes comprehensive loading and error handling capabilities to prepare for real API integration. This document describes the implementation of loading skeletons, error boundaries, empty states, and partial data handling.

**Requirements:** 10.1, 10.9

## Components

### 1. Loading Skeleton Components

Located in `src/components/skeletons/`

#### KPICardSkeleton
- **Purpose:** Loading placeholder for KPICard components
- **Features:**
  - Matches KPICard layout structure
  - Animated pulse effect
  - Dark theme styling (#1c1c1c background)
  - Accessible with `role="status"` and `aria-label`

#### WeeklyConversionChartSkeleton
- **Purpose:** Loading placeholder for WeeklyConversionChart
- **Features:**
  - Simulated bar chart with 5 bars
  - Legend placeholders
  - Footer message placeholder
  - Maintains chart height (400px)

#### LeadStatusChartSkeleton
- **Purpose:** Loading placeholder for LeadStatusChart
- **Features:**
  - Three overlapping circle placeholders
  - Legend with progress bar placeholders
  - Footer with avatar placeholder
  - Responsive layout (stacks on mobile)

### 2. Error Boundary Component

Located in `src/components/DashboardErrorBoundary.tsx`

#### DashboardErrorBoundary
- **Purpose:** Catches and handles React component errors
- **Features:**
  - Displays user-friendly error message
  - "Try Again" button to reset error state
  - "Reload Page" button for hard refresh
  - Shows error details in development mode
  - Custom fallback UI support
  - Optional `onReset` callback

**Usage:**
```tsx
<DashboardErrorBoundary onReset={handleReset}>
  <LeadsDashboard />
</DashboardErrorBoundary>
```

### 3. Empty State Component

Located in `src/components/EmptyDashboardState.tsx`

#### EmptyDashboardState
- **Purpose:** Displays when no dashboard data is available
- **Features:**
  - Dashboard-themed icons (BarChart3, TrendingUp, Users)
  - Customizable message and description
  - Dark theme styling
  - Centered layout

**Usage:**
```tsx
<EmptyDashboardState 
  message="No Data Available"
  description="Custom description text"
/>
```

### 4. Error State Component

Located in `src/components/DashboardErrorState.tsx`

#### DashboardErrorState
- **Purpose:** Displays when data loading fails
- **Features:**
  - Error icon with orange theme
  - Customizable error message
  - Optional retry button
  - Dark theme styling

**Usage:**
```tsx
<DashboardErrorState 
  error="Failed to load data"
  onRetry={handleRetry}
/>
```

## LeadsDashboard Props

The main `LeadsDashboard` component now accepts the following props:

```typescript
interface LeadsDashboardProps {
  /** Dashboard data to display */
  data?: DashboardData | null;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: string | null;
  /** Callback to retry loading data */
  onRetry?: () => void;
}
```

## State Handling

### Loading State
When `isLoading={true}`:
- Displays skeleton components for all KPI cards
- Displays skeleton components for both charts
- Hides actual data

### Error State
When `error` prop is provided:
- Displays `DashboardErrorState` component
- Shows error message
- Shows retry button if `onRetry` is provided
- Hides all dashboard content

### Empty State
When `data={null}` and not loading:
- Displays `EmptyDashboardState` component
- Shows "No Data Available" message
- Hides all dashboard content

### Success State
When data is available and no error:
- Displays full dashboard with data
- Shows all KPI cards and charts
- Handles partial data gracefully

## Partial Data Handling

All chart components now handle missing or partial data gracefully:

### WeeklyConversionChart
- Checks for empty or null data array
- Displays "No conversion data available" message
- Sanitizes data with default values (0 for missing numbers)
- Handles missing `mostProfitableDay` with "N/A"

### LeadStatusChart
- Checks for empty or null data array
- Displays "No lead status data available" message
- Sanitizes data with default values
- Prevents division by zero in bubble calculations

### KPICard
- Handles missing trend percentage with default 0
- Gracefully displays all trend directions

## Usage Examples

### Example 1: Loading State
```tsx
import LeadsDashboard from './components/LeadsDashboard';

function App() {
  return <LeadsDashboard isLoading={true} />;
}
```

### Example 2: Error State with Retry
```tsx
import LeadsDashboard from './components/LeadsDashboard';

function App() {
  const handleRetry = () => {
    // Trigger data refetch
    fetchDashboardData();
  };

  return (
    <LeadsDashboard 
      error="Failed to load dashboard data"
      onRetry={handleRetry}
    />
  );
}
```

### Example 3: Empty State
```tsx
import LeadsDashboard from './components/LeadsDashboard';

function App() {
  return <LeadsDashboard data={null} />;
}
```

### Example 4: Success State with Data
```tsx
import LeadsDashboard from './components/LeadsDashboard';
import { MOCK_DASHBOARD_DATA } from './data/mockDashboardData';

function App() {
  return <LeadsDashboard data={MOCK_DASHBOARD_DATA} />;
}
```

### Example 5: With Error Boundary
```tsx
import LeadsDashboard from './components/LeadsDashboard';
import DashboardErrorBoundary from './components/DashboardErrorBoundary';

function App() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData()
      .then(data => {
        setData(data);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    // Refetch data
  };

  return (
    <DashboardErrorBoundary onReset={handleRetry}>
      <LeadsDashboard 
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={handleRetry}
      />
    </DashboardErrorBoundary>
  );
}
```

### Example 6: Partial Data
```tsx
import LeadsDashboard from './components/LeadsDashboard';

function App() {
  const partialData = {
    kpis: { /* ... */ },
    weeklyConversions: [
      // Only 2 weeks instead of 5
      { week: '12 Jul', fees: 2100, revenue: 6800, netProfit: 4700 },
      { week: '15 Jul', fees: 2400, revenue: 7200, netProfit: 4800 }
    ],
    leadStatus: [
      // Only 2 statuses instead of 3
      { status: 'completed', count: 177, percentage: 67, color: '#FFB800', label: 'Completed' },
      { status: 'ongoing', count: 87, percentage: 33, color: '#FF4D00', label: 'Ongoing' }
    ],
    metadata: { /* ... */ }
  };

  return <LeadsDashboard data={partialData} />;
}
```

## API Integration Guide

When integrating with a real API, follow this pattern:

```tsx
import { useState, useEffect } from 'react';
import LeadsDashboard from './components/LeadsDashboard';
import DashboardErrorBoundary from './components/DashboardErrorBoundary';
import type { DashboardData } from './types/dashboard';

function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/dashboard');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      setData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DashboardErrorBoundary onReset={fetchData}>
      <LeadsDashboard 
        data={data}
        isLoading={isLoading}
        error={error}
        onRetry={fetchData}
      />
    </DashboardErrorBoundary>
  );
}
```

## Testing

All components include comprehensive unit tests:

- `KPICardSkeleton.test.tsx` - Tests skeleton rendering and accessibility
- `DashboardErrorBoundary.test.tsx` - Tests error catching and reset functionality
- `EmptyDashboardState.test.tsx` - Tests empty state rendering
- `DashboardErrorState.test.tsx` - Tests error state and retry functionality
- `LeadsDashboard.test.tsx` - Tests all states (loading, error, empty, success, partial data)

Run tests with:
```bash
npm test
```

## Accessibility

All loading and error states follow WCAG AA accessibility guidelines:

- **Loading skeletons:** Use `role="status"` and descriptive `aria-label`
- **Error messages:** Clear, user-friendly language
- **Retry buttons:** Descriptive `aria-label` attributes
- **Color contrast:** All text meets 4.5:1 minimum contrast ratio
- **Keyboard navigation:** All interactive elements are keyboard accessible

## Performance Considerations

- **Skeleton components:** Lightweight with minimal DOM elements
- **Error boundary:** Only catches errors, no performance impact on success path
- **Memoization:** Chart components use `React.useMemo` for expensive calculations
- **Conditional rendering:** Only renders necessary components based on state

## Future Enhancements

Potential improvements for future iterations:

1. **Retry with exponential backoff:** Automatically retry failed requests
2. **Partial loading states:** Show some data while other parts load
3. **Optimistic updates:** Show expected changes before API confirmation
4. **Toast notifications:** Non-blocking error messages
5. **Offline support:** Cache data for offline viewing
6. **Real-time updates:** WebSocket integration for live data
7. **Loading progress indicators:** Show percentage of data loaded

## Troubleshooting

### Issue: Skeleton components not showing
**Solution:** Ensure `isLoading={true}` is passed to LeadsDashboard

### Issue: Error state not displaying
**Solution:** Ensure `error` prop is a non-empty string

### Issue: Empty state showing when data exists
**Solution:** Check that `data` prop is not null and has required fields

### Issue: Charts showing "No data available"
**Solution:** Ensure `weeklyConversions` and `leadStatus` arrays are not empty

### Issue: Error boundary not catching errors
**Solution:** Ensure DashboardErrorBoundary wraps the component tree

## Related Files

- `src/components/LeadsDashboard.tsx` - Main dashboard component
- `src/components/skeletons/` - Loading skeleton components
- `src/components/DashboardErrorBoundary.tsx` - Error boundary
- `src/components/EmptyDashboardState.tsx` - Empty state
- `src/components/DashboardErrorState.tsx` - Error state
- `src/components/LeadsDashboard.states.example.tsx` - Usage examples
- `src/types/dashboard.ts` - TypeScript interfaces
- `src/data/mockDashboardData.ts` - Mocked data

## Conclusion

The loading and error state implementation provides a robust foundation for API integration. All states are tested, accessible, and follow the Boostboard design system. The components gracefully handle edge cases and provide clear feedback to users in all scenarios.
