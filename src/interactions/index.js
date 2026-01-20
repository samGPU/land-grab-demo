/**
 * Interactions Layer - Re-export interaction handlers
 * 
 * ARCHITECTURAL NOTE:
 * This layer converts platform-specific input into semantic game events.
 * It's the bridge between platform code and game logic.
 */

export * from './pointerEvents.js';
