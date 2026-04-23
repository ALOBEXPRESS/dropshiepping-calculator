/**
 * TimePeriodFilter Component Tests
 * 
 * Tests for the TimePeriodFilter component covering:
 * - Button rendering and labels
 * - Active state styling
 * - Disabled state
 * - onPeriodChange callback
 * - Keyboard navigation (Tab, Enter, Space, Arrow keys)
 * - Accessibility (ARIA attributes, focus management)
 * 
 * Requirements: 2.1, 2.9, 6.1, 6.3
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TimePeriodFilter from './TimePeriodFilter';

describe('TimePeriodFilter', () => {
  describe('Rendering', () => {
    it('should render all five period buttons', () => {
      const mockOnChange = vi.fn();
      render(
        <TimePeriodFilter
          selectedPeriod="week"
          onPeriodChange={mockOnChange}
        />
      );

      expect(screen.getByText('Dia')).toBeInTheDocument();
      expect(screen.getByText('Semana')).toBeInTheDocument();
      expect(screen.getByText('Mês')).toBeInTheDocument();
      expect(screen.getByText('Ano')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
    });

    it('should have correct ARIA labels', () => {
      const mockOnChange = vi.fn();
      render(
        <TimePeriodFilter
          selectedPeriod="week"
          onPeriodChange={mockOnChange}
        />
      );

      expect(screen.getByLabelText('Filtrar por dia')).toBeInTheDocument();
      expect(screen.getByLabelText('Filtrar por semana')).toBeInTheDocument();
      expect(screen.getByLabelText('Filtrar por mês')).toBeInTheDocument();
      expect(screen.getByLabelText('Filtrar por ano')).toBeInTheDocument();
      expect(screen.getByLabelText('Filtrar por total')).toBeInTheDocument();
    });

    it('should have group role with label', () => {
      const mockOnChange = vi.fn();
      const { container } = render(
        <TimePeriodFilter
          selectedPeriod="week"
          onPeriodChange={mockOnChange}
        />
      );

      const group = container.querySelector('[role="group"]');
      expect(group).toBeInTheDocument();
      expect(group).toHaveAttribute('aria-label', 'Filtro de período de tempo');
    });
  });

  describe('Active State', () => {
    it('should apply active styling to selected period', () => {
      const mockOnChange = vi.fn();
      render(
        <TimePeriodFilter
          selectedPeriod="month"
          onPeriodChange={mockOnChange}
        />
      );

      const monthButton = screen.getByText('Mês');
      expect(monthButton).toHaveClass('bg-[#FF4D00]', 'text-white');
      expect(monthButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should apply inactive styling to non-selected periods', () => {
      const mockOnChange = vi.fn();
      render(
        <TimePeriodFilter
          selectedPeriod="month"
          onPeriodChange={mockOnChange}
        />
      );

      const dayButton = screen.getByText('Dia');
      expect(dayButton).toHaveClass('bg-transparent', 'text-[#a3a3a3]');
      expect(dayButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should update active state when selectedPeriod prop changes', () => {
      const mockOnChange = vi.fn();
      const { rerender } = render(
        <TimePeriodFilter
          selectedPeriod="week"
          onPeriodChange={mockOnChange}
        />
      );

      let weekButton = screen.getByText('Semana');
      expect(weekButton).toHaveClass('bg-[#FF4D00]');

      rerender(
        <TimePeriodFilter
          selectedPeriod="year"
          onPeriodChange={mockOnChange}
        />
      );

      weekButton = screen.getByText('Semana');
      const yearButton = screen.getByText('Ano');
      expect(weekButton).not.toHaveClass('bg-[#FF4D00]');
      expect(yearButton).toHaveClass('bg-[#FF4D00]');
    });
  });

  describe('Disabled State', () => {
    it('should disable all buttons when disabled prop is true', () => {
      const mockOnChange = vi.fn();
      render(
        <TimePeriodFilter
          selectedPeriod="week"
          onPeriodChange={mockOnChange}
          disabled={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
        expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
      });
    });

    it('should not call onPeriodChange when disabled', () => {
      const mockOnChange = vi.fn();
      render(
        <TimePeriodFilter
          selectedPeriod="week"
          onPeriodChange={mockOnChange}
          disabled={true}
        />
      );

      const dayButton = screen.getByText('Dia');
      fireEvent.click(dayButton);

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should not respond to keyboard events when disabled', () => {
      const mockOnChange = vi.fn();
      render(
        <TimePeriodFilter
          selectedPeriod="week"
          onPeriodChange={mockOnChange}
          disabled={true}
        />
      );

      const weekButton = screen.getByText('Semana');
      fireEvent.keyDown(weekButton, { key: 'Enter' });
      fireEvent.keyDown(weekButton, { key: ' ' });

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Click Interaction', () => {
    it('should call onPeriodChange with correct period when clicked', () => {
      const mockOnChange = vi.fn();
      render(
        <TimePeriodFilter
          selectedPeriod="week"
          onPeriodChange={mockOnChange}
        />
      );

      const monthButton = screen.getByText('Mês');
      fireEvent.click(monthButton);

      expect(mockOnChange).toHaveBeenCalledWith('month');
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('should call onPeriodChange for each different period', () => {
      const mockOnChange = vi.fn();
      render(
        <TimePeriodFilter
          selectedPeriod="week"
          onPeriodChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByText('Dia'));
      expect(mockOnChange).toHaveBeenCalledWith('day');

      fireEvent.click(screen.getByText('Ano'));
      expect(mockOnChange).toHaveBeenCalledWith('year');

      fireEvent.click(screen.getByText('Total'));
      expect(mockOnChange).toHaveBeenCalledWith('total');

      expect(mockOnChange).toHaveBeenCalledTimes(3);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should activate period on Enter key', () => {
      const mockOnChange = vi.fn();
      render(
        <TimePeriodFilter
          selectedPeriod="week"
          onPeriodChange={mockOnChange}
        />
      );

      const monthButton = screen.getByText('Mês');
      fireEvent.keyDown(monthButton, { key: 'Enter' });

      expect(mockOnChange).toHaveBeenCalledWith('month');
    });

    it('should activate period on Space key', () => {
      const mockOnChange = vi.fn();
      render(
        <TimePeriodFilter
          selectedPeriod="week"
          onPeriodChange={mockOnChange}
        />
      );

      const yearButton = screen.getByText('Ano');
      fireEvent.keyDown(yearButton, { key: ' ' });

      expect(mockOnChange).toHaveBeenCalledWith('year');
    });

    it('should move focus to next button on ArrowRight', () => {
      const mockOnChange = vi.fn();
      render(
        <TimePeriodFilter
          selectedPeriod="week"
          onPeriodChange={mockOnChange}
        />
      );

      const weekButton = screen.getByText('Semana');
      const monthButton = screen.getByText('Mês');

      weekButton.focus();
      fireEvent.keyDown(weekButton, { key: 'ArrowRight' });

      expect(document.activeElement).toBe(monthButton);
    });

    it('should move focus to previous button on ArrowLeft', () => {
      const mockOnChange = vi.fn();
      render(
        <TimePeriodFilter
          selectedPeriod="month"
          onPeriodChange={mockOnChange}
        />
      );

      const monthButton = screen.getByText('Mês');
      const weekButton = screen.getByText('Semana');

      monthButton.focus();
      fireEvent.keyDown(monthButton, { key: 'ArrowLeft' });

      expect(document.activeElement).toBe(weekButton);
    });

    it('should wrap to first button when ArrowRight at end', () => {
      const mockOnChange = vi.fn();
      render(
        <TimePeriodFilter
          selectedPeriod="total"
          onPeriodChange={mockOnChange}
        />
      );

      const totalButton = screen.getByText('Total');
      const dayButton = screen.getByText('Dia');

      totalButton.focus();
      fireEvent.keyDown(totalButton, { key: 'ArrowRight' });

      expect(document.activeElement).toBe(dayButton);
    });

    it('should wrap to last button when ArrowLeft at start', () => {
      const mockOnChange = vi.fn();
      render(
        <TimePeriodFilter
          selectedPeriod="day"
          onPeriodChange={mockOnChange}
        />
      );

      const dayButton = screen.getByText('Dia');
      const totalButton = screen.getByText('Total');

      dayButton.focus();
      fireEvent.keyDown(dayButton, { key: 'ArrowLeft' });

      expect(document.activeElement).toBe(totalButton);
    });

    it('should move focus to first button on Home key', () => {
      const mockOnChange = vi.fn();
      render(
        <TimePeriodFilter
          selectedPeriod="year"
          onPeriodChange={mockOnChange}
        />
      );

      const yearButton = screen.getByText('Ano');
      const dayButton = screen.getByText('Dia');

      yearButton.focus();
      fireEvent.keyDown(yearButton, { key: 'Home' });

      expect(document.activeElement).toBe(dayButton);
    });

    it('should move focus to last button on End key', () => {
      const mockOnChange = vi.fn();
      render(
        <TimePeriodFilter
          selectedPeriod="day"
          onPeriodChange={mockOnChange}
        />
      );

      const dayButton = screen.getByText('Dia');
      const totalButton = screen.getByText('Total');

      dayButton.focus();
      fireEvent.keyDown(dayButton, { key: 'End' });

      expect(document.activeElement).toBe(totalButton);
    });
  });

  describe('Accessibility', () => {
    it('should use roving tabindex pattern', () => {
      const mockOnChange = vi.fn();
      render(
        <TimePeriodFilter
          selectedPeriod="week"
          onPeriodChange={mockOnChange}
        />
      );

      const weekButton = screen.getByText('Semana');
      const dayButton = screen.getByText('Dia');
      const monthButton = screen.getByText('Mês');

      // Only selected button should have tabIndex 0
      expect(weekButton).toHaveAttribute('tabIndex', '0');
      expect(dayButton).toHaveAttribute('tabIndex', '-1');
      expect(monthButton).toHaveAttribute('tabIndex', '-1');
    });

    it('should have focus ring styles', () => {
      const mockOnChange = vi.fn();
      render(
        <TimePeriodFilter
          selectedPeriod="week"
          onPeriodChange={mockOnChange}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-[#FF4D00]');
      });
    });
  });
});
