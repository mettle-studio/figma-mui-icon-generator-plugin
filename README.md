# Figma MUI Icon Generator Plugin

A Figma plugin that converts your icon designs into Material-UI (MUI) compatible React SVG icon components.

## Features

- Convert any Figma vector or component into MUI-compatible icon code
- Optimizes SVG paths using SVGO
- Creates React components using MUI's `createSvgIcon` function
- Preserves original icon structure while removing unnecessary attributes
- Follows MUI icon conventions (uses currentColor, proper React JSX syntax)

## Installation

1. Get this source code
2. Add a development plugin in Figma, pointing at the `dist` folder manifest file

## Usage

1. Select a single icon in your Figma document
2. Run the plugin from the Plugins menu
3. The plugin will generate the React component code
4. Copy the code and use it in your React application

## Development

### Prerequisites

- Node.js
- pnpm

### Setup

```bash
# Clone this repository
git clone https://github.com/yourusername/figma-mui-icon-generator-plugin.git

# Navigate to the directory
cd figma-mui-icon-generator-plugin

# Install dependencies
pnpm install
```

### Available Scripts

- `pnpm dev` - Start development mode
- `pnpm build` - Build the plugin
- `pnpm preview` - Preview the plugin
- `pnpm release` - Release the plugin

## How It Works

This plugin:

1. Exports the selected icon as SVG
2. Removes hardcoded colors and empty elements
3. Optimizes the SVG structure using SVGO
4. Converts the SVG to React-compatible JSX
5. Creates a complete React component using MUI's `createSvgIcon`
