import React from 'react';
import NewsSection from '../components/NewsSection';
import GuidesSection from '../components/GuidesSection';

const News = () => {
  return (
    <>
      <main>
        <section id="news-header" className="mb-8">
          <h2 className="text-xl font-bold mb-4">Latest Climate News</h2>
          <p className="mb-4">Stay updated with the latest news and developments related to climate change from around the globe.</p>
          <NewsSection />
        </section>

        <section id="extra-content" className="mb-8">
          <h2 className="text-xl font-bold mb-4">Additional Resources</h2>
          <p className="mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
          <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
        </section>

        <section id="guides-summary" className="mb-8">
          <h2 className="text-xl font-bold mb-4">Quick Guides</h2>
          <GuidesSection />
        </section>
      </main>
    </>
  );
};

export default News;
