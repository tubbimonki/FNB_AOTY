import React, { useState } from 'react';
import Home from './pages/Home';
import About from './pages/About';
import News from './pages/News';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'about':
        return <About onNavigate={setCurrentPage} />;
      case 'news':
        return <News onNavigate={setCurrentPage} />;
      default:
        return <Home onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div id="root">
      {renderPage()}
    </div>
  );
}

export default App;
