/**
 * HexGrid - H3 hexagonal grid overlay on the globe
 * 
 * ARCHITECTURAL NOTE:
 * This component renders H3 hex cells as interactive polygons on the globe surface.
 * It bridges the core H3 utilities with the rendering layer.
 * 
 * RESPONSIBILITIES:
 * - Generate visible hex cells using core/h3 utilities
 * - Convert H3 boundaries to 3D coordinates
 * - Render hex cell meshes
 * - Handle pointer events via platform input layer
 * 
 * DOES NOT:
 * - Own game state (that's in the API layer)
 * - Process raw mouse/touch events (that's in platform layer)
 * - Implement selection logic (that's in interactions layer)
 */

import { useMemo, useCallback, useState, useEffect } from 'react';
import * as THREE from 'three';
import { cellToBoundary, latLngToCell, gridDisk } from 'h3-js';
import { GLOBE_RADIUS } from './Globe.jsx';
import { createPointerHandlers } from '../platform/web/input.js';
import { subscribe, getState } from '../api/landApi.js';
import { CellState } from '../core/domain/cell.js';

/**
 * H3 resolution for visible grid
 * Lower resolution (bigger hexes) for performance at globe scale
 * Resolution 2 = ~86,000 km² hexes, good for full globe view
 */
const GRID_RESOLUTION = 2;

/**
 * Number of hex rings to render around view center
 */
const GRID_RINGS = 15;

/**
 * Convert lat/lng to 3D Cartesian coordinates on globe surface
 * @param {number} lat - Latitude in degrees
 * @param {number} lng - Longitude in degrees
 * @param {number} radius - Globe radius
 * @returns {THREE.Vector3} 3D position
 */
function latLngToVector3(lat, lng, radius = GLOBE_RADIUS) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  
  return new THREE.Vector3(x, y, z);
}

/**
 * Convert 3D point on globe surface to lat/lng
 * @param {THREE.Vector3} point - Point on globe surface
 * @param {number} radius - Globe radius
 * @returns {{lat: number, lng: number}} Coordinates
 */
function vector3ToLatLng(point, _radius = GLOBE_RADIUS) {
  // radius parameter available for future use: _radius
  // Normalize point to unit sphere
  const normalized = point.clone().normalize();
  
  const lat = 90 - Math.acos(normalized.y) * (180 / Math.PI);
  const lng = Math.atan2(normalized.z, -normalized.x) * (180 / Math.PI) - 180;
  
  return { lat, lng: lng < -180 ? lng + 360 : lng };
}

/**
 * Get color for cell based on its state
 * @param {string} cellId - H3 cell ID
 * @param {Map} cells - Cell state map from API
 * @param {string} selectedCellId - Currently selected cell ID
 * @param {string} hoveredCellId - Currently hovered cell ID
 * @returns {string} Hex color
 */
function getCellColor(cellId, cells, selectedCellId, hoveredCellId) {
  if (cellId === selectedCellId) {
    return '#00ff88'; // Bright green for selected
  }
  if (cellId === hoveredCellId) {
    return '#44aaff'; // Blue for hovered
  }
  
  const cell = cells.get(cellId);
  if (cell) {
    switch (cell.state) {
      case CellState.SELECTED:
        return '#00ff88';
      case CellState.HOVERED:
        return '#44aaff';
      case CellState.OWNED:
        return '#ffaa00'; // Orange for owned
      default:
        return '#ffffff';
    }
  }
  
  return '#ffffff'; // Default white outline
}

/**
 * HexCell - Individual hexagonal cell mesh
 */
function HexCell({ cellId: _cellId, boundary, color, onPointerDown, onPointerMove, onPointerLeave }) {
  // cellId available for debugging: _cellId
  // Convert boundary coordinates to 3D vectors
  const geometry = useMemo(() => {
    const vectors = boundary.map(([lat, lng]) => latLngToVector3(lat, lng, GLOBE_RADIUS * 1.001));
    
    // Create line geometry for hex outline
    const points = [...vectors, vectors[0]]; // Close the loop
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    
    return lineGeometry;
  }, [boundary]);
  
  // Create fill geometry for hover/selection
  const fillGeometry = useMemo(() => {
    const vectors = boundary.map(([lat, lng]) => latLngToVector3(lat, lng, GLOBE_RADIUS * 1.002));
    
    // Calculate center point
    const center = vectors.reduce(
      (acc, v) => acc.add(v),
      new THREE.Vector3()
    ).divideScalar(vectors.length);
    
    // Create triangles from center to each edge
    const positions = [];
    for (let i = 0; i < vectors.length; i++) {
      const v1 = vectors[i];
      const v2 = vectors[(i + 1) % vectors.length];
      positions.push(center.x, center.y, center.z);
      positions.push(v1.x, v1.y, v1.z);
      positions.push(v2.x, v2.y, v2.z);
    }
    
    const fillGeom = new THREE.BufferGeometry();
    fillGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    fillGeom.computeVertexNormals();
    
    return fillGeom;
  }, [boundary]);
  
  const isHighlighted = color !== '#ffffff';
  
  return (
    <group>
      {/* Outline */}
      <line geometry={geometry}>
        <lineBasicMaterial
          color={color}
          opacity={isHighlighted ? 1 : 0.3}
          transparent
        />
      </line>
      
      {/* Fill (only when highlighted) */}
      {isHighlighted && (
        <mesh
          geometry={fillGeometry}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
        >
          <meshBasicMaterial
            color={color}
            opacity={0.4}
            transparent
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      
      {/* Invisible interaction mesh (always present for raycasting) */}
      <mesh
        geometry={fillGeometry}
        visible={false}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

/**
 * HexGrid component
 * Generates and renders the H3 grid overlay
 */
export default function HexGrid() {
  // Subscribe to API state for cell colors
  const [apiState, setApiState] = useState(getState());
  
  useEffect(() => {
    return subscribe(setApiState);
  }, []);
  
  // Generate hex cells for visible area
  // For now, generate a grid centered on (0, 0) - this could be dynamic based on camera
  const hexCells = useMemo(() => {
    const centerCell = latLngToCell(0, 0, GRID_RESOLUTION);
    const cellIds = gridDisk(centerCell, GRID_RINGS);
    
    return cellIds.map(cellId => ({
      cellId,
      boundary: cellToBoundary(cellId),
    }));
  }, []);
  
  // Function to convert 3D point to H3 cell ID
  const getCellIdFromPoint = useCallback((point) => {
    const { lat, lng } = vector3ToLatLng(point);
    return latLngToCell(lat, lng, GRID_RESOLUTION);
  }, []);
  
  // Create pointer handlers from platform layer
  const pointerHandlers = useMemo(
    () => createPointerHandlers(getCellIdFromPoint),
    [getCellIdFromPoint]
  );
  
  return (
    <group>
      {hexCells.map(({ cellId, boundary }) => (
        <HexCell
          key={cellId}
          cellId={cellId}
          boundary={boundary}
          color={getCellColor(cellId, apiState.cells, apiState.selectedCellId, apiState.hoveredCellId)}
          onPointerDown={pointerHandlers.onPointerDown}
          onPointerMove={pointerHandlers.onPointerMove}
          onPointerLeave={pointerHandlers.onPointerLeave}
        />
      ))}
    </group>
  );
}
