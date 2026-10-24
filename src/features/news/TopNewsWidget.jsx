import { topNews } from './newsItems';

// Compact "Top news" list for the sidebar: just the headlines.
// Each headline links to its card in the feed (#news-n1 etc.).
const TopNewsWidget = ({ items, className = '' }) => {
  const stories = topNews(items);
  if (stories.length === 0) return null;

  return (
    <section aria-labelledby="top-news-title" className={`card ${className}`}>
      <h3 id="top-news-title" className="mb-3 text-lg">Top news</h3>
      <ol className="space-y-3">
        {stories.map((item, index) => (
          <li key={item.id} className="flex gap-3">
            <span className="w-4 shrink-0 text-lg font-bold text-moss">{index + 1}</span>
            <a href={`#news-${item.id}`} className="font-semibold text-forest-800">
              {item.title}
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
};

export default TopNewsWidget;
