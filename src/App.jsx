import React from 'react';
import Home from './pages/Home';
import About from './pages/About';
import News from './pages/News';
import Features from './pages/Features';
import Guides from './pages/Guides';
import Benefits from './pages/Benefits';
import { Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate replace to="/home" />} />
      <Route path="/home" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/news" element={<News />} />
      <Route path="/features" element={<Features />} />
      <Route path="/guides" element={<Guides />} />
      <Route path="/benefits" element={<Benefits />} />
    </Routes>
  );
}

export default App;
