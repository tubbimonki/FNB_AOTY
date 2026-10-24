import Banner from '../components/Banner';
import { pageImages } from '../assets/images';
import NewsSection from '../components/NewsSection';
import GuidesSection from '../components/GuidesSection';

const News = () => {
  return (
    <main className="page">
      <Banner image={pageImages.newsBanner} />
      <h2 className="page-title">Latest Climate News</h2>
      <p className="page-intro">Stay updated with the latest news and developments related to climate change from around the globe.</p>

      <section id="news-header" className="mb-10">
        <NewsSection />
      </section>

      <section id="extra-content" className="mb-10 space-y-4">
        <h2 className="section-title">Additional Resources</h2>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
      </section>

      <section id="guides-summary">
        <h2 className="section-title">Quick Guides</h2>
        <GuidesSection />
      </section>
    </main>
  );
};

export default News;
