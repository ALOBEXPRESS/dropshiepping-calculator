/**
 * Leads Page
 * 
 * Modern analytics dashboard for leads tracking.
 * Replaces the previous conversion funnel and gender distribution interface
 * with a KPI-focused layout following the Boostboard reference design.
 * 
 * Integration: Task 28 - Final integration and deployment preparation
 * Spec: .kiro/specs/leads-dashboard-component/
 */

import React from 'react';
import LeadsDashboard from '@/components/LeadsDashboard';

const Leads: React.FC = () => {
  return <LeadsDashboard />;
};

export default Leads;
