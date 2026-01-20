/**
 * Pointer Events - Interaction mapping layer
 * 
 * ARCHITECTURAL NOTE:
 * This module converts low-level pointer events into semantic domain events.
 * It acts as the bridge between platform input and game logic.
 * 
 * INPUT FLOW:
 * platform/web/input.js → interactions/pointerEvents.js → api/landApi.js
 * 
 * This layer:
 * - Receives normalized input from platform layer
 * - Performs raycasting to determine what was hit
 * - Emits domain events (CELL_SELECTED, CELL_HOVERED)
 * - Calls appropriate API methods
 * 
 * It does NOT:
 * - Access mouse/touch events directly
 * - Know about DOM or browser APIs
 * - Implement business logic (ownership, economy)
 */

import { cellSelected, cellHovered, cellUnhovered } from '../core/events/index.js';
import { selectCell, setHoveredCell } from '../api/landApi.js';

/**
 * Event listeners registry
 * Allows external code to subscribe to domain events
 */
const eventListeners = new Map();

/**
 * Register a listener for a domain event type
 * @param {string} eventType - Event type from EventTypes
 * @param {function} callback - Handler function
 * @returns {function} Unsubscribe function
 */
export function addEventListener(eventType, callback) {
  if (!eventListeners.has(eventType)) {
    eventListeners.set(eventType, new Set());
  }
  eventListeners.get(eventType).add(callback);
  
  return () => {
    eventListeners.get(eventType)?.delete(callback);
  };
}

/**
 * Emit a domain event to all registered listeners
 * @param {object} event - Domain event object
 */
function emitEvent(event) {
  console.log('[Interactions] Event emitted:', event.type, event.payload);
  
  const listeners = eventListeners.get(event.type);
  if (listeners) {
    listeners.forEach(callback => callback(event));
  }
}

/**
 * Handle cell selection
 * Called when user performs a "select" action (click/tap) on a cell
 * 
 * @param {string} cellId - H3 cell index that was selected
 * @param {object} metadata - Additional context (position, etc.)
 */
export function handleCellSelect(cellId, metadata = {}) {
  console.log('[Interactions] handleCellSelect:', cellId);
  
  // Emit domain event
  const event = cellSelected(cellId, metadata);
  emitEvent(event);
  
  // Call API to update state
  selectCell(cellId);
}

/**
 * Handle cell hover enter
 * Called when pointer enters a cell
 * 
 * @param {string} cellId - H3 cell index being hovered
 */
export function handleCellHoverEnter(cellId) {
  // Emit domain event
  const event = cellHovered(cellId);
  emitEvent(event);
  
  // Update API state
  setHoveredCell(cellId);
}

/**
 * Handle cell hover exit
 * Called when pointer leaves a cell
 * 
 * @param {string} cellId - H3 cell index that was exited
 */
export function handleCellHoverExit(cellId) {
  // Emit domain event
  const event = cellUnhovered(cellId);
  emitEvent(event);
  
  // Clear hover state if this is the currently hovered cell
  setHoveredCell(null);
}

/**
 * Handle pointer interaction at a 3D point
 * This is called by the platform input layer with normalized coordinates
 * 
 * @param {string} actionType - 'select' | 'hover-enter' | 'hover-exit'
 * @param {string|null} cellId - H3 cell ID or null if no cell hit
 * @param {object} context - Additional context (3D point, etc.)
 */
export function handlePointerAction(actionType, cellId, context = {}) {
  if (!cellId) {
    // Pointer is not over any cell
    if (actionType === 'hover-exit') {
      handleCellHoverExit(context.previousCellId);
    }
    return;
  }
  
  switch (actionType) {
    case 'select':
      handleCellSelect(cellId, context);
      break;
    case 'hover-enter':
      handleCellHoverEnter(cellId);
      break;
    case 'hover-exit':
      handleCellHoverExit(cellId);
      break;
    default:
      console.warn('[Interactions] Unknown action type:', actionType);
  }
}
