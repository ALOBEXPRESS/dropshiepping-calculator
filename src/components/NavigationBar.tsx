/**
 * NavigationBar Component
 * 
 * Internal navigation component for the LeadsDashboard with logo, tabs, and user avatar.
 * Replaces the previous page title "Leads" and subtitle from the original design.
 * 
 * Features:
 * - Fixed positioning at top of viewport (z-index: 50)
 * - Dark theme colors (#0f0f0f background, #1c1c1c hover states)
 * - Four navigation tabs: Dashboard, Leads, Calculadora, Configurações
 * - User avatar on the right side
 * - Active tab highlighting with underline
 * - Responsive: hamburger menu on mobile (< 768px)
 */

import React, { useState, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export interface NavigationBarProps {
  activeTab: 'dashboard' | 'leads' | 'calculator' | 'settings';
  onTabChange: (tab: NavigationBarProps['activeTab']) => void;
  userName?: string;
  userAvatar?: string;
}

const NavigationBar: React.FC<NavigationBarProps> = ({
  activeTab,
  onTabChange,
  userName = 'Admin User',
  userAvatar,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Refs for managing keyboard navigation focus
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const mobileTabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  const tabs = [
    { id: 'dashboard' as const, label: 'Painel' },
    { id: 'leads' as const, label: 'Leads' },
    { id: 'calculator' as const, label: 'Calculadora' },
    { id: 'settings' as const, label: 'Configurações' },
  ];

  const handleTabClick = (tabId: NavigationBarProps['activeTab']) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  /**
   * Handle keyboard navigation for tabs (WCAG 2.1 compliant)
   * 
   * Implements ARIA Authoring Practices Guide (APG) tab pattern:
   * https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
   * 
   * Keyboard interactions:
   * - ArrowRight: Move focus to next tab (wraps to first if at end)
   * - ArrowLeft: Move focus to previous tab (wraps to last if at start)
   * - Home: Move focus to first tab
   * - End: Move focus to last tab
   * - Enter/Space: Activate the focused tab
   * 
   * Roving tabindex pattern:
   * - Only the active tab has tabIndex={0} (keyboard focusable)
   * - Other tabs have tabIndex={-1} (not in tab order, but focusable via arrow keys)
   * 
   * @param e - Keyboard event
   * @param currentTabId - ID of the currently focused tab
   * @param isMobile - Whether this is the mobile menu (uses different refs)
   */
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    currentTabId: NavigationBarProps['activeTab'],
    isMobile: boolean = false
  ) => {
    const currentIndex = tabs.findIndex((tab) => tab.id === currentTabId);
    const refs = isMobile ? mobileTabRefs : tabRefs;
    let targetIndex: number | null = null;

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        // Move to next tab, wrap to first if at end
        targetIndex = (currentIndex + 1) % tabs.length;
        break;

      case 'ArrowLeft':
        e.preventDefault();
        // Move to previous tab, wrap to last if at start
        targetIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
        break;

      case 'Home':
        e.preventDefault();
        // Focus first tab
        targetIndex = 0;
        break;

      case 'End':
        e.preventDefault();
        // Focus last tab
        targetIndex = tabs.length - 1;
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        // Activate the current tab
        handleTabClick(currentTabId);
        return;

      default:
        return;
    }

    // Focus the target tab if a navigation key was pressed
    if (targetIndex !== null) {
      const targetTab = tabs[targetIndex];
      const targetRef = refs.current[targetTab.id];
      if (targetRef) {
        targetRef.focus();
      }
    }
  };

  // Get user initials for avatar fallback
  const getUserInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:bg-[#FF4D00] focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
      >
        Pular para o conteúdo principal
      </a>

      <nav
        className="fixed top-0 left-0 right-0 z-50 bg-[#0f0f0f] border-b border-[#1c1c1c]"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="h-16 px-4 md:px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl md:text-2xl font-bold text-white">
              Alob Express
            </h1>
          </div>

          {/* Desktop Navigation Tabs */}
          <div 
            className="hidden md:flex items-center gap-1"
            role="tablist"
            aria-label="Seções do painel"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                ref={(el) => { tabRefs.current[tab.id] = el; }}
                onClick={() => handleTabClick(tab.id)}
                onKeyDown={(e) => handleKeyDown(e, tab.id, false)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  'hover:bg-[#1c1c1c] focus:outline-none focus:ring-2 focus:ring-[#FF4D00] focus:ring-offset-2 focus:ring-offset-[#0f0f0f]',
                  activeTab === tab.id
                    ? 'text-white bg-[#1c1c1c] border-b-2 border-[#FF4D00]'
                    : 'text-gray-400'
                )}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`${tab.id}-panel`}
                tabIndex={activeTab === tab.id ? 0 : -1}
              >
                {tab.label}
              </button>
            ))}
          </div>

        {/* Right Side: User Avatar and Mobile Menu Button */}
        <div className="flex items-center gap-3">
          {/* User Avatar */}
          <Avatar className="h-9 w-9">
            {userAvatar && <AvatarImage src={userAvatar} alt={userName} />}
            <AvatarFallback className="bg-[#1c1c1c] text-white text-sm">
              {getUserInitials(userName)}
            </AvatarFallback>
          </Avatar>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-[#1c1c1c] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF4D00]"
            aria-label="Alternar menu mobile"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div 
          id="mobile-menu"
          className="md:hidden bg-[#0f0f0f] border-t border-[#1c1c1c]"
          role="tablist"
          aria-label="Dashboard sections"
        >
          <div className="px-4 py-3 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                ref={(el) => { mobileTabRefs.current[tab.id] = el; }}
                onClick={() => handleTabClick(tab.id)}
                onKeyDown={(e) => handleKeyDown(e, tab.id, true)}
                className={cn(
                  'w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                  'hover:bg-[#1c1c1c] focus:outline-none focus:ring-2 focus:ring-[#FF4D00]',
                  activeTab === tab.id
                    ? 'text-white bg-[#1c1c1c] border-l-4 border-[#FF4D00]'
                    : 'text-gray-400'
                )}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`${tab.id}-panel`}
                tabIndex={activeTab === tab.id ? 0 : -1}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
    </>
  );
};

export default NavigationBar;
