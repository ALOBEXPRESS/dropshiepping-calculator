/**
 * KPICard Component Usage Examples
 * 
 * This file demonstrates various use cases for the KPICard component
 * as specified in the LeadsDashboard requirements.
 */

import { KPICard } from './KPICard';
import { DollarSign, Users, TrendingUp } from 'lucide-react';

/**
 * Example 1: Total Revenue KPI
 * Requirements: 2.2, 2.3
 * 
 * Displays total revenue in Brazilian Real format with positive growth indicator
 */
export const TotalRevenueExample = () => (
  <KPICard
    title="Total Revenue"
    value={33846}
    trend={{ direction: 'up', percentage: 12.5 }}
    icon={<DollarSign className="w-5 h-5" />}
    format="currency"
  />
);

/**
 * Example 2: Marketplace Fees KPI
 * Requirements: 2.4, 2.5
 * 
 * Displays marketplace fees with negative trend (fees decreasing is good)
 */
export const MarketplaceFeesExample = () => (
  <KPICard
    title="Marketplace Fees"
    value={12582}
    trend={{ direction: 'down', percentage: 3.2 }}
    icon={<DollarSign className="w-5 h-5" />}
    format="currency"
  />
);

/**
 * Example 3: Total Leads KPI
 * Requirements: 2.6, 2.7
 * 
 * Displays total number of leads with growth indicator
 */
export const TotalLeadsExample = () => (
  <KPICard
    title="Total Leads"
    value={245214}
    trend={{ direction: 'up', percentage: 8.7 }}
    icon={<Users className="w-5 h-5" />}
    format="number"
  />
);

/**
 * Example 4: Conversion Rate KPI
 * 
 * Displays a percentage value with neutral trend
 */
export const ConversionRateExample = () => (
  <KPICard
    title="Conversion Rate"
    value={15.5}
    trend={{ direction: 'neutral', percentage: 0 }}
    icon={<TrendingUp className="w-5 h-5" />}
    format="percentage"
  />
);

/**
 * Example 5: KPI without Icon
 * 
 * Demonstrates that the icon prop is optional
 */
export const NoIconExample = () => (
  <KPICard
    title="Active Campaigns"
    value={42}
    trend={{ direction: 'up', percentage: 5.0 }}
    format="number"
  />
);

/**
 * Example 6: Three KPI Cards in a Row (Desktop Layout)
 * Requirements: 2.1, 2.8, 5.5
 * 
 * Shows the typical layout for the LeadsDashboard component
 */
export const KPICardsRowExample = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-[#0f0f0f]">
    <KPICard
      title="Total Revenue"
      value={33846}
      trend={{ direction: 'up', percentage: 12.5 }}
      icon={<DollarSign className="w-5 h-5" />}
      format="currency"
    />
    <KPICard
      title="Marketplace Fees"
      value={12582}
      trend={{ direction: 'down', percentage: 3.2 }}
      icon={<DollarSign className="w-5 h-5" />}
      format="currency"
    />
    <KPICard
      title="Total Leads"
      value={245214}
      trend={{ direction: 'up', percentage: 8.7 }}
      icon={<Users className="w-5 h-5" />}
      format="number"
    />
  </div>
);

/**
 * Example 7: Responsive Stacked Layout (Mobile)
 * Requirements: 5.3
 * 
 * Shows how KPI cards stack vertically on mobile devices
 */
export const KPICardsStackedExample = () => (
  <div className="flex flex-col gap-4 p-4 bg-[#0f0f0f]">
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
);

/**
 * Full Demo Component
 * 
 * Combines all examples for testing and demonstration
 */
export const KPICardDemo = () => {
  return (
    <div className="min-h-screen bg-[#0f0f0f] p-8 space-y-12">
      <section>
        <h2 className="text-2xl font-bold text-white mb-6">Individual KPI Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <TotalRevenueExample />
          <MarketplaceFeesExample />
          <TotalLeadsExample />
          <ConversionRateExample />
          <NoIconExample />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-6">Responsive Layout (Desktop)</h2>
        <KPICardsRowExample />
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-6">Responsive Layout (Mobile)</h2>
        <div className="max-w-md">
          <KPICardsStackedExample />
        </div>
      </section>
    </div>
  );
};

export default KPICardDemo;
