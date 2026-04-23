# KPICard Component

A reusable card component for displaying key performance indicators (KPIs) with trend indicators and formatted values. Designed for the LeadsDashboard component following the Boostboard dark theme design.

## Features

- ✅ Dark theme styling (#1c1c1c background, rounded-2xl, shadow-lg)
- ✅ Trend indicators with color coding (green for up, red for down, gray for neutral)
- ✅ Multiple value formats (currency, number, percentage)
- ✅ Brazilian Real (R$) currency formatting
- ✅ Optional icon support
- ✅ Fully accessible with ARIA labels
- ✅ Responsive design ready

## Requirements Coverage

This component satisfies the following requirements from the LeadsDashboard spec:

- **2.2**: Display revenue value in Brazilian Real (R$) format with large bold typography
- **2.3**: Display percentage variation indicator with green/red color coding
- **2.5**: Display marketplace fees with percentage indicator
- **2.9**: Use rounded-2xl borders and #1c1c1c background color
- **6.2**: Use #1c1c1c as card background color
- **6.3**: Use rounded-2xl border radius for all cards
- **6.8**: Use green (#10b981) for positive trends and red (#ef4444) for negative trends
- **8.1**: Use Card components from src/components/ui/card

## Props

```typescript
interface KPICardProps {
  /** The title/label of the KPI */
  title: string;
  
  /** The value to display (number or pre-formatted string) */
  value: string | number;
  
  /** Trend indicator with direction and percentage */
  trend: {
    direction: 'up' | 'down' | 'neutral';
    percentage: number;
  };
  
  /** Optional icon to display in the header */
  icon?: React.ReactNode;
  
  /** Format type for the value */
  format?: 'currency' | 'number' | 'percentage';
}
```

## Usage Examples

### Basic Usage

```tsx
import { KPICard } from '@/components/KPICard';
import { DollarSign } from 'lucide-react';

<KPICard
  title="Total Revenue"
  value={33846}
  trend={{ direction: 'up', percentage: 12.5 }}
  icon={<DollarSign className="w-5 h-5" />}
  format="currency"
/>
```

### Currency Format (Brazilian Real)

```tsx
<KPICard
  title="Marketplace Fees"
  value={12582}
  trend={{ direction: 'down', percentage: 3.2 }}
  format="currency"
/>
// Displays: R$ 12.582,00
```

### Number Format

```tsx
<KPICard
  title="Total Leads"
  value={245214}
  trend={{ direction: 'up', percentage: 8.7 }}
  format="number"
/>
// Displays: 245.214
```

### Percentage Format

```tsx
<KPICard
  title="Conversion Rate"
  value={15.5}
  trend={{ direction: 'neutral', percentage: 0 }}
  format="percentage"
/>
// Displays: 15.5%
```

### Responsive Grid Layout

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <KPICard
    title="Total Revenue"
    value={33846}
    trend={{ direction: 'up', percentage: 12.5 }}
    format="currency"
  />
  <KPICard
    title="Marketplace Fees"
    value={12582}
    trend={{ direction: 'down', percentage: 3.2 }}
    format="currency"
  />
  <KPICard
    title="Total Leads"
    value={245214}
    trend={{ direction: 'up', percentage: 8.7 }}
    format="number"
  />
</div>
```

## Styling

The component uses the following Boostboard dark theme colors:

- **Background**: `#1c1c1c` (dark gray)
- **Text Primary**: `#ffffff` (white)
- **Text Secondary**: `#a3a3a3` (muted gray)
- **Trend Up**: `#10b981` (green)
- **Trend Down**: `#ef4444` (red)
- **Trend Neutral**: `#a3a3a3` (gray)

## Accessibility

The component includes:

- Semantic HTML with `role="article"`
- Descriptive ARIA labels for screen readers
- Proper color contrast ratios (WCAG AA compliant)
- Keyboard navigation support (inherited from Card component)

## Testing

The component includes comprehensive unit tests covering:

- Component rendering
- Value formatting (currency, number, percentage)
- Trend indicators (up, down, neutral)
- Styling classes
- Accessibility attributes

Run tests with:

```bash
pnpm test src/components/KPICard.test.tsx
```

## Dependencies

- `@/components/ui/card` - shadcn/ui Card components
- `lucide-react` - Icon library (for trend arrows)
- `@/lib/utils` - Utility functions (cn for class merging)

## File Structure

```
src/components/
├── KPICard.tsx           # Main component
├── KPICard.test.tsx      # Unit tests
├── KPICard.example.tsx   # Usage examples
└── KPICard.md            # This documentation
```

## Integration with LeadsDashboard

This component is designed to be used in the LeadsDashboard component as part of the KPI cards section:

```tsx
import { KPICard } from '@/components/KPICard';

const LeadsDashboard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <KPICard
        title="Total Revenue"
        value={33846}
        trend={{ direction: 'up', percentage: 12.5 }}
        format="currency"
      />
      {/* More KPI cards... */}
    </div>
  );
};
```

## Future Enhancements

Potential improvements for future iterations:

- [ ] Animation on value changes
- [ ] Tooltip with detailed trend information
- [ ] Click handler for drill-down functionality
- [ ] Loading skeleton state
- [ ] Error state handling
- [ ] Custom color themes
- [ ] Sparkline mini-chart integration

## License

Part of the Dropshipping Calculator App project.
