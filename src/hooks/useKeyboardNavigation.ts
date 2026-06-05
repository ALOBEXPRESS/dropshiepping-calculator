/**
 * useKeyboardNavigation Hook
 * 
 * Provides keyboard navigation support for table rows.
 * Supports arrow keys for navigation and Enter for selection.
 * 
 * Requirements: 11.4
 */

import { useEffect, useCallback, useRef, useState } from 'react';

interface UseKeyboardNavigationProps {
  itemCount: number;
  onItemSelect?: (index: number) => void;
  onItemEdit?: (index: number) => void;
  enabled?: boolean;
}

/**
 * Hook for keyboard navigation in tables
 * 
 * Features:
 * - Arrow Up/Down: Navigate between rows
 * - Enter: Trigger edit action on current row
 * - Space: Toggle selection on current row
 * - Home: Jump to first row
 * - End: Jump to last row
 * 
 * @param itemCount - Total number of items in the list
 * @param onItemSelect - Callback when item is selected (Space key)
 * @param onItemEdit - Callback when item edit is triggered (Enter key)
 * @param enabled - Whether keyboard navigation is enabled
 */
export function useKeyboardNavigation({
  itemCount,
  onItemSelect,
  onItemEdit,
  enabled = true,
}: UseKeyboardNavigationProps) {
  const focusedIndexRef = useRef<number>(-1);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || itemCount === 0) return;

      const { key } = event;

      // Arrow Down - Move to next item
      if (key === 'ArrowDown') {
        event.preventDefault();
        focusedIndexRef.current = Math.min(focusedIndexRef.current + 1, itemCount - 1);
        setFocusedIndex(focusedIndexRef.current);
        
        // Focus the row
        const row = document.querySelector(`[data-row-index="${focusedIndexRef.current}"]`) as HTMLElement;
        row?.focus();
      }

      // Arrow Up - Move to previous item
      if (key === 'ArrowUp') {
        event.preventDefault();
        focusedIndexRef.current = Math.max(focusedIndexRef.current - 1, 0);
        setFocusedIndex(focusedIndexRef.current);
        
        // Focus the row
        const row = document.querySelector(`[data-row-index="${focusedIndexRef.current}"]`) as HTMLElement;
        row?.focus();
      }

      // Home - Jump to first item
      if (key === 'Home') {
        event.preventDefault();
        focusedIndexRef.current = 0;
        setFocusedIndex(0);
        
        const row = document.querySelector(`[data-row-index="0"]`) as HTMLElement;
        row?.focus();
      }

      // End - Jump to last item
      if (key === 'End') {
        event.preventDefault();
        focusedIndexRef.current = itemCount - 1;
        setFocusedIndex(itemCount - 1);
        
        const row = document.querySelector(`[data-row-index="${itemCount - 1}"]`) as HTMLElement;
        row?.focus();
      }

      // Enter - Trigger edit action
      if (key === 'Enter' && focusedIndexRef.current >= 0) {
        event.preventDefault();
        onItemEdit?.(focusedIndexRef.current);
      }

      // Space - Toggle selection
      if (key === ' ' && focusedIndexRef.current >= 0) {
        event.preventDefault();
        onItemSelect?.(focusedIndexRef.current);
      }
    },
    [enabled, itemCount, onItemSelect, onItemEdit]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return {
    focusedIndex,
  };
}
