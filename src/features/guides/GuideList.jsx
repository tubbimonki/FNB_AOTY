import { ExternalLink } from 'lucide-react';
import { useWide } from '../../hooks/useWide';
import WaterQuick from '../water/WaterQuick';
import RecyclingQuick from '../recycling/RecyclingQuick';
import PowerQuick from '../services/PowerQuick';
import WalletSummary from '../green-wallet/WalletSummary';
import { latestGuides } from './guideItems';

// The quick tool that goes with each guide (guideItems' `widget`), so you can
// put it into practice straight away: log water next to water purification,
// check a bin next to recycling, see the power schedule next to energy.
const WIDGETS = {
  water: () => <WaterQuick />,
  power: () => <PowerQuick />,
  recycling: () => <RecyclingQuick />,
  ewaste: () => <RecyclingQuick material="ewaste" />,
  wallet: () => <WalletSummary />,
};

// Guides newest first, in a scroll box with a height limit. Each card's id lets
// the sidebar link to it (#guide-g1); its links open the full how-to elsewhere.
// Wide screens (2xl+) get the guide's quick tool beside it.
const GuideList = ({ items }) => {
  const wide = useWide();
  if (items.length === 0) {
    return <p className="card text-forest-700/70">No guides yet. Check back soon.</p>;
  }

  return (
    <div role="group" aria-label="Guides" tabIndex={0} className="scroll-box scroll-box-tall">
      <ul className="space-y-4">
        {latestGuides(items).map((guide) => (
          <li key={guide.id} className="2xl:grid 2xl:grid-cols-[minmax(0,1fr)_19rem] 2xl:items-start 2xl:gap-4">
            <article id={`guide-${guide.id}`} className="card">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-forest-500">
                {guide.topic} · {guide.minutes} min read
              </p>
              <h3 className="mb-2 text-lg sm:text-xl">{guide.title}</h3>
              <p className="text-forest-800/80">{guide.summary}</p>
              <ul aria-label={`Read more: ${guide.title}`} className="mt-3 space-y-1 text-sm">
                {guide.links.map((link) => (
                  <li key={link.url}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold">
                      {link.title}
                      <ExternalLink className="size-3.5" aria-hidden="true" />
                    </a>
                    <span className="text-bark"> · {link.publisher}</span>
                  </li>
                ))}
              </ul>
            </article>
            {wide && WIDGETS[guide.widget] && <aside aria-label={`Try it: ${guide.title}`}>{WIDGETS[guide.widget]()}</aside>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GuideList;
