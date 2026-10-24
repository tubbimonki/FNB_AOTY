// The main column of the logged-in home page: one card per story.
// `items` comes in as a prop instead of being imported here, so the page
// decides where news comes from (placeholder list now, API later) and tests
// can pass their own list.
const NewsFeed = ({ items }) => {
  if (items.length === 0) {
    return <p className="card text-forest-700/70">No news yet. Check back soon.</p>;
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.id}>
          <article id={`news-${item.id}`} className="card">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-forest-500">
              {item.topic} · {item.date}
            </p>
            <h3 className="mb-2 text-lg sm:text-xl">{item.title}</h3>
            <p className="text-forest-800/80">{item.summary}</p>
            <p className="mt-3 text-sm text-bark">{item.source}</p>
          </article>
        </li>
      ))}
    </ul>
  );
};

export default NewsFeed;
