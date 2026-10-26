// Pure helpers for the weather block: no React, no fetching, easy to test.

// Places in the picker. "My location" (browser GPS) is added at runtime.
export const PLACES = [
  { id: 'jhb', name: 'Johannesburg', lat: -26.2, lon: 28.05 },
  { id: 'cpt', name: 'Cape Town', lat: -33.92, lon: 18.42 },
  { id: 'dbn', name: 'Durban', lat: -29.86, lon: 31.03 },
  { id: 'pta', name: 'Pretoria', lat: -25.75, lon: 28.19 },
  { id: 'gqb', name: 'Gqeberha', lat: -33.96, lon: 25.6 },
  { id: 'blm', name: 'Bloemfontein', lat: -29.12, lon: 26.21 },
];

// A saved place is only used if it has real coordinates (old or hand-edited
// storage falls back to Johannesburg instead of breaking the page).
export const validPlace = (place) =>
  place && Number.isFinite(place.lat) && Number.isFinite(place.lon) ? place : PLACES[0];

// WMO weather codes (what Open-Meteo returns) -> words and an icon.
// Full table: https://open-meteo.com/en/docs#weather_variable_documentation
const CODES = [
  [[0], 'Clear sky', '☀️'],
  [[1], 'Mostly clear', '🌤️'],
  [[2], 'Partly cloudy', '⛅'],
  [[3], 'Overcast', '☁️'],
  [[45, 48], 'Fog', '🌫️'],
  [[51, 53, 55, 56, 57], 'Drizzle', '🌦️'],
  [[61, 63, 65, 66, 67], 'Rain', '🌧️'],
  [[71, 73, 75, 77, 85, 86], 'Snow', '❄️'],
  [[80, 81, 82], 'Showers', '🌦️'],
  [[95, 96, 99], 'Thunderstorm', '⛈️'],
];

export function describeWeather(code, isDay = true) {
  const match = CODES.find(([codes]) => codes.includes(code));
  if (!match) return { label: 'Unknown', icon: '🌡️' };
  const [, label, icon] = match;
  return { label, icon: code === 0 && !isDay ? '🌙' : icon };
}

// Forecast warnings live in shared/ so the API and the browser use the same rules.
export { weatherAlerts } from '../../../shared/weatherAlerts';

// One small, weather-aware climate habit for the weather block.
export function greenTip({ current, days }) {
  const today = days[0];
  if (today && today.rainChance >= 60) return 'Rain on the way: let it water the garden for you today.';
  if (current.tempC >= 28) return 'Hot day: a fan uses far less power than aircon. Close blinds on sunny windows.';
  if (current.tempC <= 10) return 'Chilly: a jersey and a blanket beat a heater for your bill and the grid.';
  if (current.windKph >= 25) return 'Windy and dry: washing on the line dries fast, no tumble dryer needed.';
  if (current.isDay && current.code <= 2) return 'Sunny: hang the washing outside and skip the tumble dryer.';
  return 'Switch off lights and plugs you are not using, every bit of load off the grid helps.';
}
