import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const News = ({ onNavigate }) => {
  const navigation = [
    { label: 'Home', link: '#' },
    { label: 'About', link: '#' },
    { label: 'Features', link: '#features' },
    { label: 'Climate News', link: '#' },
    { label: 'Guides & Solutions', link: '#guides' },
    { label: 'Environmental Benefits', link: '#benefits' },
  ];

  return (
    <>
      <Header navigation={navigation} onNavigate={onNavigate} />

      <main>
        <section id="news-header">
          <h2>Latest Climate News</h2>
          <p>Stay updated with the latest news and developments related to climate change from around the globe.</p>
          {/* React component will be rendered here */}
          <div id="news-root" style={{padding: '20px', border: '1px solid #ccc'}}>News Feed Placeholder</div>
        </section>

        <section id="extra-content">
          <h2>Additional Resources</h2>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
          <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
        </section>

        <section id="guides-summary">
          <h2>Quick Guides</h2>
          <div id="guides-section" style={{padding: '20px', border: '1px solid #ccc'}}>Guides Section Placeholder</div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default News;
