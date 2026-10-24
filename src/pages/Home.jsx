import { Link } from 'react-router-dom';
import NewsSection from '../components/NewsSection';
import GuidesSection from '../components/GuidesSection';
import Photo from '../components/Photo';
import { pageImages } from '../assets/images';

const Home = () => {
  return (
    <>
      {/* Hero: photo in the back, a dark green gradient over it so the text stays readable. */}
      <section className="relative isolate overflow-hidden px-4 py-24 text-center text-white">
        <Photo image={pageImages.homeHero} background className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-linear-to-br from-forest-950/90 via-forest-900/75 to-forest-700/60" />
        <h2 className="mb-4 text-4xl text-white">Protecting Our Planet for Future Generations</h2>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-forest-100">
          Welcome to the central hub for climate awareness. Here, we provide you with the tools and information needed to understand our changing world and take actionable steps toward a sustainable future.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/tracker" className="btn btn-light">Open Green Wallet</Link>
          <a href="#features" className="btn border border-forest-300 bg-transparent hover:bg-forest-700">Explore Features</a>
        </div>
      </section>

      <main className="page">
        <section id="features" className="mb-12">
          <h2 className="section-title">Our Features</h2>
          <p className="mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
          <ul className="leaf-list">
            <li><strong>Climate Data Tracker:</strong> Real-time monitoring of environmental changes.</li>
            <li><strong>Interactive Educational Modules:</strong> Learn about ecology and conservation.</li>
            <li><strong>News & Updates:</strong> Stay informed with global climate news.</li>
            <li><strong>Water Purification Guides:</strong> Practical solutions for water scarcity.</li>
            <li><strong>Environmental Benefits Explained:</strong> Understand the impact of a healthy ecosystem.</li>
          </ul>
        </section>

        <section id="guides" className="mb-12">
          <h2 className="section-title">Useful Guides & Solutions</h2>
          <p className="mb-6">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula.</p>
          <div className="grid gap-6 md:grid-cols-2">
            <NewsSection />
            <GuidesSection />
          </div>
        </section>

        <section id="benefits">
          <h2 className="section-title">Communal Benefits of a Healthy Environment</h2>
          <p className="mb-4">The benefits of a clean and healthy environment extend beyond individual health to the well-being of entire communities. These benefits include:</p>
          <ul className="leaf-list">
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
