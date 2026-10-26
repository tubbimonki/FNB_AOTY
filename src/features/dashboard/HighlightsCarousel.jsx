import Carousel from '../../components/Carousel';

const STYLES = {
  alert: { label: 'Alert', card: 'border-amber-200 bg-amber-50', tag: 'bg-amber-200 text-amber-900' },
  community: { label: 'Community', card: 'border-forest-200 bg-forest-50', tag: 'bg-forest-200 text-forest-900' },
};

// One slide: a coloured tag says if it's an alert or a community event.
const HighlightCard = ({ item }) => {
  const style = STYLES[item.kind];
  const meta = [item.when, item.where, item.source].filter(Boolean).join(' · ');
  return (
    <article className={`flex h-full min-h-56 flex-col rounded-xl border p-5 ${style.card}`}>
      <p className="mb-3 flex items-center gap-2">
        <span className="text-2xl" aria-hidden="true">{item.icon}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${style.tag}`}>{style.label}</span>
      </p>
      <h3 className="mb-2 text-lg">{item.title}</h3>
      <p className="flex-1 text-forest-800">{item.body}</p>
      {meta && <p className="mt-3 text-sm font-semibold text-forest-700">{meta}</p>}
    </article>
  );
};

const HighlightsCarousel = ({ items, className = '' }) => (
  <section aria-labelledby="highlights-title" className={className}>
    <h2 id="highlights-title" className="mb-3 text-lg sm:text-xl">Alerts &amp; community</h2>
    <Carousel
      items={items}
      renderItem={(item) => <HighlightCard item={item} />}
      label="Alerts and community"
      itemName="highlight"
      interval={7000}
      className=""
      controlsClassName="text-forest-700"
    />
  </section>
);

export default HighlightsCarousel;
