/**
 * Cell Domain Model - Represents an H3 land cell
 * 
 * ARCHITECTURAL NOTE:
 * This is a pure domain model with no dependencies on React or browser APIs.
 * It defines the shape of cell data and provides factory functions.
 * In the future, this will include ownership, structures, and other game state.
 */

/**
 * Cell states for rendering and interaction
 */
export const CellState = {
  DEFAULT: 'default',
  HOVERED: 'hovered',
  SELECTED: 'selected',
  OWNED: 'owned',        // Future: owned by current player
  FOREIGN: 'foreign',    // Future: owned by another player
};

/**
 * Create a cell data object
 * @param {string} id - H3 cell index
 * @param {object} options - Additional cell properties
 * @returns {object} Cell data object
 */
export function createCell(id, options = {}) {
  return {
    id,
    state: options.state || CellState.DEFAULT,
    ownerId: options.ownerId || null,      // Future: player ID
    structures: options.structures || [],   // Future: building array
    createdAt: options.createdAt || Date.now(),
  };
}

/**
 * Check if a cell is selectable
 * @param {object} _cell - Cell data object
 * @returns {boolean} True if the cell can be selected
 */
export function isCellSelectable(_cell) {
  // For now, all cells are selectable
  // Future: may depend on ownership, game state, etc.
  return true;
}

/**
 * Check if a cell is owned
 * @param {object} cell - Cell data object
 * @returns {boolean} True if the cell has an owner
 */
export function isCellOwned(cell) {
  return cell.ownerId !== null;
}
