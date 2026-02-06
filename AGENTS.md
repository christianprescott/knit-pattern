# Knitpicker Application Analysis

## Overview

**Knitpicker** is a web application for designing knitting patterns and choosing yarn colors. It combines a static frontend with an optional Python backend to provide pattern visualization, color customization, and AI-powered pattern naming.

## Application Purpose

The app allows users to:

- Design knitting patterns using text-based input where each character represents a stitch
- Visualize patterns in a grid with customizable colors
- Share patterns via URLs with encoded pattern and color data

### Key Features

- Stateless Architecture: All pattern and color data is encoded in URL. No database required. Shareable via URL alone
- Progressive Enhancement: Works without backend (static file serving). Graceful degradation
- Performance-First Design: Canvas rendering for large patterns. Selective CSS loading. Minimal JavaScript framework overhead.
- User Experience: Real-time preview. Mobile-friendly (Web Share API). Responsive layout.

## Architecture

### Three-Tier Structure

1. **Frontend**: React-based SPA. It is designed to run without a backend or compilation process - opening the file from a browser is a supported way to run the app. Any features that depend on a server backend must degrade gracefully.
2. **Backend (Optional)**: Python FastAPI server that adds AI-powered features.
3. **Deployment**: Containerized and deployed on Fly.io

### Data Flow

```
User Input (Text Pattern)
    |----------------------|
    ↓                      ↓
Parse                 Encode (Gzip compression)
    ↓                      ↓
Render on Canvas      Store in URL Parameters
```

## Dockerfile Analysis

A Docker image is used to encapsulate the app's dependencies and deploy it to production.
The base image is `python:3.12-alpine` and care should be taken to ensure the app and its image remains small and efficient.

## server.py Analysis

The server is Python using FastAPI with Pydantic for request validation.

**Environment Variables**:

- `ANTHROPIC_API_KEY`: Required for AI integration. Server will fail to start if missing
- `LOG_LEVEL`: Logging verbosity for development (default: WARNING)
- `RELOAD`: Enable hot-reload for development (default: false)

### API Endpoints

#### POST `/api/names`

**Purpose**: Generate creative names for knitting patterns using Claude AI

**Flow**:

1. Accepts base64-encoded image
2. Sends to Anthropic API with vision capabilities
3. Requests structured JSON output with 2-4 pattern names
4. Returns array of suggested names

#### GET `/health`

**Purpose**: Container healthcheck endpoint

Returns: `{"status": "ok"}`

### Static File Serving

- Serves all files from `./assets` directory
- Handles HTML automatically (index.html as default)
- Mounted at root path `/`

## Assets Folder Analysis

### index.html

**Purpose**: Entry point HTML file that bootstraps the React application

Uses CDN for daisyUI component library and Tailwind CSS. Only includes specific components instead of full library

External Dependencies are loaded by CDN to avoid build process:

- **Tailwind CSS Browser**: JIT compiler for dynamic styling
- **iro.js**: Color picker component
- **React 18.3**: UI framework (production build)
- **React DOM 18.3**: React renderer
- **Sortable.js**: Drag-and-drop library for color swapping
- **Material Symbols**: Google icon font

#### Initialization Logic

An inline script on the page parses URL params and passes them as initial props/state to the App component.

### app.js

**Purpose**: Main application logic implementing the knitting pattern editor

Vanilla React (no JSX) using `createElement` API to avoid build process.

#### Features

##### Compression Functions

gzip is used to reduce URL length for sharing patterns. Backwards compatible with uncompressed patterns.

##### Pattern Parser

Knitting patterns are entered as text, then parsed into two-dimensional array for later processing and rendering.
Any character can be entered as a stitch identifier.

##### URL State Management

Pattern and color state is stored in URL params. This way any pattern can be shared by simply copying the URL.

Params:

- `stitches`: Gzip-compressed pattern text
- `color_X`: Custom color for stitch key X (e.g., `color_A=#ff0000`)

##### AI Integration

When the presence of a web server is detected, the app will enable automatic pattern naming. The rendered canvas image data is sent to the web server and it responds with an array of names for the pattern.

#### React Components

##### `App` (Main Component)

App is the entrypoint to the Knitpicker application. It stores state and manages URL params when changed.

**Color System**:

- **Default Colors**: Generated gradient used before the user has selected colors
- **Custom Colors**: User-selected via color picker. Saved to URL params.
- **Staged Colors**: Temporary preview before committing

When rendered, these colors are merged into each other.

**Layout**:

The left panel (flex-2) displays the canvas with rendered canvas and colors. The canvas may be "zoomed" out to get a better view of large and repeating patterns.

The right panel (flex-1) displays collapsible sections for editing pattern and colors.

A floating button allows the user to conveniently share or copy the pattern link.

##### `StitchContainer`

Renders pattern on HTML5 canvas for performance

**Features**:

- 2x oversampling for crisp rendering
- Click detection for color selection
- Memoized rendering (only updates on stitches/colors change)

##### `AutoTextArea`

Text area for pattern input. Resizes itself as the number of pattern lines grows.

##### `ColorPicker`

Interactive color selection using iro.js

**Features**:

- Box for lightness/saturation and slider for hue
- Animated expansion when active
- Check/close buttons for commit/cancel

##### `ColorInputs`

List of all pattern colors with drag-to-swap

**Features**:

- Sortable.js integration for drag-and-drop
- Boing animation on color label when clicked from canvas

## Security Considerations

- Request size is limited to avoid excessive API usage
- API key and other secrets must be stored in environment variables
- No user authentication (stateless design)

### Potential Improvements

- Rate limiting
- CORS configuration for API endpoints
- Content Security Policy headers

## Deployment

The app is deployed to production on Fly.io. Configuration is in fly.toml. See README.md for deploy info.

## Development Workflow

See README.md for development steps.
