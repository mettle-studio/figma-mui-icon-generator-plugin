import getOptimisedSvgPaths from "./getOptimisedSvgPaths";
import { encode } from "html-entities";

export default async () => {
  // Check if anything is selected
  if (figma.currentPage.selection.length === 0) {
    figma.notify("Please select at least one icon component", {
      error: true,
    });
    figma.closePlugin();
    return;
  }

  const selectedNodes = figma.currentPage.selection;
  if (selectedNodes.length > 1) {
    figma.notify("Please select only one icon component", { error: true });
    figma.closePlugin();
    return;
  }

  const node = selectedNodes[0];

  try {
    // Make sure node is visible and exportable
    if (!node.visible) {
      throw new Error(`Node "${node.name}" is not visible.`);
    }
    const exportableNode = node as unknown as { exportAsync?: Function };
    if (typeof exportableNode.exportAsync !== "function") {
      throw new Error(`Node "${node.name}" is not exportable.`);
    }

    const svg = await exportableNode.exportAsync({
      format: "SVG",
      svgOutlineText: true,
      svgIdAttribute: false, // Don't include "id" attribute as per requirements
      svgSimplifyStroke: true, // Simplify stroke as per requirements
    });

    let svgString = "";
    try {
      const bytes = new Uint8Array(svg);

      let result = "";
      for (let i = 0; i < bytes.length; i++) {
        result += String.fromCharCode(bytes[i]);
      }
      svgString = result;
    } catch (error) {
      throw new Error(`SVG decoding failed: ${error}`);
    }

    if (!svgString || svgString.length === 0) {
      throw new Error(
        `Failed to decode SVG for "${node.name}" - result is empty`
      );
    }

    const paths = getOptimisedSvgPaths(svgString);

    const fileString = `
import { createSvgIcon } from '@mui/material';

export default createSvgIcon(
  ${paths},
  '${node.name}'
);`;

    figma.showUI(
      `<div>
        <pre>${encode(fileString)}</pre>
      </div>`,
      {
        width: 1000,
        height: 200,
      }
    );
  } catch (error: any) {
    console.error(error);
    figma.notify(
      `Error exporting "${node.name}": ${error.message || "Unknown error"}`,
      { error: true }
    );
    figma.closePlugin();
  }
};
