import '@testing-library/jest-dom'

// Mock ResizeObserver for Recharts components
(globalThis as any).ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
