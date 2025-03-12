import { vi } from 'vitest';

// Mock Figma API
Object.defineProperty(global, 'figma', {
  value: {
    currentPage: {
      selection: []
    },
    notify: vi.fn(),
    closePlugin: vi.fn(),
    showUI: vi.fn()
  },
  writable: true
});