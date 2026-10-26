import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import IconChip from '../../components/ui/IconChip';

// One tile in a dashboard grid. "Stretched link": the title's <Link> has an
// ::after covering the card, so the whole tile is clickable while screen
// readers hear one short link name.
const MiniWidget = ({ to, icon, tone, title, summary, className = '' }) => (
  <article className={`card card-link relative flex flex-col gap-3 p-4 ${className}`}>
    <div className="flex items-start justify-between">
      <IconChip icon={icon} tone={tone} />
      <ArrowUpRight className="size-4 text-slate-400" aria-hidden="true" />
    </div>
    <div className="min-w-0">
      <h3 className="text-sm font-bold sm:text-base">
        <Link to={to} className="text-forest-950 no-underline after:absolute after:inset-0 after:rounded-2xl hover:no-underline">
          {title}
        </Link>
      </h3>
      <p className="text-xs text-slate-500 sm:text-sm">{summary}</p>
    </div>
  </article>
);

export default MiniWidget;
