// Warnings worked out from the forecast. Used by the API (api/modules/alerts)
// and by the browser as a fallback when the API can't be reached.
// Looks at today and tomorrow only; each check adds at most one alert.
// Thresholds are rough versions of SAWS warning levels, see the alerts write-up.

const isStorm = (code) => code >= 95;

// severity: 'severe' (red), 'warning' (amber) or 'info' (blue).
export function weatherAlerts(weather, placeName) {
  if (!weather?.days) return [];
  const soon = weather.days.slice(0, 2);
  const alerts = [];
  const hot = soon.find((d) => d.maxC >= 32);
  const storm = soon.find((d) => isStorm(d.code));
  const flood = soon.find((d) => d.rainMm >= 30);
  const wet = soon.find((d) => d.rainChance >= 70);
  const windy = soon.find((d) => d.gustKph >= 60);
  const frost = soon.find((d) => d.minC <= 2);
  const uv = weather.days[0]?.uvMax ?? 0;

  if (hot) alerts.push({
    id: 'wx-heat', severity: hot.maxC >= 35 ? 'severe' : 'warning', icon: '🌡️', title: `Heat: up to ${Math.round(hot.maxC)}°C`,
    body: 'Drink water, check on elderly neighbours and keep pets in the shade. Close curtains in the day to keep rooms cool without aircon.',
  });
  if (storm) alerts.push({
    id: 'wx-storm', severity: 'severe', icon: '⛈️', title: 'Thunderstorms expected',
    body: 'Unplug sensitive electronics and avoid low-lying roads that flood.',
  });
  if (flood) alerts.push({
    id: 'wx-flood', severity: 'severe', icon: '🌊', title: `Heavy rain: ${Math.round(flood.rainMm)} mm`,
    body: 'Flooding is possible. Never drive or walk through moving water, and move valuables off the floor.',
  });
  else if (wet && !storm) alerts.push({
    id: 'wx-rain', severity: 'warning', icon: '🌧️', title: `Rain likely (${wet.rainChance}%)`,
    body: 'Skip watering the garden and put a bucket out to catch rainwater.',
  });
  if (windy) alerts.push({
    id: 'wx-wind', severity: windy.gustKph >= 80 ? 'severe' : 'warning', icon: '💨', title: `Strong wind: gusts ${Math.round(windy.gustKph)} km/h`,
    body: 'Tie down bins and loose roof sheets. Wind spreads fires fast, so no open fires or burning rubbish.',
  });
  if (frost) alerts.push({
    id: 'wx-frost', severity: frost.minC <= -2 ? 'warning' : 'info', icon: '🥶', title: `Frost: down to ${Math.round(frost.minC)}°C`,
    body: 'Cover seedlings, bring pets inside and keep blankets handy. Never use a braai or gas heater indoors.',
  });
  if (uv >= 8) alerts.push({
    id: 'wx-uv', severity: 'info', icon: '🧴', title: `Very high UV (${Math.round(uv)})`,
    body: 'Wear sunscreen and a hat between 10:00 and 15:00.',
  });

  return alerts.map((alert) => ({ ...alert, kind: 'alert', where: placeName, source: 'Live weather' }));
}
