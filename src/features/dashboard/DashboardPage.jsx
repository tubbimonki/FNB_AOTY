import { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import NewsFeed from '../news/NewsFeed';
import { newsItems, topNews } from '../news/newsItems';
import GuideList from '../guides/GuideList';
import { guideItems, latestGuides } from '../guides/guideItems';
import WalletSummary from '../green-wallet/WalletSummary';
import FeatureStrip from './FeatureStrip';
import HeadlinesWidget from './HeadlinesWidget';

// The "read and learn" side of the app, where members land after logging in.
// News and guides share this one page instead of having a nav tab each; the
// interactive side (Green Wallet and future activities) lives at /tracker.
//
// Which list shows is kept in the URL (?view=guides), not in useState, so a
// link like /dashboard?view=guides opens the right one, refresh keeps it,
// and the browser's Back button switches back.
//
// Layout: from lg (1024px) a 3-column grid; the main list spans 2, the
// sidebar 1 (the 2:1 split). The sidebar shows the OTHER content type, so
// news readers see the latest guides and guide readers see the top news.
// On phones the sidebar is hidden: the feature strip above already links to
// both lists and shows today's Green Wallet number.
const DashboardPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { hash } = useLocation();
  const view = searchParams.get('view') === 'guides' ? 'guides' : 'news';

  // React Router changes the page without a reload, so the browser never
  // jumps to #guide-g1 by itself. Do it once the right list has rendered.
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash, view]);

  return (
    <main className="page max-w-6xl">
      <h2 className="page-title">Welcome back{user ? `, ${user.name}` : ''}</h2>
      <p className="page-intro">Climate news and practical guides in one place. Put them into practice in Green Wallet.</p>

      <FeatureStrip view={view} />

      <div className="grid gap-6 lg:grid-cols-3">
        <section aria-labelledby="main-list-title" className="lg:col-span-2">
          <h3 id="main-list-title" className="section-title">
            {view === 'news' ? 'News feed' : 'Latest guides'}
          </h3>
          {view === 'news' ? <NewsFeed items={newsItems} /> : <GuideList items={guideItems} />}
        </section>

        {/* self-start + sticky: on desktop the sidebar stays in view while
            the longer list scrolls past. top-24 (96px) clears the header. */}
        <aside aria-label="Sidebar" className="hidden flex-col gap-6 lg:sticky lg:top-24 lg:flex lg:self-start">
          {view === 'news' ? (
            <HeadlinesWidget
              title="New guides"
              items={latestGuides(guideItems, 3)}
              linkTo={(guide) => `?view=guides#guide-${guide.id}`}
            />
          ) : (
            <HeadlinesWidget
              title="Top news"
              items={topNews(newsItems)}
              linkTo={(story) => `?view=news#news-${story.id}`}
            />
          )}
          <WalletSummary />
        </aside>
      </div>
    </main>
  );
};

export default DashboardPage;
