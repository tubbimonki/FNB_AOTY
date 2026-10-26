// Turns "kg of CO2 avoided" into things people can picture. Each one says
// where its number comes from, and the tracker links to it.
export const COMPARISONS = [
  {
    id: 'car',
    // EPA: a typical petrol car emits about 400 g of CO2 per mile = 249 g per km.
    kgPer: 0.249,
    say: (n) => `${n} km not driven in an average petrol car`,
    source: 'US EPA, typical passenger vehicle',
    url: 'https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle',
  },
  {
    id: 'grid',
    // DFFE: South Africa's grid emission factor, 1.013 kg CO2e per kWh (2021 data).
    kgPer: 1.013,
    say: (n) => `${n} kWh of coal-heavy grid power not used`,
    source: 'DFFE grid emission factor (via Engineering News)',
    url: 'https://www.engineeringnews.co.za/article/south-africas-inaugural-grid-emission-measure-highlights-coal-dependence-2024-02-14',
  },
  {
    id: 'phone',
    // EPA: 121,643 smartphone charges per tonne of CO2 = 8.22 g per charge.
    kgPer: 0.00822,
    say: (n) => `${n} smartphone charges`,
    source: 'US EPA equivalencies calculator',
    url: 'https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator',
  },
];

// kg -> { text, source, url } for comparison number `index` (wraps around).
export function compare(co2Kg, index = 0) {
  const c = COMPARISONS[((index % COMPARISONS.length) + COMPARISONS.length) % COMPARISONS.length];
  const n = co2Kg / c.kgPer;
  const rounded = n >= 100 ? Math.round(n).toLocaleString('en-ZA') : n >= 10 ? Math.round(n) : Math.round(n * 10) / 10;
  return { text: `That's like ${c.say(rounded)}.`, source: c.source, url: c.url };
}
