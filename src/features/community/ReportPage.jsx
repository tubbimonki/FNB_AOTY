import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CircleCheck } from 'lucide-react';
import AppBar from '../../components/ui/AppBar';
import { apiPost } from '../../services/api';
import { REPORT_CATEGORIES, validateReport } from '../../../shared/reports';

// "Report a problem": a form that POSTs to /api/community/reports. The same
// validateReport runs here (for quick feedback) and on the server (for safety).
const ReportPage = () => {
  const [params] = useSearchParams();
  const [form, setForm] = useState({ category: params.get('category') ?? '', description: '' });
  const [spot, setSpot] = useState(null);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const addLocation = () =>
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => setSpot({ lat: coords.latitude, lon: coords.longitude }),
      () => setError("Couldn't get your location. You can still send the report."),
    );

  const submit = async (event) => {
    event.preventDefault();
    const report = { ...form, ...spot };
    const problem = validateReport(report);
    if (problem) return setError(problem);
    setError(null);
    setSending(true);
    try {
      await apiPost('/community/reports', report);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <AppBar title="Report a Problem" back="/community" />
      <main className="page max-w-xl">
        {sent ? (
          <div className="card text-center">
            <CircleCheck className="mx-auto mb-3 size-12 text-forest-600" aria-hidden="true" />
            <h2 className="mb-2 text-xl">Thanks, your report was sent</h2>
            <p className="mb-4 text-slate-600">Neighbours can now see it on the community map.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/map?filter=reports" className="btn">See it on the map</Link>
              <button type="button" onClick={() => { setSent(false); setForm({ category: '', description: '' }); setSpot(null); }} className="btn btn-light border border-forest-200">
                Report another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="card flex flex-col gap-4" noValidate>
            <p className="text-slate-600">See a problem? Help your community by reporting it directly.</p>
            <label className="flex flex-col">
              <span className="label">What kind of problem?</span>
              <select value={form.category} onChange={update('category')} className="input">
                <option value="">Choose one…</option>
                {REPORT_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </label>
            <label className="flex flex-col">
              <span className="label">What's happening?</span>
              <textarea value={form.description} onChange={update('description')} rows={4} maxLength={500} className="input" placeholder="e.g. Burst pipe flooding the corner of 4th Ave and Main Rd" />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={addLocation} className="btn btn-light border border-forest-200">📍 Add my location</button>
              {spot && <span className="text-sm text-forest-700">Location added</span>}
            </div>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={sending} className="btn">{sending ? 'Sending…' : 'Send report'}</button>
          </form>
        )}
      </main>
    </>
  );
};

export default ReportPage;
