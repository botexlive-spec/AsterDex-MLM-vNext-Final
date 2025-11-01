import { useEffect, useRef } from 'react';

/**
 * Custom hook to trap focus within a component (typically a modal)
 * This improves accessibility by keeping keyboard navigation within the modal
 */
export const useFocusTrap = (isActive: boolean = true) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const element = elementRef.current;
    if (!element) return;

    // Get all focusable elements within the container
    const getFocusableElements = (): HTMLElement[] => {
      if (!element) return [];

      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ];

      const elements = element.querySelectorAll<HTMLElement>(focusableSelectors.join(', '));
      return Array.from(elements).filter(
        (el) => !el.hasAttribute('disabled') && el.getAttribute('tabindex') !== '-1'
      );
    };

    // Focus the first focusable element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Handle tab key to trap focus
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift + Tab
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      }
      // Tab
      else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Store previously focused element
    const previouslyFocusedElement = document.activeElement as HTMLElement;

    // Add event listener
    element.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      element.removeEventListener('keydown', handleKeyDown);

      // Restore focus to previously focused element
      if (previouslyFocusedElement && previouslyFocusedElement.focus) {
        previouslyFocusedElement.focus();
      }
    };
  }, [isActive]);

  return elementRef;
};

export default useFocusTrap;
