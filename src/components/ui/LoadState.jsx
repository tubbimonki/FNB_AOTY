// What a section shows while API data loads or after it fails.
// Use: if (status !== 'ready') return <LoadState status={status} retry={retry} what="updates" />
const LoadState = ({ status, retry, what = 'this' }) => {
  if (status === 'loading') {
    return <p className="animate-pulse py-6 text-center text-slate-500">Loading {what}…</p>;
  }
  return (
    <div className="py-6 text-center">
      <p className="mb-3 text-slate-600">Couldn't load {what}. Is the API running?</p>
      <button type="button" onClick={retry} className="btn btn-light border border-forest-200">Try again</button>
    </div>
  );
};

export default LoadState;
