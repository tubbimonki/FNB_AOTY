import Banner from '../components/Banner';
import { Link } from 'react-router-dom';
import { pageImages } from '../assets/images';
import { featureList } from '../featureList';

const Features = () => {
  return (
    <main className="page">
      <Banner image={pageImages.featuresBanner} />
      <h1 className="page-title">Our Features</h1>
      <p className="page-intro">Explore the tools and modules designed to help you stay informed and take action against climate change.</p>

      <section id="features" className="card mb-8">
        <ul className="leaf-list">
          {featureList.map((feature) => (
            <li key={feature.name}>
              <strong>{feature.name}:</strong> {feature.text} <Link to={feature.link}>Open</Link>
            </li>
          ))}
        </ul>
      </section>

      <p>
        Green Wallet's CO2 and rand figures are estimates built from South African electricity tariffs, fuel prices and the coal-heavy grid. They are rough on purpose: the point is to see which everyday habits matter most, not to audit your footprint to the gram.
      </p>
    </main>
  );
};

export default Features;
