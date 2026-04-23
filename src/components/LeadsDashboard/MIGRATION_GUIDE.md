# Migration Guide: Old Leads Page → LeadsDashboard Component

This guide helps you transition from the previous leads tracking interface to the new LeadsDashboard component.

## Overview

The LeadsDashboard component represents a complete redesign of the leads tracking page, moving from a sidebar-based layout with conversion funnel and gender distribution charts to a modern KPI-focused dashboard with responsive grid layout.

## Visual Comparison

### Old Design
```
┌─────────────────────────────────────────────────────────────┐
│ Leads                                                        │
│ Acompanhe seus leads                                        │
├─────────────────────────────────────┬───────────────────────┤
│                                     │ Top Clientes          │
│ Funil de Conversão                  │ - Cliente 1           │
│ ████████████████████ Novos Leads    │ - Cliente 2           │
│ ████████████ Recorrentes            │                       │
│ ████████ Convertidos                │ Top Leads             │
│ ████ Qualificados                   │ - Lead 1              │
│                                     │ - Lead 2              │
│ Distribuição de Gênero              │                       │
│ 🟦 Masculino (45%)                  │ [Classificar Leads]   │
│ 🟪 Feminino (35%)                   │                       │
│ 🟩 Não classificado (20%)           │ Todos/Masc/Fem        │
│                                     │                       │
│ Todos os Leads                      │ Individual Lead Cards │
│ [Lead Card 1]                       │ [Card 1]              │
│ [Lead Card 2]                       │ [Card 2]              │
│ [Lead Card 3]                       │ [Card 3]              │
└─────────────────────────────────────┴───────────────────────┘
```

### New Design (LeadsDashboard)
```
┌─────────────────────────────────────────────────────────────┐
│ Alob Express  [Dashboard] [Leads] [Calculadora] [Config] 👤 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│ │Total Revenue │ │Marketplace   │ │Total Leads   │        │
│ │R$ 33.846     │ │Fees          │ │245.214       │        │
│ │↑ +12.5%      │ │R$ 12.582     │ │↑ +8.7%       │        │
│ └──────────────┘ │↓ -3.2%       │ └──────────────┘        │
│                  └──────────────┘                           │
│                                                              │
│ ┌─────────────────────────┐ ┌─────────────────────────┐   │
│ │ Conversion              │ │ Leads                   │   │
│ │ ┌─────────────────────┐ │ │ ⚫⚫⚫ (Bubbles)         │   │
│ │ │ Bar Chart           │ │ │                         │   │
│ │ │ (Fees/Revenue/      │ │ │ Completed  ████ 177    │   │
│ │ │  Net Profit)        │ │ │ Ongoing    ███  87     │   │
│ │ └─────────────────────┘ │ │ Awaiting   █    23     │   │
│ │ July 17 most profitable │ │ +14 users signed in    │   │
│ └─────────────────────────┘ └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Feature Mapping

### Removed Features

| Old Feature | Status | Replacement |
|-------------|--------|-------------|
| "Funil de Conversão" horizontal bars | ❌ Removed | KPI Cards + WeeklyConversionChart |
| "Novos Leads" metric | ❌ Removed | Total Leads KPI card |
| "Recorrentes" metric | ❌ Removed | Marketplace Fees KPI card |
| "Convertidos" metric | ❌ Removed | Implicit in conversion chart |
| "Qualificados" metric | ❌ Removed | Implicit in lead status chart |
| "Distribuição de Gênero" donut chart | ❌ Removed | LeadStatusChart (status-based) |
| Gender filter tabs (Todos/Masc/Fem) | ❌ Removed | N/A |
| Right sidebar | ❌ Removed | N/A |
| "Top Clientes" section | ❌ Removed | N/A |
| "Top Leads" section | ❌ Removed | N/A |
| "Classificar Leads" button | ❌ Removed | N/A |
| "Todos os Leads" card list | ❌ Removed | N/A |
| Individual lead cards | ❌ Removed | N/A |

### New Features

| New Feature | Description | Purpose |
|-------------|-------------|---------|
| NavigationBar | Logo, tabs, user avatar | Internal page navigation |
| Total Revenue KPI | R$ value with trend | Key business metric |
| Marketplace Fees KPI | R$ value with trend | Cost tracking |
| Total Leads KPI | Count with trend | Lead volume tracking |
| WeeklyConversionChart | Stacked bar chart | Weekly performance trends |
| LeadStatusChart | Bubble visualization | Lead pipeline status |
| Responsive grid layout | Mobile-first design | Better mobile experience |
| Dark theme | Boostboard colors | Modern aesthetic |

## Data Structure Changes

### Old Data Structure (Inferred)
```typescript
// Old structure (not explicitly defined)
{
  leads: {
    novos: number,
    recorrentes: number,
    convertidos: number,
    qualificados: number
  },
  gender: {
    masculino: number,
    feminino: number,
    naoClassificado: number
  },
  topClientes: Cliente[],
  topLeads: Lead[],
  todosLeads: Lead[]
}
```

### New Data Structure
```typescript
// New structure (TypeScript interfaces in src/types/dashboard.ts)
interface DashboardData {
  kpis: {
    totalRevenue: { value: number, trend: TrendIndicator },
    marketplaceFees: { value: number, trend: TrendIndicator, breakdown: {...} },
    totalLeads: { value: number, trend: TrendIndicator }
  },
  weeklyConversions: WeeklyConversionData[],
  leadStatus: LeadStatusData[],
  metadata: DashboardMetadata
}
```

## Color Scheme Migration

### Old Colors
```css
/* Old color palette */
--blue: #3b82f6;
--purple: #a855f7;
--teal: #14b8a6;
--gray: #6b7280;
--background: #ffffff;
--card: #f9fafb;
```

### New Colors (Boostboard Palette)
```css
/* New color palette */
--background: #0f0f0f;
--card: #1c1c1c;
--orange: #FF4D00;
--yellow: #FFB800;
--purple: #7C3AED;
--text-primary: #ffffff;
--text-secondary: #a3a3a3;
--trend-up: #10b981;
--trend-down: #ef4444;
```

## Integration Steps

### Step 1: Install Dependencies

```bash
# Install required packages
pnpm add recharts date-fns

