import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Benefits = () => {
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
        <section id="benefits">
          <h2>Communal Benefits of a Healthy Environment</h2>
          <p>A thriving ecosystem brings a myriad of benefits to communities, ranging from improved public health and economic growth to enhanced cultural richness and social cohesion.</p>
          <ul style={{ textAlign: 'left', display: 'inline-block' }}>
            <li>Cleaner air reduces respiratory illnesses and boosts overall wellbeing.</li>
            <li>Fresh water supplies support agriculture, industry, and daily living.</li>
            <li>Diverse flora and fauna sustain ecological services that are vital for food security.</li>
            <li>Healthy landscapes foster community pride and attract tourism and investment.</li>
            <li>Environmental stewardship strengthens social bonds and empowers local decision‑making.</li>
          </ul>
          <p style={{ marginTop: '20px' }}>
            By embracing sustainable practices, communities can safeguard natural resources for future generations while simultaneously enhancing quality of life today. The ripple effects—from reduced healthcare costs to new green job opportunities—demonstrate that environmental health is a foundational pillar of societal resilience.
          </p>
        </section>

      </main>

      <Footer />
    </>
  );
};

export default Benefits;
