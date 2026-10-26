import Banner from '../components/Banner';
import { pageImages } from '../assets/images';
const Benefits = () => {
  return (
    <main className="page">
      <Banner image={pageImages.benefitsBanner} />
      <h1 className="page-title">Communal Benefits of a Healthy Environment</h1>
      <p className="page-intro">A thriving ecosystem brings a myriad of benefits to communities, ranging from improved public health and economic growth to enhanced cultural richness and social cohesion.</p>

      <section id="benefits" className="card mb-8">
        <ul className="leaf-list">
          <li>Cleaner air reduces respiratory illnesses and boosts overall wellbeing.</li>
          <li>Fresh water supplies support agriculture, industry, and daily living.</li>
          <li>Diverse flora and fauna sustain ecological services that are vital for food security.</li>
          <li>Healthy landscapes foster community pride and attract tourism and investment.</li>
          <li>Environmental stewardship strengthens social bonds and empowers local decision‑making.</li>
        </ul>
      </section>

      <p>
        By embracing sustainable practices, communities can safeguard natural resources for future generations while simultaneously enhancing quality of life today. The ripple effects—from reduced healthcare costs to new green job opportunities—demonstrate that environmental health is a foundational pillar of societal resilience.
      </p>
    </main>
  );
};

export default Benefits;
