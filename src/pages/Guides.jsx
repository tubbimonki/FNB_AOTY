import React from 'react';

const Guides = () => {
  return (
    <>
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
    </>
  );
};

export default Guides;