# Install dev dependencies (if needed)
pnpm add -D @types/d3
```

### Step 2: Import Component

```tsx
// Old import (remove)
import LeadsPage from '@/pages/LeadsPage';

// New import
import LeadsDashboard from '@/components/LeadsDashboard';
```

### Step 3: Update Route

```tsx
// Old route (remove)
<Route path="/leads" element={<LeadsPage />} />

// New route
<Route path="/leads" element={<LeadsDashboard />} />
```

### Step 4: Transform Data (if using API)

If you're fetching data from an API, you'll need to transform it to match the new structure:

```typescript
// Data transformation function
function transformOldDataToNew(oldData: OldLeadsData): DashboardData {
  return {
    kpis: {
      totalRevenue: {
        value: calculateTotalRevenue(oldData),
        trend: calculateRevenueTrend(oldData)
      },
      marketplaceFees: {
        value: calculateMarketplaceFees(oldData),
        trend: calculateFeesTrend(oldData),
        breakdown: {
          mercadoLivre: oldData.fees.mercadoLivre,
          shopee: oldData.fees.shopee,
          tiktok: oldData.fees.tiktok
        }
      },
      totalLeads: {
        value: oldData.leads.novos + oldData.leads.recorrentes,
        trend: calculateLeadsTrend(oldData)
      }
    },
    weeklyConversions: transformWeeklyData(oldData),
    leadStatus: transformLeadStatus(oldData),
    metadata: {
      lastUpdated: new Date(),
      mostProfitableDay: findMostProfitableDay(oldData),
      recentSignups: oldData.recentSignups || 0,
      dataSource: 'api'
    }
  };
}
```

### Step 5: Update API Endpoints (Backend)

If you control the backend, update your API to return data in the new format:

```typescript
// Old endpoint (deprecated)
GET /api/leads
Response: { leads: {...}, gender: {...}, topClientes: [...], ... }

