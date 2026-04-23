# LeadsDashboard Component

## Overview

The `LeadsDashboard` component is the main container for the leads analytics dashboard. It transforms the previous conversion funnel and gender distribution interface into a modern KPI-focused layout following the Boostboard reference design.

## Features

- **NavigationBar**: Fixed top navigation with logo, tabs (Dashboard, Leads, Calculadora, Configurações), and user avatar
- **KPI Cards**: Three key performance indicators displaying Total Revenue, Marketplace Fees, and Total Leads
- **Responsive Grid Layout**: Mobile-first design that adapts to different screen sizes
- **Chart Placeholders**: Sections for WeeklyConversionChart and LeadStatusChart (to be implemented in Phase 2)
- **Dark Theme**: Consistent Boostboard color scheme (#0f0f0f background, #1c1c1c cards)

## Usage

```tsx
import LeadsDashboard from '@/components/LeadsDashboard';

function App() {
  return <LeadsDashboard />;
}
```

## Responsive Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 768px | Single column, stacked cards |
| Tablet | 768px - 1024px | 2-column KPI grid, stacked charts |
| Desktop | > 1024px | 3-column KPI row, side-by-side charts |

## Component Structure

```
LeadsDashboard
├── NavigationBar (fixed top)
├── KPI Cards Section (responsive grid)
│   ├── Total Revenue Card
│   ├── Marketplace Fees Card
│   └── Total Leads Card
└── Charts Section (responsive grid)
    ├── Weekly Conversion Chart (placeholder)
    └── Lead Status Chart (placeholder)
```

## Data Source

The component currently uses mocked data from `src/data/mockDashboardData.ts`. This includes:

- **KPI Metrics**: Total Revenue (R$ 33,846), Marketplace Fees (R$ 12,582), Total Leads (245,214)
- **Trend Indicators**: Direction (up/down/neutral) and percentage change
- **Metadata**: Most profitable day, recent signups count

## Styling

The component uses Tailwind CSS with the following color scheme:

- **Background**: `#0f0f0f` (main background)
- **Cards**: `#1c1c1c` (card background)
- **Accent Colors**: 
  - Orange: `#FF4D00`
  - Yellow: `#FFB800`
  - Purple: `#7C3AED`
- **Trend Colors**:
  - Green: `#10b981` (positive)
  - Red: `#ef4444` (negative)
  - Gray: `#a3a3a3` (neutral)

## Accessibility

- Semantic HTML with proper ARIA labels
- Keyboard navigation support via NavigationBar
- WCAG AA compliant color contrast ratios
- Screen reader friendly with descriptive labels

## Requirements Satisfied

This component satisfies the following requirements from the spec:

- **5.1**: Mobile-first responsive design with CSS Grid/Tailwind utilities
- **5.3**: Mobile layout (< 768px) with single column, stacked cards
- **5.4**: Tablet layout (768px - 1024px) with 2-column KPI grid, stacked charts
- **5.5**: Desktop layout (> 1024px) with 3-column KPI row, side-by-side charts
- **5.6**: Consistent spacing (gap-4 and gap-6) between cards
- **10.1**: Component created in src/components/ directory

## Future Enhancements (Phase 2)

- Replace chart placeholders with actual Recharts-based visualizations
- Implement WeeklyConversionChart with stacked bars
- Implement LeadStatusChart with bubble visualization
- Add API integration to replace mocked data
- Add loading and error states
- Add chart interactions and tooltips

## Testing

The component includes comprehensive unit tests covering:

- Navigation bar rendering
- KPI cards display with correct values
- Chart placeholder sections
- Metadata messages in footers
- ARIA labels for accessibility
- Responsive grid classes
- Dark theme colors

Run tests with:

```bash
pnpm test LeadsDashboard.test.tsx
```

## Related Components

- `NavigationBar`: Internal page navigation component
- `KPICard`: Reusable card for displaying key performance indicators
- `WeeklyConversionChart`: (Phase 2) Bar chart for weekly conversion data
- `LeadStatusChart`: (Phase 2) Bubble chart for lead status distribution

## Dependencies

- React 19.2.0
- Tailwind CSS 3.4.19
- lucide-react (for icons)
- @radix-ui/react-avatar (for user avatar)

## Notes

- The component is self-contained and manages its own navigation state
- Chart placeholders include descriptive messages for Phase 2 implementation
- The layout uses Tailwind's responsive utilities for automatic adaptation
- All spacing follows the design system (gap-4 for mobile, gap-6 for desktop)
