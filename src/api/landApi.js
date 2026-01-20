/**
 * Land API - Internal API for land/cell operations
 * 
 * ARCHITECTURAL NOTE:
 * This module represents the boundary between the game client and backend services.
 * Currently implemented as an in-memory stub with clear logging.
 * 
 * FUTURE FIREBASE INTEGRATION:
 * When Firebase is added, this module will:
 * 1. Replace in-memory state with Firestore queries
 * 2. Add real-time listeners for ownership changes
 * 3. Implement optimistic updates with rollback
 * 
 * The rest of the application will NOT change - only this file.
 */

import { createCell, CellState } from '../core/domain/cell.js';

/**
 * In-memory state store (stub for Firebase)
 * 
 * FIREBASE NOTE:
 * This will become:
 * - Firestore collection: 'cells'
 * - Real-time subscription for visible cells
 * - Local cache for performance
 */
const state = {
  selectedCellId: null,
  hoveredCellId: null,
  cells: new Map(), // cellId -> cell data
};

/**
 * Subscribers for state changes
 * Allows React components to re-render when state updates
 */
const subscribers = new Set();

/**
 * Subscribe to state changes
 * @param {function} callback - Called when state changes
 * @returns {function} Unsubscribe function
 */
export function subscribe(callback) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

/**
 * Notify all subscribers of state change
 */
function notifySubscribers() {
  subscribers.forEach(callback => callback(getState()));
}

/**
 * Get current state snapshot
 * @returns {object} Current state
 */
export function getState() {
  return {
    selectedCellId: state.selectedCellId,
    hoveredCellId: state.hoveredCellId,
    cells: new Map(state.cells),
  };
}

/**
 * Select a cell by ID
 * 
 * FIREBASE NOTE:
 * Future implementation will:
 * 1. Verify cell exists in Firestore
 * 2. Check if user can select (ownership rules)
 * 3. Update user's selected cell in Firestore
 * 
 * @param {string} cellId - H3 cell index to select
 * @returns {object} Result with success status
 */
export function selectCell(cellId) {
  console.log('[LandAPI] selectCell called:', { cellId });
  
  // Ensure cell exists in our local cache
  if (!state.cells.has(cellId)) {
    state.cells.set(cellId, createCell(cellId));
  }
  
  // Update previous selection state
  if (state.selectedCellId && state.cells.has(state.selectedCellId)) {
    const prevCell = state.cells.get(state.selectedCellId);
    state.cells.set(state.selectedCellId, {
      ...prevCell,
      state: CellState.DEFAULT,
    });
  }
  
  // Update new selection
  state.selectedCellId = cellId;
  const cell = state.cells.get(cellId);
  state.cells.set(cellId, {
    ...cell,
    state: CellState.SELECTED,
  });
  
  console.log('[LandAPI] Cell selected successfully:', { cellId });
  notifySubscribers();
  
  return {
    success: true,
    cellId,
    cell: state.cells.get(cellId),
  };
}

/**
 * Clear current selection
 * 
 * @returns {object} Result with success status
 */
export function clearSelection() {
  console.log('[LandAPI] clearSelection called');
  
  if (state.selectedCellId && state.cells.has(state.selectedCellId)) {
    const cell = state.cells.get(state.selectedCellId);
    state.cells.set(state.selectedCellId, {
      ...cell,
      state: CellState.DEFAULT,
    });
  }
  
  state.selectedCellId = null;
  notifySubscribers();
  
  return { success: true };
}

/**
 * Set hovered cell
 * 
 * @param {string|null} cellId - H3 cell index or null to clear
 * @returns {object} Result with success status
 */
export function setHoveredCell(cellId) {
  // Avoid unnecessary updates
  if (state.hoveredCellId === cellId) {
    return { success: true, cellId };
  }
  
  // Clear previous hover state
  if (state.hoveredCellId && state.cells.has(state.hoveredCellId)) {
    const prevCell = state.cells.get(state.hoveredCellId);
    // Don't override selected state
    if (prevCell.state === CellState.HOVERED) {
      state.cells.set(state.hoveredCellId, {
        ...prevCell,
        state: CellState.DEFAULT,
      });
    }
  }
  
  state.hoveredCellId = cellId;
  
  // Set new hover state
  if (cellId) {
    if (!state.cells.has(cellId)) {
      state.cells.set(cellId, createCell(cellId));
    }
    const cell = state.cells.get(cellId);
    // Don't override selected state with hover
    if (cell.state !== CellState.SELECTED) {
      state.cells.set(cellId, {
        ...cell,
        state: CellState.HOVERED,
      });
    }
  }
  
  notifySubscribers();
  
  return { success: true, cellId };
}

/**
 * Get a cell by ID
 * 
 * @param {string} cellId - H3 cell index
 * @returns {object|null} Cell data or null
 */
export function getCell(cellId) {
  return state.cells.get(cellId) || null;
}

/**
 * Get the currently selected cell ID
 * 
 * @returns {string|null} Selected cell ID or null
 */
export function getSelectedCellId() {
  return state.selectedCellId;
}

/**
 * Get the currently hovered cell ID
 * 
 * @returns {string|null} Hovered cell ID or null
 */
export function getHoveredCellId() {
  return state.hoveredCellId;
}
