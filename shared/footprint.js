// Carbon footprint estimate, used by the questionnaire (frontend) and
// POST /api/eco/footprint (backend). Pure JS, no imports, so both can load it.
// Every factor has a source in the write-up; change one line to update it.

// kg CO2e per unit.
const FACTORS = {
  gridKgPerKWh: 0.95,      // SA grid, mostly coal (same as Green Wallet)
  carKgPerKm: 0.17,        // average petrol car
  busKgPerKm: 0.1,         // bus or minibus taxi, per passenger
  flightKgPerReturn: 620,  // domestic return flight, e.g. JHB to CPT and back
};

// Tonnes CO2e per person per year by diet (Scarborough et al. 2014, kg/day x 365).
export const DIETS = {
  'meat-heavy': { label: 'Meat most days', tonnes: 2.6 },
  average: { label: 'Some meat', tonnes: 2.1 },
  vegetarian: { label: 'Vegetarian', tonnes: 1.4 },
  vegan: { label: 'Vegan', tonnes: 1.1 },
};

export const DEFAULT_ANSWERS = {
  kwhPerMonth: 350,
  householdSize: 3,
  carKmPerWeek: 100,
  busKmPerWeek: 20,
  flightsPerYear: 0,
  diet: 'average',
};

// Rough SA average, tonnes CO2 per person per year (Our World in Data).
export const SA_AVERAGE_TONNES = 7;

const clamp = (n, min, max) => Math.min(max, Math.max(min, Number(n) || 0));

// answers -> { total, breakdown: { home, car, bus, flights, food } } in tonnes per year.
export function estimateFootprint(answers) {
  const a = { ...DEFAULT_ANSWERS, ...answers };
  const people = clamp(a.householdSize, 1, 20);
  const breakdown = {
    home: (clamp(a.kwhPerMonth, 0, 10000) * 12 * FACTORS.gridKgPerKWh) / people / 1000,
    car: (clamp(a.carKmPerWeek, 0, 5000) * 52 * FACTORS.carKgPerKm) / 1000,
    bus: (clamp(a.busKmPerWeek, 0, 5000) * 52 * FACTORS.busKgPerKm) / 1000,
    flights: (clamp(a.flightsPerYear, 0, 100) * FACTORS.flightKgPerReturn) / 1000,
    food: (Object.hasOwn(DIETS, a.diet) ? DIETS[a.diet] : DIETS.average).tonnes, // hasOwn: 'toString' is not a diet
  };
  const total = Object.values(breakdown).reduce((sum, t) => sum + t, 0);
  return { total, breakdown };
}
