/**
 * NavigationBar Component Usage Example
 * 
 * This file demonstrates how to use the NavigationBar component
 * in the LeadsDashboard or other pages.
 */

import React, { useState } from 'react';
import NavigationBar from './NavigationBar';

export const NavigationBarExample: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leads' | 'calculator' | 'settings'>('dashboard');

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* NavigationBar Component */}
      <NavigationBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userName="John Doe"
        userAvatar="https://github.com/shadcn.png" // Optional: provide avatar URL
      />

      {/* Main Content - Add padding-top to account for fixed navbar */}
      <main className="pt-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-4">
            Current Tab: {activeTab}
          </h2>
          <p className="text-gray-400">
            This is the content area. The NavigationBar is fixed at the top.
          </p>
        </div>
      </main>
    </div>
  );
};

export default NavigationBarExample;
