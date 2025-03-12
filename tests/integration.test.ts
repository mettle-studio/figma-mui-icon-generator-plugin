import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "fs";
import path from "path";
import { decode } from "html-entities";

import main from "../src/main";

// Use the mock Figma API from setupTests.ts
const mockFigma = figma as unknown as {
  currentPage: { selection: any[] };
  notify: ReturnType<typeof vi.fn>;
  closePlugin: ReturnType<typeof vi.fn>;
  showUI: ReturnType<typeof vi.fn>;
};

// Helper function to read SVG fixture files
function readSvgFixture(filename: string): Uint8Array {
  const filePath = path.join(__dirname, "fixtures", filename);
  const content = fs.readFileSync(filePath, "utf-8");
  return new TextEncoder().encode(content);
}

describe("MUI Icon Generator Plugin - Integration Tests", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();
    mockFigma.currentPage.selection = [];
  });

  describe("Selection Validation", () => {
    it("should notify user when no node is selected", async () => {
      await main();

      expect(mockFigma.notify).toHaveBeenCalledWith(
        "Please select at least one icon component",
        { error: true }
      );
      expect(mockFigma.closePlugin).toHaveBeenCalled();
      expect(mockFigma.showUI).not.toHaveBeenCalled();
    });

    it("should notify user when multiple nodes are selected", async () => {
      mockFigma.currentPage.selection = [
        { name: "icon1", visible: true },
        { name: "icon2", visible: true },
      ];

      await main();

      expect(mockFigma.notify).toHaveBeenCalledWith(
        "Please select only one icon component",
        { error: true }
      );
      expect(mockFigma.closePlugin).toHaveBeenCalled();
      expect(mockFigma.showUI).not.toHaveBeenCalled();
    });

    it("should notify user when selected node is not visible", async () => {
      mockFigma.currentPage.selection = [
        { name: "invisibleIcon", visible: false },
      ];

      await main();

      expect(mockFigma.notify).toHaveBeenCalledWith(
        expect.stringContaining(
          'Error exporting "invisibleIcon": Node "invisibleIcon" is not visible'
        ),
        { error: true }
      );
      expect(mockFigma.closePlugin).toHaveBeenCalled();
      expect(mockFigma.showUI).not.toHaveBeenCalled();
    });

    it("should notify user when selected node is not exportable", async () => {
      mockFigma.currentPage.selection = [
        { name: "nonExportableIcon", visible: true },
      ];

      await main();

      expect(mockFigma.notify).toHaveBeenCalledWith(
        expect.stringContaining(
          'Error exporting "nonExportableIcon": Node "nonExportableIcon" is not exportable'
        ),
        { error: true }
      );
      expect(mockFigma.closePlugin).toHaveBeenCalled();
      expect(mockFigma.showUI).not.toHaveBeenCalled();
    });
  });

  describe("SVG Export & Processing", () => {
    it("should generate a complete React component from a simple icon", async () => {
      // Create a mock exportable node with a real SVG from the fixture
      const mockNode = {
        name: "HomeIcon",
        visible: true,
        exportAsync: vi.fn().mockResolvedValue(readSvgFixture("homeIcon.svg")),
      };

      mockFigma.currentPage.selection = [mockNode];

      await main();

      // Check that exportAsync was called with the correct parameters
      expect(mockNode.exportAsync).toHaveBeenCalledWith({
        format: "SVG",
        svgOutlineText: true,
        svgIdAttribute: false,
        svgSimplifyStroke: true,
      });

      // Check that showUI was called with the correct React component code
      expect(mockFigma.showUI).toHaveBeenCalled();

      const uiContent = decode(mockFigma.showUI.mock.calls[0][0]);

      // Verify the component structure
      expect(uiContent).toContain(
        "import { createSvgIcon } from '@mui/material';"
      );
      expect(uiContent).toContain("export default createSvgIcon(");
      expect(uiContent).toContain(
        '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"'
      );
      expect(uiContent).toContain("'HomeIcon'");

      // Original color should be removed
      expect(uiContent).not.toContain('fill="#010101"');

      // No error notification should be shown
      expect(mockFigma.notify).not.toHaveBeenCalled();
    });

    it("should process complex icon with multiple elements", async () => {
      // Create a mock exportable node with a complex SVG from the fixture
      const mockNode = {
        name: "ComplexIcon",
        visible: true,
        exportAsync: vi
          .fn()
          .mockResolvedValue(readSvgFixture("complexIcon.svg")),
      };

      mockFigma.currentPage.selection = [mockNode];

      await main();

      // Check that showUI was called
      expect(mockFigma.showUI).toHaveBeenCalled();

      const uiContent = decode(mockFigma.showUI.mock.calls[0][0]);

      // The component should include both paths
      expect(uiContent).toContain(
        "import { createSvgIcon } from '@mui/material';"
      );
      expect(uiContent).toContain("export default createSvgIcon(");

      // Should contain the path data from both paths
      expect(uiContent).toContain("M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z");
      expect(uiContent).toContain("M15 11h2v2h-2z");

      // Original rectangle with fill="none" should be removed
      expect(uiContent).not.toContain('rect fill="none"');

      // Original colors should be removed
      expect(uiContent).not.toContain('fill="#010101"');

      // No error notification should be shown
      expect(mockFigma.notify).not.toHaveBeenCalled();
    });

    it("should handle errors during SVG processing", async () => {
      // Setup a node that will throw during exportAsync
      const mockNode = {
        name: "ErrorIcon",
        visible: true,
        exportAsync: vi.fn().mockRejectedValue(new Error("Export failed")),
      };

      mockFigma.currentPage.selection = [mockNode];

      await main();

      expect(mockFigma.notify).toHaveBeenCalledWith(
        'Error exporting "ErrorIcon": Export failed',
        { error: true }
      );
      expect(mockFigma.closePlugin).toHaveBeenCalled();
      expect(mockFigma.showUI).not.toHaveBeenCalled();
    });

    it("should handle empty SVG export results", async () => {
      // Create an empty mock SVG buffer
      const mockSvgBuffer = new TextEncoder().encode("");

      const mockNode = {
        name: "EmptyIcon",
        visible: true,
        exportAsync: vi.fn().mockResolvedValue(mockSvgBuffer),
      };

      mockFigma.currentPage.selection = [mockNode];

      await main();

      expect(mockFigma.notify).toHaveBeenCalledWith(
        expect.stringContaining(
          'Error exporting "EmptyIcon": Failed to decode SVG'
        ),
        { error: true }
      );
      expect(mockFigma.closePlugin).toHaveBeenCalled();
    });
  });

  describe("SVG Format Conversions", () => {
    it("should convert XML attributes to React camelCase format", async () => {
      // Create a custom SVG with XML attributes that need conversion
      const svgWithXmlAttrs = `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill-rule="evenodd"/>
      </svg>`;

      const mockNode = {
        name: "XmlAttrIcon",
        visible: true,
        exportAsync: vi
          .fn()
          .mockResolvedValue(new TextEncoder().encode(svgWithXmlAttrs)),
      };

      mockFigma.currentPage.selection = [mockNode];

      await main();

      const uiContent = decode(mockFigma.showUI.mock.calls[0][0]);

      // Should convert XML attributes to React camelCase
      expect(uiContent).toContain("fillRule");

      // Should not contain kebab-case attributes
      expect(uiContent).not.toContain("fill-rule");
    });

    it("should handle SVGs with clip-path elements and references", async () => {
      // Create a custom SVG with clip-path
      const svgWithClipPath = `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <clipPath id="clip0">
          <rect width="24" height="24" fill="white"/>
        </clipPath>
        <path clip-path="url(#clip0)" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
      </svg>`;

      const mockNode = {
        name: "ClipPathIcon",
        visible: true,
        exportAsync: vi
          .fn()
          .mockResolvedValue(new TextEncoder().encode(svgWithClipPath)),
      };

      mockFigma.currentPage.selection = [mockNode];

      await main();

      const uiContent = decode(mockFigma.showUI.mock.calls[0][0]);

      // Should remove clipPath elements and attributes
      expect(uiContent).not.toContain("<clipPath");
      expect(uiContent).not.toContain('clip-path="url(#clip0)"');

      // Should still contain the path
      expect(uiContent).toContain(
        '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"'
      );
    });

    it("should remove hardcoded colors and empty elements", async () => {
      // Create a custom SVG with hardcoded colors and empty elements
      const svgWithHardcodedColors = `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="#010101"/>
        <rect fill="none" width="24" height="24"/>
        <rect id="SVGID_1_" width="24" height="24"/>
      </svg>`;

      const mockNode = {
        name: "ColorIcon",
        visible: true,
        exportAsync: vi
          .fn()
          .mockResolvedValue(new TextEncoder().encode(svgWithHardcodedColors)),
      };

      mockFigma.currentPage.selection = [mockNode];

      await main();

      const uiContent = decode(mockFigma.showUI.mock.calls[0][0]);

      // Should remove hardcoded colors and empty elements
      expect(uiContent).not.toContain('fill="#010101"');
      expect(uiContent).not.toContain(
        '<rect fill="none" width="24" height="24"/>'
      );
      expect(uiContent).not.toContain(
        '<rect id="SVGID_1_" width="24" height="24"/>'
      );

      // Should still contain the path
      expect(uiContent).toContain(
        '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"'
      );
    });
  });
});
