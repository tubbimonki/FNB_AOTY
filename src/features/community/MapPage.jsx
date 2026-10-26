import { lazy, Suspense } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LocateFixed, Plus } from 'lucide-react';
import AppBar, { AppBarButton } from '../../components/ui/AppBar';
import LoadState from '../../components/ui/LoadState';
import { useApiData } from '../../hooks/useApiData';
import { useWeather } from '../weather/useWeather';
import { useFacilities } from '../services/useFacilities';
import { useWide } from '../../hooks/useWide';
import EventsQuick from './EventsQuick';
import { FILTERS, PIN_TYPES, distanceKm, filterPins, withFacilities } from './pinTypes';

// Leaflet is big, so it loads only when someone opens the map ("code splitting").
const LeafletMap = lazy(() => import('./LeafletMap'));

// The mockup's Community Map: filter chips, the map, a legend and the same
// pins as a list (which is also how screen reader users get the map's content).
const MapPage = () => {
  const [params, setParams] = useSearchParams();
  const filter = params.get('filter') ?? 'all';
  const { place, setPlace } = useWeather(); // the same place as the weather
  const { status, data, retry } = useApiData('/community/pins');
  const nearby = useFacilities(place); // real clinics, halls etc. from OpenStreetMap
  const places = nearby.status === 'ready' ? nearby.data.places : null;
  const wide = useWide();

  const pins = data ? filterPins(withFacilities(data.pins, places), filter) : [];
  // Legend: only the kinds of pin on the map right now.
  const shownTypes = Object.keys(PIN_TYPES).filter((type) => pins.some((pin) => pin.type === type));
  // The list keeps to pins within 50 km; the map shows them all.
  const nearestFirst = pins
    .map((pin) => ({ ...pin, km: distanceKm(place, pin) }))
    .filter((pin) => pin.km <= 50)
    .sort((a, b) => a.km - b.km);

  const locate = () =>
    navigator.geolocation?.getCurrentPosition(({ coords }) =>
      setPlace({ id: 'gps', name: 'My location', lat: coords.latitude, lon: coords.longitude }),
    );

  return (
    <>
      <AppBar title="Community Map" back="/dashboard" action={<AppBarButton icon={LocateFixed} label="Centre on my location" onClick={locate} />} />
      <main className="page grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_26rem] 2xl:gap-6">
        <div className="space-y-3">
          <div role="group" aria-label="Filter pins" className="flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={filter === f.id}
                onClick={() => setParams(f.id === 'all' ? {} : { filter: f.id }, { replace: true })}
                className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-semibold ${
                  filter === f.id ? 'bg-forest-800 text-white' : 'bg-white text-slate-600 shadow-sm hover:text-forest-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="card overflow-hidden p-0 sm:p-0">
            <Suspense fallback={<div className="grid h-[55dvh] place-items-center text-slate-500">Loading map…</div>}>
              <LeafletMap center={place} pins={pins} className="h-[55dvh] min-h-80 w-full lg:h-[34rem] 2xl:h-[44rem]" />
            </Suspense>
            <ul aria-label="Legend" className="grid grid-cols-2 gap-2 border-t border-slate-100 p-3 text-sm">
              {shownTypes.map((type) => (
                <li key={type} className="flex items-center gap-2">
                  <span aria-hidden="true" className="grid size-5 place-items-center rounded-full text-[10px]" style={{ background: PIN_TYPES[type].color }}>{PIN_TYPES[type].icon}</span>
                  {PIN_TYPES[type].label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <section aria-labelledby="pins-title" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="pins-title" className="section-label mb-0">Near {place.name}</h2>
            <Link to="/community/report" className="btn min-h-10 py-1 text-sm"><Plus className="size-4" aria-hidden="true" />Report</Link>
          </div>
          {status !== 'ready' ? (
            <div className="card"><LoadState status={status} retry={retry} what="map pins" /></div>
          ) : (
            <ul className="card divide-y divide-slate-100 p-0 sm:p-0">
              {nearestFirst.length === 0 && <li className="p-4 text-slate-500">Nothing within 50 km for this filter.</li>}
              {nearestFirst.map((pin) => (
                <li key={pin.id} className="flex gap-3 p-4">
                  <span aria-hidden="true" className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs" style={{ background: PIN_TYPES[pin.type]?.color }}>{PIN_TYPES[pin.type]?.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{pin.url ? <a href={pin.url} target="_blank" rel="noreferrer">{pin.title}</a> : pin.title}</p>
                    <p className="text-sm text-slate-500">{pin.detail}</p>
                  </div>
                  <span className="shrink-0 text-sm text-slate-500">{pin.km.toFixed(1)} km</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-slate-500">
            {places?.length
              ? <>Facilities: map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors. </>
              : nearby.status === 'loading' ? 'Loading real facilities from OpenStreetMap… ' : 'Demo facilities: OpenStreetMap could not be reached. '}
            {data?.sample && 'Hazards and reports are sample pins until real reports come in.'}
          </p>
          {wide && <EventsQuick />}
        </section>
      </main>
    </>
  );
};

export default MapPage;
