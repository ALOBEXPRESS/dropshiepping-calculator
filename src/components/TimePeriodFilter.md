# TimePeriodFilter Component

A filter component for selecting time periods in the sales dashboard. Provides five predefined period options with keyboard navigation and mobile-responsive design.

## Features

- ✅ Five period buttons: Dia, Semana, Mês, Ano, Total
- ✅ Active state styling (orange #FF4D00 background, white text)
- ✅ Inactive state styling (transparent background, gray #a3a3a3 text)
- ✅ Disabled state during data loading
- ✅ Keyboard navigation support (Tab, Enter, Space, Arrow keys)
- ✅ Mobile-responsive with horizontal scroll
- ✅ Dark theme styling consistent with Boostboard design
- ✅ WCAG AA compliant accessibility

## Usage

### Basic Example

```tsx
import { TimePeriodFilter, TimePeriod } from '@/components/TimePeriodFilter';

function Dashboard() {
  const [period, setPeriod] = useState<TimePeriod>('week');

  return (
    <TimePeriodFilter
      selectedPeriod={period}
      onPeriodChange={setPeriod}
    />
  );
}
```

### With Loading State

```tsx
function Dashboard() {
  const [period, setPeriod] = useState<TimePeriod>('week');
  const { data, isLoading } = useDashboardData(period);

  return (
    <TimePeriodFilter
      selectedPeriod={period}
      onPeriodChange={setPeriod}
      disabled={isLoading}
    />
  );
}
```

### With Data Fetching

```tsx
function Dashboard() {
  const [period, setPeriod] = useState<TimePeriod>('week');
  const [isLoading, setIsLoading] = useState(false);

  const handlePeriodChange = async (newPeriod: TimePeriod) => {
    setIsLoading(true);
    try {
      await fetchDashboardData(newPeriod);
      setPeriod(newPeriod);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TimePeriodFilter
      selectedPeriod={period}
      onPeriodChange={handlePeriodChange}
      disabled={isLoading}
    />
  );
}
```

## Props

### `TimePeriodFilterProps`

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `selectedPeriod` | `TimePeriod` | Yes | - | Currently selected period |
| `onPeriodChange` | `(period: TimePeriod) => void` | Yes | - | Callback when period changes |
| `disabled` | `boolean` | No | `false` | Disable filter during loading |

### `TimePeriod` Type

```typescript
type TimePeriod = 'day' | 'week' | 'month' | 'year' | 'total';
```

## Styling

### Active State
- Background: `#FF4D00` (orange)
- Text: `white`
- Shadow: `shadow-lg`

### Inactive State
- Background: `transparent`
- Text: `#a3a3a3` (gray)
- Hover background: `#1c1c1c`
- Hover text: `white`

### Disabled State
- Opacity: `50%`
- Cursor: `not-allowed`
- No interaction

### Focus State
- Ring: `2px solid #FF4D00`
- Ring offset: `2px`
- Ring offset color: `#0f0f0f`

## Keyboard Navigation

The component implements the roving tabindex pattern for efficient keyboard navigation:

| Key | Action |
|-----|--------|
| `Tab` | Focus the selected period button |
| `ArrowRight` | Move focus to next button (wraps to first) |
| `ArrowLeft` | Move focus to previous button (wraps to last) |
| `Home` | Move focus to first button |
| `End` | Move focus to last button |
| `Enter` | Select the focused period |
| `Space` | Select the focused period |

## Accessibility

### ARIA Attributes

- `role="group"` on container with `aria-label="Filtro de período de tempo"`
- `aria-pressed` on buttons to indicate active state
- `aria-label` on each button (e.g., "Filtrar por dia")
- Roving tabindex pattern (`tabIndex={0}` for selected, `-1` for others)

### Screen Reader Support

- Group label announces the purpose of the filter
- Each button has a descriptive label
- Active state is communicated via `aria-pressed`
- Disabled state is properly announced

### Focus Management

- Visible focus ring on all interactive elements
- Focus remains on selected button after activation
- Arrow keys move focus without activating
- Enter/Space activate the focused button

## Mobile Responsiveness

### Small Screens (< 768px)

- Horizontal scroll enabled
- Scrollbar hidden for clean appearance
- Buttons maintain minimum width
- Touch-friendly button size (px-6 py-2.5)

### Large Screens (≥ 768px)

- All buttons visible without scrolling
- Buttons aligned to start of container
- Hover effects enabled

## Integration with Dashboard

### Typical Integration Pattern

```tsx
import { TimePeriodFilter, TimePeriod } from '@/components/TimePeriodFilter';
import { useDashboardData } from '@/hooks/useDashboardData';
import { KPICard } from '@/components/KPICard';

function LeadsDashboard() {
  const [period, setPeriod] = useState<TimePeriod>('week');
  const { data, isLoading, isError, error, refetch } = useDashboardData(period);

  if (isError) {
    return <DashboardErrorState error={error} onRetry={refetch} />;
  }

  return (
    <div className="p-6">
      {/* Period Filter */}
      <TimePeriodFilter
        selectedPeriod={period}
        onPeriodChange={setPeriod}
        disabled={isLoading}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <>
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
            <KPICardSkeleton />
          </>
        ) : (
          <>
            <KPICard
              title="Lucro Total"
              value={data.profit.current}
              trend={{
                direction: data.profit.growth > 0 ? 'up' : 'down',
                percentage: Math.abs(data.profit.growth)
              }}
              format="currency"
            />
            {/* More KPI cards... */}
          </>
        )}
      </div>
    </div>
  );
}
```

## Testing

### Unit Tests

The component includes comprehensive unit tests covering:

- ✅ Button rendering and labels
- ✅ Active state styling
- ✅ Disabled state
- ✅ Click interactions
- ✅ Keyboard navigation (all keys)
- ✅ ARIA attributes
- ✅ Focus management
- ✅ Roving tabindex pattern

Run tests:
```bash
npm test -- TimePeriodFilter.test.tsx
```

### Visual Testing

Example file available at `src/components/TimePeriodFilter.example.tsx` with:

- Basic usage
- Disabled state
- Dashboard context
- Mobile responsive
- All period options

## Requirements Mapping

This component satisfies the following requirements:

- **2.1**: Provides five period options (Dia, Semana, Mês, Ano, Total)
- **2.9**: Positioned above KPI cards in dashboard
- **6.1**: Maintains Boostboard dark theme styling
- **6.3**: Mobile-responsive with horizontal scroll

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Lightweight component (~5KB minified)
- No external dependencies beyond React
- Efficient re-renders (only when props change)
- CSS-in-JS for scoped scrollbar styles

## Future Enhancements

Potential improvements for future versions:

- [ ] Custom period ranges (date picker)
- [ ] Period presets (Last 7 days, Last 30 days, etc.)
- [ ] Comparison mode (compare two periods)
- [ ] Keyboard shortcuts (e.g., `1-5` for quick selection)
- [ ] Animation transitions between periods
- [ ] Tooltip showing period date range

## Related Components

- `KPICard` - Displays KPI metrics with trend indicators
- `LeadsDashboard` - Main dashboard container
- `useDashboardData` - Hook for fetching dashboard data

## License

MIT
