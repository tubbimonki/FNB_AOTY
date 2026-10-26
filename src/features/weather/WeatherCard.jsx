import { useState } from 'react';
import Photo from '../../components/Photo';
import { pageImages } from '../../assets/images';
import { PLACES, describeWeather, greenTip } from './weather';

const weekday = (date, i) =>
  i === 0 ? 'Today' : new Date(`${date}T12:00`).toLocaleDateString('en-ZA', { weekday: 'short' });
const time = (ms) => new Date(ms).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });

// Picks a city, or asks the browser for GPS ("My location").
const PlacePicker = ({ place, onChange }) => {
  const [locating, setLocating] = useState(false);
  const canLocate = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  const locateMe = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        onChange({ id: 'gps', name: 'My location', lat: coords.latitude, lon: coords.longitude });
      },
      () => setLocating(false), // denied or failed: keep the current place
      { timeout: 10000, maximumAge: 30 * 60 * 1000 },
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor="weather-place" className="sr-only">Place</label>
      <select
        id="weather-place"
        value={place.id}
        onChange={(e) => onChange(PLACES.find((p) => p.id === e.target.value))}
        className="min-h-11 rounded-lg border-0 bg-white/15 px-3 text-base text-white"
      >
        {place.id === 'gps' && <option value="gps" className="text-forest-950">My location</option>}
        {PLACES.map((p) => (
          <option key={p.id} value={p.id} className="text-forest-950">{p.name}</option>
        ))}
      </select>
      {canLocate && (
        <button type="button" onClick={locateMe} disabled={locating} className="btn btn-light min-h-11 text-sm">
          {locating ? 'Finding you…' : '📍 My location'}
        </button>
      )}
    </div>
  );
};

// The main dashboard block: now, the next few days and a weather-aware tip.
const WeatherCard = ({ place, setPlace, status, weather, retry, className = '' }) => {
  const now = weather && describeWeather(weather.current.code, weather.current.isDay);

  return (
    <section
      aria-labelledby="weather-title"
      aria-busy={status === 'loading'}
      className={`relative isolate overflow-hidden rounded-3xl p-5 text-white shadow-md sm:p-6 ${className}`}
    >
      <Photo image={pageImages.alertsHero} background className="absolute inset-0 -z-20 h-full w-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-linear-to-br from-forest-900/80 to-forest-950/90" />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="weather-title" className="text-lg text-white sm:text-xl">Weather in {place.name}</h2>
        <PlacePicker place={place} onChange={setPlace} />
      </div>

      {status === 'error' && (
        <div className="py-6">
          <p className="mb-3">Weather is unavailable right now.</p>
          <button type="button" onClick={retry} className="btn btn-light">Try again</button>
        </div>
      )}

      {status === 'loading' && !weather && <p className="animate-pulse py-10 text-forest-100">Loading weather…</p>}

      {weather && (
        <>
          <div className="flex items-center gap-4">
            <span className="text-6xl sm:text-7xl" aria-hidden="true">{now.icon}</span>
            <div>
              <p className="text-5xl font-bold sm:text-6xl">{Math.round(weather.current.tempC)}°C</p>
              <p className="text-lg text-forest-100">{now.label}</p>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <div><dt className="text-forest-200">Feels like</dt><dd className="font-semibold">{Math.round(weather.current.feelsLikeC)}°C</dd></div>
            <div><dt className="text-forest-200">Humidity</dt><dd className="font-semibold">{weather.current.humidity}%</dd></div>
            <div><dt className="text-forest-200">Wind</dt><dd className="font-semibold">{Math.round(weather.current.windKph)} km/h</dd></div>
          </dl>

          <ol aria-label="Forecast" className="mt-5 grid grid-cols-4 gap-2 border-t border-white/15 pt-4 text-center">
            {weather.days.map((day, i) => {
              const d = describeWeather(day.code);
              return (
                <li key={day.date} className="rounded-xl bg-white/10 px-1 py-2 backdrop-blur-sm">
                  <p className="text-xs text-forest-100">{weekday(day.date, i)}</p>
                  <p className="text-2xl" role="img" aria-label={d.label}>{d.icon}</p>
                  <p className="text-sm font-semibold">{Math.round(day.maxC)}° <span className="font-normal text-forest-200">{Math.round(day.minC)}°</span></p>
                  <p className="text-xs text-forest-200">💧 {day.rainChance}%</p>
                </li>
              );
            })}
          </ol>

          <p className="mt-4 rounded-xl bg-sprout/20 p-3 text-sm"><strong>Green tip:</strong> {greenTip(weather)}</p>
          <p className="mt-3 text-xs text-forest-200">
            Updated {time(weather.fetchedAt)}{weather.stale && ' (offline copy)'} · Data: <a href="https://open-meteo.com/" className="text-forest-100 underline">Open-Meteo</a>
          </p>
        </>
      )}
    </section>
  );
};

export default WeatherCard;
