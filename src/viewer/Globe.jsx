/**
 * Globe - 3D Earth sphere mesh
 * 
 * ARCHITECTURAL NOTE:
 * This component renders the base globe sphere.
 * It's a pure rendering component with no game logic.
 * 
 * FUTURE ENHANCEMENTS:
 * - Earth texture mapping
 * - Atmosphere shader
 * - Day/night cycle
 */

import { useRef } from 'react';

/**
 * Globe radius constant
 * Used throughout the viewer for positioning calculations
 */
export const GLOBE_RADIUS = 1;

/**
 * Globe component
 * Renders a sphere representing Earth
 */
export default function Globe() {
  const meshRef = useRef();
  
  // Optional: subtle rotation animation
  // Disabled by default for user control, but shows the pattern
  // useFrame((state, delta) => {
  //   if (meshRef.current) {
  //     meshRef.current.rotation.y += delta * 0.05;
  //   }
  // });
  
  return (
    <mesh ref={meshRef}>
      {/* High-detail sphere for smooth appearance */}
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
      
      {/* 
        Simple material for now
        FUTURE: Replace with custom shader for:
        - Earth texture
        - Atmosphere glow
        - City lights on dark side
      */}
      <meshStandardMaterial
        color="#1a4a7a"
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}
