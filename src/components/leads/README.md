# Leads Table Management Components

This directory contains all components related to the Leads Table Management feature.

## Completed Components

### LeadsTable (Task 4 - Phase 1)
**File:** `LeadsTable.tsx`

Main container component that orchestrates the entire leads management interface.

**Features:**
- ✅ State management for filters, sorting, pagination, and selected leads
- ✅ Integration with `useLeads` and `useLeadKPIs` React Query hooks
- ✅ Loading state with skeleton loaders
- ✅ Error state with retry functionality
- ✅ Empty state for no leads
- ✅ Empty state for filtered results
- ✅ Integration with dashboard filters (period and marketplace)
- ✅ Placeholder KPI cards (basic implementation)
- ✅ Comprehensive test coverage (9 tests)

**Props:**
```typescript
interface LeadsTableProps {
  organizationId: string;
  period?: { from: Date; to: Date } | null;
  marketplaceId?: string | null;
  className?: string;
}
```

**State Management:**
- `filters`: LeadFilters - Search text, status, marketplace, gender, date range
- `sort`: SortConfig - Column and direction
- `pagination`: PaginationConfig - Page, page size, total count
- `selectedLeads`: string[] - Array of selected lead IDs

**Requirements Validated:**
- ✅ 1.1: Display table below existing dashboard components
- ✅ 1.5: Show "no leads found" message when empty
- ✅ 1.6: Display loading indicator during fetch
- ✅ 1.7: Display error message with retry on failure
- ✅ 10.1: Sync with TimePeriodFilter
- ✅ 10.2: Sync with MarketplaceFilter
- ✅ 10.3: Auto-sync with dashboard filter changes

## Pending Components (Future Tasks)

### Phase 2: Table Display and Basic Interactions
- [ ] KPICards (Task 6) - Full KPI cards with icons and styling
- [ ] LeadsTableContent (Task 7) - Table with virtualization
- [ ] TablePagination (Task 8) - Pagination controls

### Phase 3: Filtering and Search
- [ ] FilterBar (Task 11) - Comprehensive filtering UI

### Phase 4: CRUD Operations
- [ ] LeadFormDialog (Task 15) - Create/edit lead form
- [ ] DeleteConfirmDialog (Task 16) - Delete confirmation

## Utility Files

### constants.ts
Contains all constants used across the leads feature:
- Pagination defaults
- Cache settings
- Status options
- Column definitions
- Color mappings
- Error/success messages

### utils.ts
Utility functions for:
- Phone number formatting
- Date formatting
- Currency formatting
- Status badge colors
- Email/phone validation
- CPF/CNPJ validation
- CSV export

### index.ts
Barrel export file for all leads components.

## Testing

All components have comprehensive test coverage using Vitest and React Testing Library.

**Run tests:**
```bash
npm run test -- src/components/leads
```

**Current test coverage:**
- LeadsTable: 9 tests (100% passing)
  - Loading states
  - Error states with retry
  - Empty states (no data and filtered)
  - Data display
  - Dashboard filter integration

## Usage Example

```tsx
import { LeadsTable } from '@/components/leads';

function LeadsDashboard() {
  const { organizationId } = useAuth();
  const [period, setPeriod] = useState(null);
  const [marketplaceId, setMarketplaceId] = useState(null);

  return (
    <div>
      <TimePeriodFilter value={period} onChange={setPeriod} />
      <MarketplaceFilter value={marketplaceId} onChange={setMarketplaceId} />
      
      <LeadsTable
        organizationId={organizationId}
        period={period}
        marketplaceId={marketplaceId}
      />
    </div>
  );
}
```

## Next Steps

1. **Phase 2 (Task 6-10):** Implement KPICards, LeadsTableContent with virtualization, and TablePagination
2. **Phase 3 (Task 11-14):** Implement FilterBar with all filter types
3. **Phase 4 (Task 15-19):** Implement CRUD operations (create, edit, delete)
4. **Phase 5 (Task 20-27):** Add CSV export, accessibility, responsive design, and performance optimizations

## Architecture Notes

- **State Management:** React Query for server state, local useState for UI state
- **Data Fetching:** Custom hooks (useLeads, useLeadKPIs) wrap React Query
- **Styling:** Tailwind CSS with shadcn/ui components
- **Performance:** Will use @tanstack/react-virtual for table virtualization (Phase 2)
- **Accessibility:** WCAG AA compliance (Phase 5)
