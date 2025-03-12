import { optimize } from "svgo";

const getOptimisedSvgPaths = (svgString: string) => {
  // Remove hardcoded color fill before optimizing so that empty groups are removed
  svgString = svgString
    .replace(/ fill="#010101"/g, "")
    .replace(/<rect fill="none" width="24" height="24"\/>/g, "")
    .replace(/<rect id="SVGID_1_" width="24" height="24"\/>/g, "");

  // Optimize SVG
  const result = optimize(svgString, {
    floatPrecision: 4,
    multipass: true,
    plugins: [
      { name: "cleanupAttrs" },
      { name: "removeDoctype" },
      { name: "removeXMLProcInst" },
      { name: "removeComments" },
      { name: "removeMetadata" },
      { name: "removeTitle" },
      { name: "removeDesc" },
      { name: "removeUselessDefs" },
      { name: "removeEditorsNSData" },
      { name: "removeEmptyAttrs" },
      { name: "removeHiddenElems" },
      { name: "removeEmptyText" },
      { name: "removeViewBox" },
      { name: "cleanupEnableBackground" },
      { name: "minifyStyles" },
      { name: "convertStyleToAttrs" },
      {
        name: "convertColors",
        params: {
          currentColor: true,
        },
      },
      {
        name: "removeAttrs",
        params: {
          attrs: ["*:(.*-)?opacity"],
        },
      },
      { name: "convertPathData" },
      { name: "convertTransform" },
      {
        name: "removeUnknownsAndDefaults",
        params: {
          uselessOverrides: false,
        },
      },
      { name: "removeNonInheritableGroupAttrs" },
      {
        name: "removeUselessStrokeAndFill",
        params: {
          removeNone: true,
        },
      },
      { name: "removeUnusedNS" },
      { name: "cleanupIds" },
      { name: "cleanupNumericValues" },
      { name: "cleanupListOfValues" },
      { name: "moveElemsAttrsToGroup" },
      { name: "moveGroupAttrsToElems" },
      { name: "collapseGroups" },
      { name: "removeRasterImages" },
      { name: "mergePaths" },
      { name: "convertShapeToPath" },
      { name: "sortAttrs" },
      { name: "removeDimensions" },
      { name: "removeElementsByAttr", params: {} },
      { name: "removeStyleElement" },
      { name: "removeScriptElement" },
      { name: "removeEmptyContainers" },
    ],
  });

  // True if the svg has multiple children
  let childrenAsArray = false;
  const jsxResult = optimize(result.data, {
    plugins: [
      {
        name: "svgAsReactFragment",
        fn: () => {
          return {
            root: {
              enter(root) {
                const [svg, ...rootChildren] = root.children;
                if (rootChildren.length > 0) {
                  throw new Error("Expected a single child of the root");
                }
                if (svg.type !== "element" || svg.name !== "svg") {
                  throw new Error("Expected an svg element as the root child");
                }

                if (svg.children.length > 1) {
                  childrenAsArray = true;
                  svg.children.forEach((svgChild, index) => {
                    if (svgChild.type === "element") {
                      svgChild.attributes.key = index.toString();
                      svgChild.name = `SVGChild:${svgChild.name}`;
                    }
                  });
                }
                root.children = svg.children;
              },
            },
          };
        },
      },
    ],
  });

  // Extract the paths from the svg string
  // Clean xml paths
  let paths = jsxResult.data
    .replace(/"\/>/g, '" />')
    .replace(/fill-opacity=/g, "fillOpacity=")
    .replace(/xlink:href=/g, "xlinkHref=")
    .replace(/clip-rule=/g, "clipRule=")
    .replace(/fill-rule=/g, "fillRule=")
    .replace(/stroke-width=/g, "strokeWidth=")
    .replace(/ clip-path=".+?"/g, "")
    .replace(/<clipPath.+?<\/clipPath>/g, "");

  if (childrenAsArray) {
    const pathsCommaSeparated = paths
      .replace(/key="\d+" \/>/g, "$&,")
      .replace(/<\/SVGChild:(\w+)>/g, "</$1>,");
    paths = `[${pathsCommaSeparated}]`;
  }
  paths = paths.replace(/SVGChild:/g, "");

  return paths;
};

export default getOptimisedSvgPaths;
