import React from 'react';
import Carousel from '../components/Carousel';
import NewsSection from '../components/NewsSection';
import GuidesSection from '../components/GuidesSection';
import hero from '../assets/hero.png';

const About = () => {
  return (
    <>
      <main>
        <section id="carousel-container" className="my-8">
          <h2 className="text-xl font-bold mb-4">Nature's Beauty and Resilience</h2>
          <Carousel images={[hero]} />
        </section>

        <section id="about-content" className="mb-8">
          <p className="mb-4">Welcome to the Climate Change Awareness App, a platform dedicated to educating and empowering individuals about climate change. Our mission is to provide accurate information, practical solutions, and inspiring stories that highlight the beauty of nature and the importance of preserving it.</p>

          <p>This app serves as a resource for anyone interested in learning more about climate change, its history, current state, and future implications. Whether you're looking for ways to reduce your carbon footprint or want to understand the broader impacts of environmental policies, we aim to be your guide.</p>
        </section>

        <section id="resources" className="mb-8">
          <h2 className="text-xl font-bold mb-4">Resources</h2>
          <NewsSection />
          <GuidesSection />
        </section>
      </main>
    </>
  );
};

export default About;
