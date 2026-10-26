import { ExternalLink } from 'lucide-react';

// The news page's main column: one card per story, in a scroll box with a
// height limit. Each title opens the full story on the publisher's site.
const NewsFeed = ({ items }) => {
  if (items.length === 0) {
    return <p className="card text-forest-700/70">No news yet. Check back soon.</p>;
  }

  return (
    <div role="group" aria-label="News stories" tabIndex={0} className="scroll-box scroll-box-tall">
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.id}>
            <article id={`news-${item.id}`} className="card">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-forest-500">
                {item.region === 'za' ? 'South Africa' : 'Global'} · {item.topic}{item.date && ` · ${item.date}`}
              </p>
              <h3 className="mb-2 text-lg sm:text-xl">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-forest-950">
                  {item.title}
                </a>
              </h3>
              {item.summary && <p className="text-forest-800/80">{item.summary}</p>}
              <p className="mt-3 flex items-center gap-1 text-sm text-bark">
                {item.source}
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </p>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NewsFeed;
