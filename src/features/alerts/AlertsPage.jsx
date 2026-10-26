import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import AppBar, { AppBarButton } from '../../components/ui/AppBar';
import Segmented from '../../components/ui/Segmented';
import { useWeather } from '../weather/useWeather';
import { describeWeather } from '../weather/weather';
import WeatherCard from '../weather/WeatherCard';
import { useAlerts } from './useAlerts';
import AlertCard from './AlertCard';
import EmergencyChecklist from './EmergencyChecklist';
import SourceStatus from './SourceStatus';

const dayName = (date) => new Date(`${date}T12:00`).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'short' });

// One row per forecast day, for the Forecast view.
const ForecastList = ({ weather }) => {
  if (!weather) return <p className="card text-slate-500">The forecast appears once the weather has loaded.</p>;
  return (
    <ol aria-label="Daily forecast" className="card divide-y divide-slate-100 p-0 sm:p-0">
      {weather.days.map((day) => {
        const d = describeWeather(day.code);
        return (
          <li key={day.date} className="flex items-center gap-3 px-4 py-3">
            <span className="text-3xl" aria-hidden="true">{d.icon}</span>
            <span className="flex-1">
              <span className="block font-semibold">{dayName(day.date)}</span>
              <span className="text-sm text-slate-500">{d.label} · 💧 {day.rainChance}% · UV {Math.round(day.uvMax ?? 0)}</span>
            </span>
            <span className="font-bold">{Math.round(day.maxC)}° <span className="font-normal text-slate-400">{Math.round(day.minC)}°</span></span>
          </li>
        );
      })}
    </ol>
  );
};

// The mockup's "Weather & Climate Alerts" screen.
const AlertsPage = () => {
  const weather = useWeather();
  const { alerts, sample, sources, apiStatus, retry: retryAlerts } = useAlerts(weather);
  const [view, setView] = useState('current');

  const refresh = () => {
    weather.retry();
    retryAlerts();
  };

  return (
    <>
      <AppBar title="Weather & Climate Alerts" back="/dashboard" action={<AppBarButton icon={RefreshCw} label="Refresh" onClick={refresh} />} />
      <main className="page grid gap-5 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Segmented
            label="Show"
            value={view}
            onChange={setView}
            options={[
              { id: 'current', label: 'Current' },
              { id: 'forecast', label: 'Forecast' },
              { id: 'alerts', label: `Alerts (${alerts.length})` },
            ]}
          />
          <SourceStatus apiStatus={apiStatus} sample={sample} sources={sources} />
          {view === 'current' && <WeatherCard {...weather} />}
          {view === 'forecast' && <ForecastList weather={weather.weather} />}
          {view === 'alerts' && (
            <section aria-label="Alerts" className="space-y-3">
              {alerts.length === 0 ? (
                <p className="card text-slate-600">No alerts for {weather.place.name} right now.</p>
              ) : (
                alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)
              )}
            </section>
          )}
          {/* The most serious alert stays visible whatever view is open. */}
          {view !== 'alerts' && alerts[0] && <AlertCard alert={alerts[0]} />}
        </div>
        <div className="lg:col-span-2">
          <EmergencyChecklist />
        </div>
      </main>
    </>
  );
};

export default AlertsPage;
