/**
 * Globe - 3D Earth sphere mesh
 * 
 * ARCHITECTURAL NOTE:
 * This component renders the base globe sphere with Earth texture.
 * It's a pure rendering component with no game logic.
 * 
 * TEXTURE SOURCE:
 * Using Natural Earth II from NASA/public domain sources.
 * Minimal style suitable for game overlay.
 */

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import ThreeGlobe from 'three-globe';
import { useFrame, useThree } from '@react-three/fiber';

/**
 * Globe radius constant
 * Used throughout the viewer for positioning calculations
 */
export const GLOBE_RADIUS = 1;

/**
 * Earth texture URL - Natural Earth style (minimal, suitable for game overlay)
 * This is a public domain texture from NASA Blue Marble
 */
const EARTH_TEXTURE_URL = 'https://unpkg.com/three-globe@2.45.0/example/img/earth-blue-marble.jpg';

// Demo setting: cap tile zoom to keep perf snappy.
// This is the slippy-map zoom level (z).
const TILE_MAX_ZOOM = 14;

function osmTileUrl(x, y, z) {
  const subdomain = ['a', 'b', 'c'][(x + y) % 3];
  return `https://${subdomain}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
}

/**
 * Globe component
 * Renders a sphere representing Earth with texture
 */
export default function Globe() {
  const { camera, size } = useThree();

  const globe = useMemo(() => {
    // Note: three-globe is a ThreeJS Object3D (not a React component).
    // We render it via <primitive /> so it works inside R3F.
    return new ThreeGlobe({ waitForGlobeReady: true, animateIn: false });
  }, []);

  useEffect(() => {
    // Fallback image used while tiles load.
    globe.globeImageUrl(EARTH_TEXTURE_URL);

    // Slippy tile engine for street-level detail.
    globe.globeTileEngineUrl(osmTileUrl);
    // NOTE: three-globe's public docs mention globeTileEngineMaxZoom, but the
    // current dist bundle exposes globeTileEngineMaxLevel. Support both.
    if (typeof globe.globeTileEngineMaxLevel === 'function') {
      globe.globeTileEngineMaxLevel(TILE_MAX_ZOOM);
    } else if (typeof globe.globeTileEngineMaxZoom === 'function') {
      globe.globeTileEngineMaxZoom(TILE_MAX_ZOOM);
    }

    globe.showAtmosphere(true);
  }, [globe]);

  useEffect(() => {
    globe.rendererSize?.(new THREE.Vector2(size.width, size.height));
  }, [globe, size.width, size.height]);

  // three-globe's internal globe radius is in its own units (typically 100).
  // We scale the rendered object down to match our viewer convention of radius=1.
  // But its LOD/tile engine uses the camera distance relative to the *internal*
  // radius, so we must pass a camera expressed in those internal units.
  const baseRadius = globe.getGlobeRadius?.() ?? 100;
  const scale = GLOBE_RADIUS / baseRadius;

  const povCamera = useMemo(() => new THREE.PerspectiveCamera(), []);

  useFrame(() => {
    if (!globe.setPointOfView) return;

    // Copy camera pose, but scale the position into three-globe's unit system.
    povCamera.position.copy(camera.position).divideScalar(scale);
    povCamera.quaternion.copy(camera.quaternion);
    povCamera.up.copy(camera.up);

    // Keep FOV/aspect roughly in sync (used by some layers).
    // These values are not scale-dependent.
    povCamera.fov = camera.fov;
    povCamera.aspect = camera.aspect;
    povCamera.near = camera.near;
    povCamera.far = camera.far;
    povCamera.updateProjectionMatrix();
    povCamera.updateMatrixWorld();

    globe.setPointOfView(povCamera);
  });

  return <primitive object={globe} scale={scale} />;
}
