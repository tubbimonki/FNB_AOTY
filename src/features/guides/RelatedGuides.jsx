import { useId } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { guideItems } from './guideItems';

// "Related guides" card for the wide-screen side columns: the guides that go
// with the page you're on (water purification next to water usage, etc.).
const RelatedGuides = ({ ids, title = 'Related guides', className = '' }) => {
  const titleId = useId();
  const guides = ids.map((id) => guideItems.find((g) => g.id === id)).filter(Boolean);
  if (guides.length === 0) return null;

  return (
    <section aria-labelledby={titleId} className={`card ${className}`}>
      <h2 id={titleId} className="mb-2 flex items-center gap-2 text-base"><BookOpen className="size-4 text-amber-600" aria-hidden="true" />{title}</h2>
      <ul className="divide-y divide-slate-100">
        {guides.map((guide) => (
          <li key={guide.id} className="py-2">
            <Link to={`/dashboard/guides#guide-${guide.id}`} className="font-semibold text-forest-950">{guide.title}</Link>
            <p className="text-sm text-slate-600">{guide.summary}</p>
            <p className="mt-1 text-xs text-slate-500">{guide.topic} · {guide.minutes} min read</p>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default RelatedGuides;
