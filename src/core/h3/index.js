/**
 * H3 Utilities - Platform-agnostic H3 grid operations
 * 
 * ARCHITECTURAL NOTE:
 * This module contains pure JavaScript functions for H3 operations.
 * It must NOT import React, DOM APIs, or any browser-specific code.
 * This ensures the same logic can run on web, native, and server.
 */

import { latLngToCell, cellToBoundary, gridDisk, getResolution } from 'h3-js';

/**
 * Default H3 resolution for land cells
 * Resolution 12 provides ~300m² hexagons - suitable for city-scale land ownership
 */
export const DEFAULT_RESOLUTION = 12;

/**
 * Lower resolution for visible grid rendering (performance optimization)
 * Resolution 4 provides ~1,770 km² hexagons - visible at globe scale
 */
export const VISIBLE_GRID_RESOLUTION = 4;

/**
 * Convert latitude/longitude to H3 cell ID
 * @param {number} lat - Latitude in degrees
 * @param {number} lng - Longitude in degrees
 * @param {number} resolution - H3 resolution (0-15)
 * @returns {string} H3 cell index
 */
export function getH3Index(lat, lng, resolution = DEFAULT_RESOLUTION) {
  return latLngToCell(lat, lng, resolution);
}

/**
 * Get the boundary coordinates for an H3 cell
 * @param {string} h3Index - H3 cell index
 * @returns {Array<[number, number]>} Array of [lat, lng] pairs forming the cell boundary
 */
export function getCellBoundary(h3Index) {
  return cellToBoundary(h3Index);
}

/**
 * Get neighboring cells within k rings of the origin cell
 * @param {string} h3Index - Center H3 cell index
 * @param {number} ringSize - Number of rings around the center (k)
 * @returns {Array<string>} Array of H3 cell indices
 */
export function getNeighborCells(h3Index, ringSize = 1) {
  return gridDisk(h3Index, ringSize);
}

/**
 * Get the resolution of an H3 index
 * @param {string} h3Index - H3 cell index
 * @returns {number} Resolution (0-15)
 */
export function getCellResolution(h3Index) {
  return getResolution(h3Index);
}

/**
 * Generate a grid of H3 cells covering a viewport area
 * Used for rendering visible hex cells on the globe
 * 
 * @param {number} centerLat - Center latitude
 * @param {number} centerLng - Center longitude
 * @param {number} ringSize - Number of rings to generate
 * @param {number} resolution - H3 resolution
 * @returns {Array<string>} Array of H3 cell indices
 */
export function generateViewportGrid(centerLat, centerLng, ringSize, resolution = VISIBLE_GRID_RESOLUTION) {
  const centerCell = getH3Index(centerLat, centerLng, resolution);
  return gridDisk(centerCell, ringSize);
}
