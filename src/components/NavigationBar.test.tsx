/**
 * Unit tests for NavigationBar component
 * 
 * Tests tab rendering, active state, and user avatar display
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NavigationBar from './NavigationBar';

describe('NavigationBar', () => {
  const mockOnTabChange = vi.fn();

  it('renders all navigation tabs', () => {
    render(
      <NavigationBar
        activeTab="dashboard"
        onTabChange={mockOnTabChange}
        userName="Test User"
      />
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Leads')).toBeInTheDocument();
    expect(screen.getByText('Calculadora')).toBeInTheDocument();
    expect(screen.getByText('Configurações')).toBeInTheDocument();
  });

  it('renders logo', () => {
    render(
      <NavigationBar
        activeTab="dashboard"
        onTabChange={mockOnTabChange}
      />
    );

    expect(screen.getByText('Alob Express')).toBeInTheDocument();
  });

  it('renders user avatar with initials', () => {
    render(
      <NavigationBar
        activeTab="dashboard"
        onTabChange={mockOnTabChange}
        userName="John Doe"
      />
    );

    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('highlights active tab', () => {
    render(
      <NavigationBar
        activeTab="leads"
        onTabChange={mockOnTabChange}
      />
    );

    const leadsTab = screen.getAllByText('Leads')[0]; // Get desktop version
    expect(leadsTab).toHaveClass('text-white');
    expect(leadsTab).toHaveClass('bg-[#1c1c1c]');
  });

  it('calls onTabChange when tab is clicked', () => {
    render(
      <NavigationBar
        activeTab="dashboard"
        onTabChange={mockOnTabChange}
      />
    );

    const leadsTab = screen.getAllByText('Leads')[0]; // Get desktop version
    fireEvent.click(leadsTab);

    expect(mockOnTabChange).toHaveBeenCalledWith('leads');
  });

  it('has correct ARIA attributes', () => {
    render(
      <NavigationBar
        activeTab="dashboard"
        onTabChange={mockOnTabChange}
      />
    );

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Main navigation');

    const dashboardTab = screen.getAllByRole('tab')[0];
    expect(dashboardTab).toHaveAttribute('aria-selected', 'true');
  });

  it('toggles mobile menu', () => {
    render(
      <NavigationBar
        activeTab="dashboard"
        onTabChange={mockOnTabChange}
      />
    );

    const menuButton = screen.getByLabelText('Toggle mobile menu');
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  });

  describe('Keyboard Navigation', () => {
    it('navigates to next tab with ArrowRight', () => {
      render(
        <NavigationBar
          activeTab="dashboard"
          onTabChange={mockOnTabChange}
        />
      );

      const dashboardTab = screen.getAllByRole('tab')[0];
      fireEvent.keyDown(dashboardTab, { key: 'ArrowRight' });

      // Should focus the next tab (Leads)
      const leadsTab = screen.getAllByRole('tab')[1];
      expect(leadsTab).toHaveFocus();
    });

    it('navigates to previous tab with ArrowLeft', () => {
      render(
        <NavigationBar
          activeTab="leads"
          onTabChange={mockOnTabChange}
        />
      );

      const leadsTab = screen.getAllByRole('tab')[1];
      fireEvent.keyDown(leadsTab, { key: 'ArrowLeft' });

      // Should focus the previous tab (Dashboard)
      const dashboardTab = screen.getAllByRole('tab')[0];
      expect(dashboardTab).toHaveFocus();
    });

    it('wraps to first tab when ArrowRight on last tab', () => {
      render(
        <NavigationBar
          activeTab="settings"
          onTabChange={mockOnTabChange}
        />
      );

      const settingsTab = screen.getAllByRole('tab')[3];
      fireEvent.keyDown(settingsTab, { key: 'ArrowRight' });

      // Should wrap to first tab (Dashboard)
      const dashboardTab = screen.getAllByRole('tab')[0];
      expect(dashboardTab).toHaveFocus();
    });

    it('wraps to last tab when ArrowLeft on first tab', () => {
      render(
        <NavigationBar
          activeTab="dashboard"
          onTabChange={mockOnTabChange}
        />
      );

      const dashboardTab = screen.getAllByRole('tab')[0];
      fireEvent.keyDown(dashboardTab, { key: 'ArrowLeft' });

      // Should wrap to last tab (Configurações)
      const settingsTab = screen.getAllByRole('tab')[3];
      expect(settingsTab).toHaveFocus();
    });

    it('focuses first tab with Home key', () => {
      render(
        <NavigationBar
          activeTab="leads"
          onTabChange={mockOnTabChange}
        />
      );

      const leadsTab = screen.getAllByRole('tab')[1];
      fireEvent.keyDown(leadsTab, { key: 'Home' });

      // Should focus first tab (Dashboard)
      const dashboardTab = screen.getAllByRole('tab')[0];
      expect(dashboardTab).toHaveFocus();
    });

    it('focuses last tab with End key', () => {
      render(
        <NavigationBar
          activeTab="dashboard"
          onTabChange={mockOnTabChange}
        />
      );

      const dashboardTab = screen.getAllByRole('tab')[0];
      fireEvent.keyDown(dashboardTab, { key: 'End' });

      // Should focus last tab (Configurações)
      const settingsTab = screen.getAllByRole('tab')[3];
      expect(settingsTab).toHaveFocus();
    });

    it('activates tab with Enter key', () => {
      render(
        <NavigationBar
          activeTab="dashboard"
          onTabChange={mockOnTabChange}
        />
      );

      const leadsTab = screen.getAllByRole('tab')[1];
      fireEvent.keyDown(leadsTab, { key: 'Enter' });

      expect(mockOnTabChange).toHaveBeenCalledWith('leads');
    });

    it('activates tab with Space key', () => {
      render(
        <NavigationBar
          activeTab="dashboard"
          onTabChange={mockOnTabChange}
        />
      );

      const calculatorTab = screen.getAllByRole('tab')[2];
      fireEvent.keyDown(calculatorTab, { key: ' ' });

      expect(mockOnTabChange).toHaveBeenCalledWith('calculator');
    });

    it('only active tab has tabIndex 0', () => {
      render(
        <NavigationBar
          activeTab="leads"
          onTabChange={mockOnTabChange}
        />
      );

      const tabs = screen.getAllByRole('tab').slice(0, 4); // Desktop tabs only
      
      tabs.forEach((tab, index) => {
        if (index === 1) { // Leads tab is active
          expect(tab).toHaveAttribute('tabIndex', '0');
        } else {
          expect(tab).toHaveAttribute('tabIndex', '-1');
        }
      });
    });

    it('has visible focus indicators', () => {
      render(
        <NavigationBar
          activeTab="dashboard"
          onTabChange={mockOnTabChange}
        />
      );

      const dashboardTab = screen.getAllByRole('tab')[0];
      expect(dashboardTab).toHaveClass('focus:ring-2');
      expect(dashboardTab).toHaveClass('focus:ring-[#FF4D00]');
    });
  });
});
