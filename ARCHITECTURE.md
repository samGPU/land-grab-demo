# Architecture Overview

## Project Vision

This project is a **persistent, globe-based strategy game** where players navigate a 3D Earth, acquire land segments, and build structures that generate in-game currency over time.

The game is intended to run as:
- A **web application**
- A future **iOS application**

The codebase is designed from the start to support both platforms without a rewrite.

---

## Core Gameplay Concepts (Long-Term)

- The Earth is divided into **hexagonal land segments** using the **H3 geospatial index**
- Each segment can be:
  - Owned by a player
  - Unowned and available for purchase
  - Developed with structures
- Players have an in-game **currency**
- Players can:
  - Spend currency to buy land
  - Build structures on owned land
  - Earn additional currency from structures over time
- Ownership, currency, and structures persist across sessions

---

## Platform Targets

### Web (Initial)
- Runs in the browser
- Uses WebGL via Three.js
- Desktop + mobile browser support

### iOS (Future)
- Built using React Native / Expo
- Reuses the same core logic and domain models
- Uses a native Three.js renderer
- No WebView-based approach

**Key Principle:**  
> Rendering is platform-specific. Game logic is not.

---

## Technology Stack

### Frontend
- **React**
- **Vite** (bundler)
- **Vanilla JavaScript** (NO TypeScript)

### 3D / Globe
- **three**
- **react-three-fibre**
- **globe.gl** (initially, or equivalent Three primitives)
- **h3-js** (H3 resolution 12)

### Backend / Services (Planned)
- **Firebase Authentication**
  - User accounts
  - Anonymous → authenticated upgrade path
- **Cloud Firestore**
  - Land ownership
  - Structures
  - Player currency
  - Game state persistence

---

---

## Renderer Swapping & Input Abstraction

A core architectural requirement of this project is the ability to **swap rendering targets** without rewriting game logic or interaction semantics.

### Renderer Strategy

The project uses **react-three-fibre** as an abstraction layer over Three.js.

- Web uses:
  - `react-three-fibre` (web renderer)
- Native (iOS) will use:
  - `@react-three/fiber/native`

The viewer layer is written so that:
- The scene graph is renderer-agnostic
- No viewer components depend on browser-only APIs
- No assumptions are made about mouse vs touch input

**Key Principle:**
> The globe viewer is portable. Only the renderer changes.

---

### Input Abstraction Strategy

Input is handled in **three layers**:

1. **Platform Input Layer**
   - Web: mouse / pointer events
   - Native: touch / gesture events
2. **Interaction Mapping Layer**
   - Converts low-level input into semantic actions
3. **Domain Events**
   - Consumed by the internal API and game logic

This ensures that:
- Mouse and touch differences are isolated
- Interaction logic is reusable across platforms
- The same semantic events are emitted on web and iOS

---

### Input Flow Example

```txt
[ Web Mouse Event ]
        ↓
platform/web/input.js
        ↓
interactions/pointerEvents.js
        ↓
events/CELL_SELECTED
        ↓
api/landApi.js
```

---

## Architectural Principles

### 1. Strict Layer Separation

The codebase is divided into layers with **clear responsibilities**:

- Rendering does not own game rules
- Game logic does not know about rendering
- Platform-specific code is isolated
- Backend access goes through a defined internal API

This allows:
- Easy mobile export
- Easier multiplayer support
- Easier testing
- Safer refactors

---

### 2. Platform-Agnostic Core

All rules, calculations, and domain concepts live in a **pure JavaScript core** that:
- Uses no browser APIs
- Uses no React
- Can run in web, native, or server environments

---

### 3. Viewer-First Development

Early milestones focus on:
- Rendering the globe
- Selecting land segments
- Emitting semantic interaction events

Persistence, auth, and economy are layered in later without changing the viewer.

### Forbidden Patterns

- Viewer components using window, document, or DOM APIs
- Interaction logic depending on mouse-specific properties
- Game logic importing from platform or Platform code implementing game rules

---

## High-Level Directory Structure

```txt
src/
  core/                # Platform-agnostic game logic (NO React, NO DOM)
    h3/                # H3 utilities, grid generation
    domain/            # Currency, land, structures, player models
    events/            # Domain event definitions (e.g. LAND_SELECTED)
    rules/             # Economy and progression rules

  api/                 # Internal API boundary
    landApi.js         # Ownership, selection, purchasing (stubbed initially)
    playerApi.js       # Currency, player state (stubbed initially)

  viewer/              # Rendering-only layer (React + R3F)
    GlobeScene.jsx
    HexGrid.jsx
    LandMesh.jsx

  platform/
    web/
      input.js         # Mouse / pointer bindings
    native/
      input.js         # Touch / gesture bindings

  App.jsx              # Application shell
  main.jsx             # Vite entry point
```
