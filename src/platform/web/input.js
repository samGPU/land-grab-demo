/**
 * Web Input Bindings - Platform-specific pointer event handling
 * 
 * ARCHITECTURAL NOTE:
 * This module contains ALL browser-specific input handling code.
 * It translates DOM pointer events into normalized input for the interactions layer.
 * 
 * PLATFORM ISOLATION:
 * - Only this file may use 'mouse', 'pointer', or 'touch' DOM events
 * - Only this file may reference browser-specific event properties
 * - The native equivalent (platform/native/input.js) will handle touch gestures
 * 
 * Both platforms emit the same normalized events to the interactions layer.
 */

import { handlePointerAction } from '../../interactions/pointerEvents.js';

/**
 * Current hover state for tracking enter/exit
 */
let currentHoveredCellId = null;

/**
 * Create web pointer handlers for R3F mesh events
 * These handlers are designed to work with react-three-fiber's event system
 * 
 * IMPORTANT: R3F's event system abstracts away browser events,
 * but we still isolate this in platform/web for clarity and future-proofing
 * 
 * @param {function} getCellIdFromPoint - Function to resolve 3D point to cell ID
 * @returns {object} Event handlers for R3F components
 */
export function createPointerHandlers(getCellIdFromPoint) {
  return {
    /**
     * Handle pointer click/tap
     * R3F normalizes this across mouse click and touch tap
     */
    onPointerDown: (event) => {
      // Prevent event from propagating to globe rotation
      event.stopPropagation();
      
      const cellId = getCellIdFromPoint(event.point);
      if (cellId) {
        handlePointerAction('select', cellId, {
          point: event.point,
          intersection: event.intersections?.[0],
        });
      }
    },
    
    /**
     * Handle pointer movement for hover detection
     */
    onPointerMove: (event) => {
      const cellId = getCellIdFromPoint(event.point);
      
      if (cellId !== currentHoveredCellId) {
        // Exiting previous cell
        if (currentHoveredCellId) {
          handlePointerAction('hover-exit', null, {
            previousCellId: currentHoveredCellId,
          });
        }
        
        // Entering new cell
        if (cellId) {
          handlePointerAction('hover-enter', cellId, {
            point: event.point,
          });
        }
        
        currentHoveredCellId = cellId;
      }
    },
    
    /**
     * Handle pointer leaving the mesh entirely
     */
    onPointerLeave: () => {
      if (currentHoveredCellId) {
        handlePointerAction('hover-exit', null, {
          previousCellId: currentHoveredCellId,
        });
        currentHoveredCellId = null;
      }
    },
  };
}

/**
 * Reset input state
 * Called when scene unmounts or focus changes
 */
export function resetInputState() {
  currentHoveredCellId = null;
}
