import { Link } from 'react-router-dom';

// Numbered headline list for the sidebar; `linkTo(item)` gives each item's
// link, so the same widget serves news and guides. Scrolls past its height limit.
const HeadlinesWidget = ({ title, items, linkTo }) => {
  if (items.length === 0) return null;
  const titleId = `${title.toLowerCase().replaceAll(' ', '-')}-title`;

  return (
    <section aria-labelledby={titleId} className="card">
      <h2 id={titleId} className="mb-3 text-lg">{title}</h2>
      <ol className="scroll-box space-y-3" tabIndex={0} aria-label={title}>
        {items.map((item, index) => (
          <li key={item.id} className="flex gap-3">
            <span className="w-4 shrink-0 text-lg font-bold text-moss">{index + 1}</span>
            <Link to={linkTo(item)} className="font-semibold text-forest-800">
              {item.title}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
};

export default HeadlinesWidget;
