import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const About = ({ onNavigate }) => {
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
        <section id="carousel-container">
          <h2>Nature's Beauty and Resilience</h2>
          {/* React component will be rendered here */}
          <div id="root" style={{padding: '20px', border: '1px solid #ccc'}}>Carousel Placeholder</div>
        </section>

        <section id="about-content">
          <p>Welcome to the Climate Change Awareness App, a platform dedicated to educating and empowering individuals about climate change. Our mission is to provide accurate information, practical solutions, and inspiring stories that highlight the beauty of nature and the importance of preserving it.</p>

          <p>This app serves as a resource for anyone interested in learning more about climate change, its history, current state, and future implications. Whether you're looking for ways to reduce your carbon footprint or want to understand the broader impacts of environmental policies, we aim to be your guide.</p>
        </section>

        <section id="resources">
          <h2>Resources</h2>
          {/* React components will be rendered here */}
          <div id="news-section" style={{padding: '20px', border: '1px solid #ccc'}}>News Section Placeholder</div>
          <div id="guides-section" style={{padding: '20px', border: '1px solid #ccc'}}>Guides Section Placeholder</div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default About;
