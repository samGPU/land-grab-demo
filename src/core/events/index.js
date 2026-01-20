/**
 * Domain Events - Semantic event definitions
 * 
 * ARCHITECTURAL NOTE:
 * These are platform-agnostic event types that represent game actions.
 * They are emitted by the interactions layer and consumed by the API layer.
 * This decouples input handling from business logic.
 * 
 * The same events are emitted whether the input comes from:
 * - Mouse clicks (web)
 * - Touch taps (mobile)
 * - Keyboard shortcuts
 * - Automated tests
 */

/**
 * Event type constants
 * Using string constants ensures type safety and easy debugging
 */
export const EventTypes = {
  // Cell interaction events
  CELL_SELECTED: 'CELL_SELECTED',
  CELL_HOVERED: 'CELL_HOVERED',
  CELL_UNHOVERED: 'CELL_UNHOVERED',
  
  // Globe navigation events (for future use)
  GLOBE_ROTATED: 'GLOBE_ROTATED',
  GLOBE_ZOOMED: 'GLOBE_ZOOMED',
  
  // Selection events
  SELECTION_CLEARED: 'SELECTION_CLEARED',
};

/**
 * Create a domain event object
 * @param {string} type - Event type from EventTypes
 * @param {object} payload - Event-specific data
 * @returns {object} Structured event object
 */
export function createEvent(type, payload = {}) {
  return {
    type,
    payload,
    timestamp: Date.now(),
  };
}

/**
 * Create a CELL_SELECTED event
 * @param {string} cellId - H3 cell index
 * @param {object} metadata - Additional cell metadata
 * @returns {object} Event object
 */
export function cellSelected(cellId, metadata = {}) {
  return createEvent(EventTypes.CELL_SELECTED, {
    cellId,
    ...metadata,
  });
}

/**
 * Create a CELL_HOVERED event
 * @param {string} cellId - H3 cell index
 * @returns {object} Event object
 */
export function cellHovered(cellId) {
  return createEvent(EventTypes.CELL_HOVERED, { cellId });
}

/**
 * Create a CELL_UNHOVERED event
 * @param {string} cellId - H3 cell index
 * @returns {object} Event object
 */
export function cellUnhovered(cellId) {
  return createEvent(EventTypes.CELL_UNHOVERED, { cellId });
}

/**
 * Create a SELECTION_CLEARED event
 * @returns {object} Event object
 */
export function selectionCleared() {
  return createEvent(EventTypes.SELECTION_CLEARED);
}
