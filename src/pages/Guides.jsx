import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Guides = () => {
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
        <section id="guides">

          <h2>Useful Guides & Solutions</h2>
          <p>Explore our curated collection of practical guides that empower communities to address environmental challenges and build resilience.</p>
          <ul style={{ textAlign: 'left', display: 'inline-block' }}>
            <li><a href="#">Water Purification Techniques for Rural Communities</a></li>
            <li><a href="#">Reducing Metal Pollution in Local Waterways</a></li>
            <li><a href="#">Harnessing Renewable Energy at the Household Level</a></li>
            <li><a href="#">Sustainable Agriculture Practices to Boost Soil Health</a></li>
            <li><a href="#">Community Recycling Initiatives: A Step-by-Step Guide</a></li>
          </ul>
          <p style={{ marginTop: '20px' }}>
            These guides combine science-backed strategies with actionable steps, ensuring that every community member can contribute to a healthier environment. Whether you’re a policymaker, educator, or everyday citizen, our resources are designed to inspire informed action.
          </p>
        </section>

      </main>

      <Footer />
    </>
  );
};

export default Guides;
