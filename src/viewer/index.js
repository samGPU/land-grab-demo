/**
 * Viewer Layer - Re-export viewer components
 * 
 * ARCHITECTURAL NOTE:
 * The viewer layer is responsible for 3D rendering only.
 * It imports from core (for utilities) and platform (for input).
 * It does NOT contain business logic or own game state.
 */

export { default as GlobeScene } from './GlobeScene.jsx';
export { default as Globe } from './Globe.jsx';
export { default as HexGrid } from './HexGrid.jsx';
