import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import ModelPage from './pages/ModelPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div className="app-container app-shell--landing">
            <Landing />
          </div>
        } />
        {/* ModelPage is edge-to-edge — no app-container wrapper */}
        <Route path="/model/:code" element={<ModelPage />} />
      </Routes>
    </Router>
  );
}

export default App;
