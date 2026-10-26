import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import NewsFeed from '../news/NewsFeed';
import { topNews } from '../news/newsItems';
import { useNews } from '../news/useNews';
import GuideList from '../guides/GuideList';
import { guideItems, latestGuides } from '../guides/guideItems';
import WalletSummary from '../green-wallet/WalletSummary';
import FeatureStrip from './FeatureStrip';
import HeadlinesWidget from './HeadlinesWidget';

// The news page (/dashboard/news) and guides page (/dashboard/guides); App.jsx
// passes view="news" or view="guides". The sidebar shows the other content type
// plus today's Green Wallet totals, and is hidden on phones.
const titles = {
  news: { title: 'Climate news', intro: "What's happening in climate, at home and around the world." },
  guides: { title: 'Guides', intro: 'Practical how-tos, newest first. Put them into practice in Green Wallet.' },
};

const ReadingPage = ({ view }) => {
  const { hash } = useLocation();
  const { items: newsItems, source } = useNews();

  // Client-side navigation doesn't scroll to #guide-g1 by itself. newsItems is
  // a dependency because live stories arrive after the first render.
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash, view, newsItems]);

  // Phones: one column. lg+: strip on top, then a 2:1 grid (list | sidebar).
  // xl+: full width, strip as a left rail (10rem | flexible | 22rem sidebar).
  // 2xl+: the middle column widens so news runs in two columns and each guide
  // gets its quick tool beside it (see GuideList).
  return (
    <main className="page grid max-w-6xl gap-6 lg:grid-cols-3 xl:max-w-none xl:grid-cols-[10rem_minmax(0,1fr)_22rem] xl:gap-x-10 xl:pl-0 xl:pr-6">
      <div className="lg:col-span-3 xl:col-span-1 xl:col-start-2 xl:row-start-1 xl:mx-auto xl:w-full xl:max-w-3xl 2xl:max-w-6xl 4xl:max-w-[84rem]">
        <h1 className="page-title">{titles[view].title}</h1>
        <p className="page-intro mb-0 sm:mb-0">{titles[view].intro}</p>
      </div>

      <div className="lg:col-span-3 xl:col-span-1 xl:col-start-1 xl:row-span-2 xl:row-start-1">
        <FeatureStrip view={view} />
      </div>

      <section aria-labelledby="main-list-title" className="lg:col-span-2 xl:col-span-1 xl:col-start-2 xl:row-start-2 xl:mx-auto xl:w-full xl:max-w-3xl 2xl:max-w-6xl 4xl:max-w-[84rem]">
        <h2 id="main-list-title" className="section-title">
          {view === 'news' ? 'News feed' : 'Latest guides'}
        </h2>
        {view === 'news' && (
          <p className="mb-3 text-sm text-slate-500">
            {source === 'live' || source === 'stale'
              ? 'Live from climate news feeds. South Africa first, then global.'
              : 'Recent real stories, checked by hand. Live feeds are not reachable right now.'}
          </p>
        )}
        {view === 'news' ? <NewsFeed items={newsItems} /> : <GuideList items={guideItems} />}
      </section>

      {/* Sticky, so the sidebar stays in view while the list scrolls; top-24 clears the header. */}
      <aside aria-label="Sidebar" className="hidden flex-col gap-6 lg:sticky lg:top-24 lg:flex lg:self-start xl:col-start-3 xl:row-span-2 xl:row-start-1">
        {view === 'news' ? (
          <HeadlinesWidget
            title="New guides"
            items={latestGuides(guideItems, 3)}
            linkTo={(guide) => `/dashboard/guides#guide-${guide.id}`}
          />
        ) : (
          <HeadlinesWidget
            title="Top news"
            items={topNews(newsItems)}
            linkTo={(story) => `/dashboard/news#news-${story.id}`}
          />
        )}
        {/* On wide screens the guides list already shows it beside the food guide. */}
        <WalletSummary className={view === 'guides' ? '2xl:hidden' : ''} />
      </aside>
    </main>
  );
};

export default ReadingPage;
