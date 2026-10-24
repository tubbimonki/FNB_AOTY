import Banner from '../components/Banner';
import { pageImages } from '../assets/images';
const Guides = () => {
  return (
    <main className="page">
      <Banner image={pageImages.guidesBanner} />
      <h2 className="page-title">Useful Guides & Solutions</h2>
      <p className="page-intro">Explore our curated collection of practical guides that empower communities to address environmental challenges and build resilience.</p>

      <section id="guides" className="card mb-8">
        <ul className="leaf-list">
          <li><a href="#">Water Purification Techniques for Rural Communities</a></li>
          <li><a href="#">Reducing Metal Pollution in Local Waterways</a></li>
          <li><a href="#">Harnessing Renewable Energy at the Household Level</a></li>
          <li><a href="#">Sustainable Agriculture Practices to Boost Soil Health</a></li>
          <li><a href="#">Community Recycling Initiatives: A Step-by-Step Guide</a></li>
        </ul>
      </section>

      <p>
        These guides combine science-backed strategies with actionable steps, ensuring that every community member can contribute to a healthier environment. Whether you’re a policymaker, educator, or everyday citizen, our resources are designed to inspire informed action.
      </p>
    </main>
  );
};

export default Guides;
