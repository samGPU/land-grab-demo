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

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Suspense } from 'react';
import Globe from './Globe.jsx';
import HexGrid from './HexGrid.jsx';

/**
 * GlobeScene component
 * Wraps the 3D scene in a Canvas and provides controls
 */
export default function GlobeScene() {
  return (
    <Canvas
      camera={{
        position: [0, 0, 2.5],
        fov: 45,
        near: 0.1,
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
      
      {/* 
        OrbitControls for camera navigation
        ARCHITECTURAL NOTE: 
        drei's OrbitControls works on both web and native,
        but we may need to swap this for custom touch controls on native
        for better mobile UX. That change would be isolated to this file.
      */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        enableRotate={true}
        minDistance={1.2}
        maxDistance={4}
        rotateSpeed={0.5}
        zoomSpeed={0.5}
      />
    </Canvas>
  );
}
