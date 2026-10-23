import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Home = () => {
  const navigation = [
    { label: 'Home', link: 'home' },
    { label: 'About', link: 'about' },
    { label: 'Features', link: 'features' },
    { label: 'Climate News', link: 'news' },
    { label: 'Guides & Solutions', link: 'guides' },
    { label: 'Environmental Benefits', link: 'benefits' },
  ];

  return (
    <>
      <Header navigation={navigation} />

      <main>
        <section id="hero-content">
          <h2>Protecting Our Planet for Future Generations</h2>
          <p>Welcome to the central hub for climate awareness. Here, we provide you with the tools and information needed to understand our changing world and take actionable steps toward a sustainable future.</p>
          {/* React component will be rendered here */}
          <div id="root" style={{padding: '20px', border: '1px solid #ccc'}}>Home Component Placeholder</div>
        </section>

        <section id="features">
          <h2>Our Features</h2>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
          <ul>
            <li>Climate Data Tracker: Real-time monitoring of environmental changes.</li>
            <li>Interactive Educational Modules: Learn about ecology and conservation.</li>
            <li>News & Updates: Stay informed with global climate news.</li>
            <li>Water Purification Guides: Practical solutions for water scarcity.</li>
            <li>Environmental Benefits Explained: Understand the impact of a healthy ecosystem.</li>
          </ul>
        </section>

        <section id="guides">
          <h2>Useful Guides & Solutions</h2>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula.</p>
          {/* React components will be rendered here */}
          <div id="news-section" style={{padding: '20px', border: '1px solid #ccc'}}>News Section Placeholder</div>
          <div id="guides-section" style={{padding: '20px', border: '1px solid #ccc'}}>Guides Section Placeholder</div>
        </section>

        <section id="benefits">
          <h2>Communal Benefits of a Healthy Environment</h2>
          <p>The benefits of a clean and healthy environment extend beyond individual health to the well-being of entire communities. These benefits include:</p>
          <ul>
            <li>Improved air and water quality leading to better public health.</li>
            <li>Enhanced biodiversity and ecosystem resilience.</li>
            <li>Increased community engagement in environmental conservation.</li>
            <li>Economic opportunities through sustainable practices and green industries.</li>
          </ul>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default Home;
