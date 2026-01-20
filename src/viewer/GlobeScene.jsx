/**
 * GlobeScene - Main 3D scene container for the globe viewer
 * 
 * ARCHITECTURAL NOTE:
 * This component sets up the Three.js scene using react-three-fiber.
 * It is renderer-agnostic - the same component works on web and native.
 * 
 * RENDERER SWAPPING:
 * - Web: Uses Canvas from '@react-three/fiber'
 * - Native: Will use Canvas from '@react-three/fiber/native'
 * 
 * The scene graph inside is identical on both platforms.
 */

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';
import Globe from './Globe.jsx';
import HexGrid from './HexGrid.jsx';

const MIN_DISTANCE = 1.2;
const MAX_DISTANCE = 3;

function SceneControls() {
  const controlsRef = useRef();
  const { camera } = useThree();

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    // Reduce drag strength when zoomed in (closer to globe surface).
    // We treat this as "panning" strength in a globe navigation sense.
    const distance = camera.position.distanceTo(controls.target);
    const t = THREE.MathUtils.clamp((distance - MIN_DISTANCE) / (MAX_DISTANCE - MIN_DISTANCE), 0, 1);

    controls.rotateSpeed = THREE.MathUtils.lerp(0.15, 0.5, t);
    controls.zoomSpeed = THREE.MathUtils.lerp(0.25, 0.5, t);

    // If we ever enable pan, keep it similarly damped near the surface.
    // (Does nothing while enablePan={false}.)
    controls.panSpeed = THREE.MathUtils.lerp(0.05, 0.5, t);
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={true}
      enableRotate={true}
      // Globe radius is 1. Allow zooming close to the surface.
      // Note: "street-level" detail also depends on texture/tiles, not just camera distance.
      minDistance={MIN_DISTANCE}
      maxDistance={MAX_DISTANCE}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.5}
      zoomSpeed={0.5}
    />
  );
}

/**
 * GlobeScene component
 * Wraps the 3D scene in a Canvas and provides controls
 */
export default function GlobeScene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{
        position: [0, 0, 2.5],
        fov: 45,
        // Allow close zoom without near-plane clipping.
        near: 0.01,
        far: 1000,
      }}
      style={{
        width: '100%',
        height: '100%',
        background: '#000011',
      }}
    >
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.3} />
      
      {/* Directional light simulating sun */}
      <directionalLight
        position={[5, 3, 5]}
        intensity={1}
        castShadow
      />
      
      {/* Suspense boundary for async loading */}
      <Suspense fallback={null}>
        {/* The globe mesh */}
        <Globe />
        
        {/* H3 hex grid overlay */}
        <HexGrid />
      </Suspense>

      {/* OrbitControls for camera navigation */}
      <SceneControls />
    </Canvas>
  );
}
