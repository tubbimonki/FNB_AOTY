import { Link } from 'react-router-dom';

// A small numbered list of headlines for the sidebar. It knows nothing about
// news or guides: the dashboard passes a title, the items, and `linkTo`,
// which turns an item into where clicking it should go.
const HeadlinesWidget = ({ title, items, linkTo }) => {
  if (items.length === 0) return null;
  const titleId = `${title.toLowerCase().replaceAll(' ', '-')}-title`;

  return (
    <section aria-labelledby={titleId} className="card">
      <h3 id={titleId} className="mb-3 text-lg">{title}</h3>
      <ol className="space-y-3">
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
