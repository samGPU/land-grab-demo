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
import { useFrame, useThree } from '@react-three/fiber';
import { cellToBoundary, cellToLatLng, latLngToCell, gridDisk } from 'h3-js';
import { GLOBE_RADIUS } from './Globe.jsx';
import { VISIBLE_GRID_RESOLUTION } from '../core/h3/index.js';
import { createPointerHandlers } from '../platform/web/input.js';
import { subscribe, getState } from '../api/landApi.js';
import { CellState } from '../core/domain/cell.js';

/**
 * Clamp the number of rings for safety.
 */
const MIN_GRID_RINGS = 8;
const MAX_GRID_RINGS = 140;

// Rendering offsets to keep the hex overlay slightly above the globe surface.
// Small values help avoid z-fighting/intersection without looking like it floats.
const OUTLINE_RADIUS_MULT = 1.004;
const FILL_RADIUS_MULT = 1.005;
const INTERACTION_RADIUS_MULT = 1.006;

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

function angularDistanceRad(lat1, lng1, lat2, lng2) {
  const phi1 = degToRad(lat1);
  const phi2 = degToRad(lat2);
  const dLambda = degToRad(lng2 - lng1);

  const cosD = Math.sin(phi1) * Math.sin(phi2) + Math.cos(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  // Numerical safety.
  const clamped = Math.min(1, Math.max(-1, cosD));
  return Math.acos(clamped);
}

function estimateRingStepRad(centerCell) {
  const [centerLat, centerLng] = cellToLatLng(centerCell);
  const ring1 = gridDisk(centerCell, 1);
  const neighborCell = ring1.find((id) => id !== centerCell);
  if (!neighborCell) return null;

  const [nLat, nLng] = cellToLatLng(neighborCell);
  return angularDistanceRad(centerLat, centerLng, nLat, nLng);
}

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
function HexCell({ cellId: _cellId, boundary, color }) {
  // cellId available for debugging: _cellId
  // Convert boundary coordinates to 3D vectors
  const geometry = useMemo(() => {
    const vectors = boundary.map(([lat, lng]) => latLngToVector3(lat, lng, GLOBE_RADIUS * OUTLINE_RADIUS_MULT));
    
    // Create line geometry for hex outline
    const points = [...vectors, vectors[0]]; // Close the loop
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    
    return lineGeometry;
  }, [boundary]);
  
  const isHighlighted = color !== '#ffffff';

  // Only allocate the fill geometry when we actually need it (hover/selected).
  const fillGeometry = useMemo(() => {
    if (!isHighlighted) return null;

    const vectors = boundary.map(([lat, lng]) => latLngToVector3(lat, lng, GLOBE_RADIUS * FILL_RADIUS_MULT));

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
  }, [boundary, isHighlighted]);
  
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
      {isHighlighted && fillGeometry && (
        <mesh geometry={fillGeometry}>
          <meshBasicMaterial
            color={color}
            opacity={0.4}
            transparent
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

/**
 * HexGrid component
 * Generates and renders the H3 grid overlay
 */
export default function HexGrid() {
  const { camera } = useThree();

  // Subscribe to API state for cell colors
  const [apiState, setApiState] = useState(getState());

  // Track which H3 cell is at the center of the current view.
  // We update it as the camera moves so the grid follows you.
  const [viewCenterCellId, setViewCenterCellId] = useState(
    () => latLngToCell(0, 0, VISIBLE_GRID_RESOLUTION)
  );
  
  useEffect(() => {
    return subscribe(setApiState);
  }, []);

  useFrame(() => {
    // The point on the globe facing the camera is in the direction of the camera position.
    const dist = camera.position.length();
    if (dist <= 0) return;

    const facingPoint = camera.position.clone().normalize().multiplyScalar(GLOBE_RADIUS);
    const { lat, lng } = vector3ToLatLng(facingPoint);
    const nextCenterCellId = latLngToCell(lat, lng, VISIBLE_GRID_RESOLUTION);

    if (nextCenterCellId !== viewCenterCellId) {
      setViewCenterCellId(nextCenterCellId);
    }
  });
  
  // Generate hex cells for at least the visible hemisphere.
  // We approximate a hemisphere by generating enough H3 rings around the view-center cell
  // so the angular radius is >= 90°.
  const hexCells = useMemo(() => {
    const centerCell = viewCenterCellId;

    // Estimate how much angular radius each additional ring covers by measuring
    // the distance between the center cell and one of its neighbors.
    const ringStep = estimateRingStepRad(centerCell) ?? degToRad(1);

    // 90° hemisphere plus a small margin to ensure we cover the full visible edge.
    const desiredRadius = Math.PI / 2 + degToRad(8);
    const rings = THREE.MathUtils.clamp(
      Math.ceil(desiredRadius / Math.max(ringStep, 1e-6)),
      MIN_GRID_RINGS,
      MAX_GRID_RINGS
    );

    const cellIds = gridDisk(centerCell, rings);
    
    return cellIds.map(cellId => ({
      cellId,
      boundary: cellToBoundary(cellId),
    }));
  }, [viewCenterCellId]);
  
  // Function to convert 3D point to H3 cell ID
  const getCellIdFromPoint = useCallback((point) => {
    const { lat, lng } = vector3ToLatLng(point);
    return latLngToCell(lat, lng, VISIBLE_GRID_RESOLUTION);
  }, []);
  
  // Create pointer handlers from platform layer
  const pointerHandlers = useMemo(
    () => createPointerHandlers(getCellIdFromPoint),
    [getCellIdFromPoint]
  );
  
  return (
    <group>
      {/*
        Single interaction surface for hover/click.
        This removes hundreds of per-cell invisible meshes and dramatically
        reduces raycasting + draw-call overhead.
      */}
      <mesh
        onPointerDown={pointerHandlers.onPointerDown}
        onPointerMove={pointerHandlers.onPointerMove}
        onPointerLeave={pointerHandlers.onPointerLeave}
      >
        <sphereGeometry args={[GLOBE_RADIUS * INTERACTION_RADIUS_MULT, 48, 48]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {hexCells.map(({ cellId, boundary }) => (
        <HexCell
          key={cellId}
          cellId={cellId}
          boundary={boundary}
          color={getCellColor(cellId, apiState.cells, apiState.selectedCellId, apiState.hoveredCellId)}
        />
      ))}
    </group>
  );
}
