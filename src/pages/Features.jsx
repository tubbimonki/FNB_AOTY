import Banner from '../components/Banner';
import { pageImages } from '../assets/images';
const Features = () => {
  return (
    <main className="page">
      <Banner image={pageImages.featuresBanner} />
      <h2 className="page-title">Our Features</h2>
      <p className="page-intro">Explore the tools and modules designed to help you stay informed and take action against climate change.</p>

      <section id="features" className="card mb-8">
        <ul className="leaf-list">
          <li><strong>Climate Data Tracker:</strong> Real-time monitoring of environmental changes.</li>
          <li><strong>Interactive Educational Modules:</strong> Learn about ecology and conservation.</li>
          <li><strong>News & Updates:</strong> Stay informed with global climate news.</li>
          <li><strong>Water Purification Guides:</strong> Practical solutions for water scarcity.</li>
          <li><strong>Environmental Benefits Explained:</strong> Understand the impact of a healthy ecosystem.</li>
        </ul>
      </section>

      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
      </p>
    </main>
  );
};

export default Features;
