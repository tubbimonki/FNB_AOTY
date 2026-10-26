import { Link } from 'react-router-dom';
import { guideItems, latestGuides } from '../features/guides/guideItems';

// Landing-page teaser: the three newest guides, linking into the members' guides page.
const GuidesSection = () => (
  <div className="card mb-6">
    <h3 className="mb-2 text-xl">Useful Guides & Solutions</h3>
    <p className="mb-3">Practical how-tos for water, energy, food and community projects. The newest three:</p>
    <ul className="leaf-list">
      {latestGuides(guideItems, 3).map((guide) => (
        <li key={guide.id}>
          <Link to={`/dashboard/guides#guide-${guide.id}`}>{guide.title}</Link>
        </li>
      ))}
    </ul>
  </div>
);

export default GuidesSection;
