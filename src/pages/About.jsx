import Carousel from '../components/Carousel';
import NewsSection from '../components/NewsSection';
import GuidesSection from '../components/GuidesSection';
import { pageImages } from '../assets/images';

const About = () => {
  return (
    <main className="page">
      <h1 className="page-title">About</h1>

      <section id="carousel-container" className="my-8">
        <h2 className="mb-4 text-xl">Nature's Beauty and Resilience</h2>
        <Carousel images={pageImages.aboutGallery} />
      </section>

      <section id="about-content" className="mb-10 space-y-4">
        <p>Welcome to the Climate Change Awareness App, a platform dedicated to educating and empowering individuals about climate change. Our mission is to provide accurate information, practical solutions, and inspiring stories that highlight the beauty of nature and the importance of preserving it.</p>
        <p>This app serves as a resource for anyone interested in learning more about climate change, its history, current state, and future implications. Whether you're looking for ways to reduce your carbon footprint or want to understand the broader impacts of environmental policies, we aim to be your guide.</p>
      </section>

      <section id="resources">
        <h2 className="section-title">Resources</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <NewsSection />
          <GuidesSection />
        </div>
      </section>
    </main>
  );
};

export default About;
