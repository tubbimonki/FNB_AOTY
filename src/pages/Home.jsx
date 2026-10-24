import React from 'react';
import NewsSection from '../components/NewsSection';
import GuidesSection from '../components/GuidesSection';

const Home = () => {
  return (
    <>
      {/* Hero Section with background image */}
      <section className="hero">
        <div className="hero-content">
          <h2 className="text-3xl font-bold mb-4">Protecting Our Planet for Future Generations</h2>
          <p className="mb-6 max-w-2xl mx-auto text-lg">Welcome to the central hub for climate awareness. Here, we provide you with the tools and information needed to understand our changing world and take actionable steps toward a sustainable future.</p>
          <a href="#features" className="cta-button">Explore Features</a>
        </div>
      </section>

      {/* Existing sections */}
      <main className="max-w-4xl mx-auto p-6">
        <section id="features" className="mb-12">
          <h2 className="text-2xl font-bold mb-4 border-b pb-2">Our Features</h2>
          <p className="mb-4 text-gray-700">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
          <ul className="list-disc ml-6 space-y-2 text-gray-800">
            <li><strong>Climate Data Tracker:</strong> Real-time monitoring of environmental changes.</li>
            <li><strong>Interactive Educational Modules:</strong> Learn about ecology and conservation.</li>
            <li><strong>News & Updates:</strong> Stay informed with global climate news.</li>
            <li><strong>Water Purification Guides:</strong> Practical solutions for water scarcity.</li>
            <li><strong>Environmental Benefits Explained:</strong> Understand the impact of a healthy ecosystem.</li>
          </ul>
        </section>

        <section id="guides" className="mb-12">
          <h2 className="text-2xl font-bold mb-4 border-b pb-2">Useful Guides & Solutions</h2>
          <p className="mb-6 text-gray-700">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula.</p>
          {/* React components rendered here */}
          <NewsSection />
          <GuidesSection />
        </section>

        <section id="benefits" className="mb-12">
          <h2 className="text-2xl font-bold mb-4 border-b pb-2">Communal Benefits of a Healthy Environment</h2>
          <p className="mb-4 text-gray-700">The benefits of a clean and healthy environment extend beyond individual health to the well-being of entire communities. These benefits include:</p>
          <ul className="list-disc ml-6 space-y-2 text-gray-800">
            <li>Improved air and water quality leading to better public health.</li>
            <li>Enhanced biodiversity and ecosystem resilience.</li>
            <li>Increased community engagement in environmental conservation.</li>
            <li>Economic opportunities through sustainable practices and green industries.</li>
          </ul>
        </section>
      </main>
    </>
  );
};

export default Home;
