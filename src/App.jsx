/**
 * App - Main application component
 * 
 * ARCHITECTURAL NOTE:
 * This is the application shell. It renders the GlobeScene viewer.
 * 
 * FUTURE STRUCTURE:
 * - Will include authentication state provider
 * - Will include game state context
 * - Will include UI overlays (HUD, menus)
 * 
 * Currently minimal for Milestone 1 (viewer-only).
 */

import './App.css';
import GlobeScene from './viewer/GlobeScene.jsx';

function App() {
  return (
    <div className="app-container">
      {/* 
        GlobeScene is the main 3D viewer
        It's self-contained and handles its own input
      */}
      <GlobeScene />
      
      {/* 
        FUTURE: UI overlays will go here
        - Selection info panel
        - Currency display
        - Building menu
        These will be positioned absolutely over the canvas
      */}
    </div>
  );
}

export default App;