// New endpoint
GET /api/dashboard
Response: { kpis: {...}, weeklyConversions: [...], leadStatus: [...], metadata: {...} }
```

## Responsive Behavior Changes

### Old Design
- Fixed sidebar on desktop
- Limited mobile support
- Horizontal scrolling on small screens

### New Design
- **Mobile (< 768px)**: Single column, stacked cards
- **Tablet (768px - 1024px)**: 2-column KPI grid, stacked charts
- **Desktop (> 1024px)**: 3-column KPI row, side-by-side charts

## Accessibility Improvements

### Old Design
- Limited keyboard navigation
- Missing ARIA labels
- Poor color contrast in some areas

### New Design
- ✅ Full keyboard navigation (Tab, Arrow keys, Enter, Space)
- ✅ WCAG AA compliant color contrast ratios
- ✅ Comprehensive ARIA labels and roles
- ✅ Skip navigation link
- ✅ Screen reader support

## Performance Improvements

### Old Design
- No memoization
- Frequent re-renders
- Large bundle size

### New Design
- ✅ React.memo on chart components
- ✅ useMemo for expensive calculations
- ✅ Debounced resize and interactions
- ✅ Tree-shaking for smaller bundle

## Testing Migration

### Old Tests (Update/Remove)
```typescript
// Old tests to remove
describe('LeadsPage', () => {
  it('renders conversion funnel', () => {...});
  it('renders gender distribution', () => {...});
  it('renders top clientes sidebar', () => {...});
});
```

### New Tests (Add)
```typescript
// New tests to add
describe('LeadsDashboard', () => {
  it('renders navigation bar', () => {...});
  it('renders three KPI cards', () => {...});
  it('renders weekly conversion chart', () => {...});
  it('renders lead status chart', () => {...});
  it('adapts to mobile layout', () => {...});
});
```

## Common Issues and Solutions

### Issue 1: Missing Data Fields

**Problem**: Old API doesn't provide `weeklyConversions` or `leadStatus` data.

**Solution**: Create a data transformation layer that calculates these from existing data:

```typescript
function deriveWeeklyConversions(oldData: OldLeadsData): WeeklyConversionData[] {
  // Calculate weekly data from daily/monthly data
  return groupByWeek(oldData.transactions).map(week => ({
    week: formatWeek(week.date),
    date: week.date,
    fees: sumFees(week.transactions),
    revenue: sumRevenue(week.transactions),
    netProfit: calculateNetProfit(week.transactions),
    conversionRate: calculateConversionRate(week.leads, week.conversions)
  }));
}
```

### Issue 2: Gender Data No Longer Used

**Problem**: Old system tracked gender, new system tracks status.

**Solution**: Map gender data to status or remove gender tracking:

```typescript
// Option 1: Map to status (if there's a correlation)
function mapGenderToStatus(leads: Lead[]): LeadStatusData[] {
  // Custom mapping logic based on your business rules
}

// Option 2: Remove gender tracking entirely
// Update backend to track lead status instead
```

### Issue 3: Sidebar Features Missing

**Problem**: Users relied on "Top Clientes" and "Top Leads" sidebar.

**Solution**: Create separate pages or modals for these features:

```tsx
// Add new routes for detailed views
<Route path="/leads/top-clients" element={<TopClientsPage />} />
<Route path="/leads/top-leads" element={<TopLeadsPage />} />

// Or add buttons in NavigationBar to open modals
<Button onClick={() => setShowTopClients(true)}>Top Clients</Button>
```

### Issue 4: Individual Lead Cards Missing

**Problem**: Users need to see individual lead details.

**Solution**: Add a "View All Leads" button that navigates to a detailed list:

```tsx
// In LeadsDashboard
<Button onClick={() => navigate('/leads/all')}>View All Leads</Button>

// Create new route
<Route path="/leads/all" element={<AllLeadsPage />} />
```

## Rollback Plan

If you need to rollback to the old design:

1. **Keep old components**: Don't delete old components immediately
2. **Feature flag**: Use a feature flag to toggle between old and new:

```tsx
const useNewDashboard = useFeatureFlag('new-dashboard');

return useNewDashboard ? <LeadsDashboard /> : <OldLeadsPage />;
```

3. **Gradual rollout**: Deploy to a percentage of users first
4. **Monitor metrics**: Track user engagement and feedback

## Timeline Recommendation

### Week 1: Preparation
- Install dependencies
- Review data structure changes
- Plan data transformation logic

### Week 2: Backend Updates
- Update API endpoints
- Implement data transformation
- Test new endpoints

### Week 3: Frontend Integration
- Integrate LeadsDashboard component
- Update routes
- Connect to new API endpoints

### Week 4: Testing
- Unit tests
- Integration tests
- User acceptance testing

### Week 5: Deployment
- Deploy to staging
- Gradual rollout to production
- Monitor and iterate

## Support and Resources

- **Component Documentation**: See `README.md` in this directory
- **TypeScript Interfaces**: See `src/types/dashboard.ts`
- **Design Document**: See `.kiro/specs/leads-dashboard-component/design.md`
- **Requirements**: See `.kiro/specs/leads-dashboard-component/requirements.md`

## Feedback

If you encounter issues during migration or have suggestions for improvements, please:
1. Create an issue in the project repository
2. Contact the development team
3. Document workarounds for future reference

---

**Last Updated**: 2024-07-21  
**Version**: 1.0.0  
**Maintained By**: Development Team
