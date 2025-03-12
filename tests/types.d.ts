// Type definitions for the Figma API that are needed in tests
declare const figma: {
  currentPage: {
    selection: any[];
  };
  notify: (message: string, options?: { error?: boolean }) => void;
  closePlugin: () => void;
  showUI: (html: string, options?: { width?: number; height?: number }) => void;
};