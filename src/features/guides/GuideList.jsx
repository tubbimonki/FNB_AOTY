// Guides for the dashboard's main column, newest first.
// The `id` on each card lets the sidebar link straight to it (#guide-g1).
import { latestGuides } from './guideItems';

const GuideList = ({ items }) => {
  if (items.length === 0) {
    return <p className="card text-forest-700/70">No guides yet. Check back soon.</p>;
  }

  return (
    <ul className="space-y-4">
      {latestGuides(items).map((guide) => (
        <li key={guide.id}>
          <article id={`guide-${guide.id}`} className="card">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-forest-500">
              {guide.topic} · {guide.minutes} min read
            </p>
            <h3 className="mb-2 text-lg sm:text-xl">{guide.title}</h3>
            <p className="text-forest-800/80">{guide.summary}</p>
            <p className="mt-3 text-sm text-bark">Published {guide.date}</p>
          </article>
        </li>
      ))}
    </ul>
  );
};

export default GuideList;
