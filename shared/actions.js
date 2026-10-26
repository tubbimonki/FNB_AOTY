// The everyday actions a user can log in Green Wallet (frontend and API).
//
// Each action says how much CO2 it avoids (kg) and how much money it saves (rand).
// Instead of typing magic numbers, we work them out from a few assumptions below,
// so if you find a better source you only change one line.
//
// These are rough estimates for South Africa. Check them before demo day and
// note your sources (Eskom, your municipality's tariff, the AA fuel price).

// --- Assumptions ---------------------------------------------------------
const GRID_KG_CO2_PER_KWH = 0.95; // SA grid is mostly coal, so this is high
const RAND_PER_KWH = 3.2;         // household electricity price
const PETROL_RAND_PER_LITRE = 22;
const CAR_LITRES_PER_KM = 0.08;   // a small car using 8 L per 100 km
const CAR_KG_CO2_PER_KM = 0.17;

// Helpers that turn "how much energy or driving" into CO2 and rand.
const fromElectricity = (kWh) => ({
  co2Kg: kWh * GRID_KG_CO2_PER_KWH,
  rand: kWh * RAND_PER_KWH,
});

const fromDriving = (km) => ({
  co2Kg: km * CAR_KG_CO2_PER_KM,
  rand: km * CAR_LITRES_PER_KM * PETROL_RAND_PER_LITRE,
});

// --- The actions ---------------------------------------------------------
// `id` never changes, so saved logs keep working even if you rename a label.
// The `...` (spread) copies co2Kg and rand from the helper into the object.
export const actions = [
  { id: 'walk-5km', category: 'travel', label: 'Walked or cycled 5 km instead of driving', ...fromDriving(5) },
  { id: 'carpool-20km', category: 'travel', label: 'Carpooled for a 20 km trip', ...fromDriving(10) }, // you only "save" your half
  { id: 'geyser-off', category: 'home', label: 'Switched the geyser off for the day', ...fromElectricity(2.5) },
  { id: 'short-shower', category: 'home', label: 'Took a 5 minute shower instead of 10', ...fromElectricity(1.5) },
  { id: 'line-dry', category: 'home', label: 'Line-dried laundry instead of using the tumble dryer', ...fromElectricity(2.5) },
  { id: 'cold-wash', category: 'home', label: 'Washed laundry on cold', ...fromElectricity(0.6) },
  { id: 'plugs-off', category: 'home', label: 'Switched appliances off at the wall overnight', ...fromElectricity(0.5) },
  { id: 'no-beef', category: 'food', label: 'Swapped a beef meal for beans or veg', co2Kg: 3.5, rand: 20 },
  // ROUGH: about 1 kg CO2 for a bag of mixed recycling. Needs a proper source.
  { id: 'recycle-bag', category: 'waste', label: 'Recycled a bag of plastic, glass, paper or cans', co2Kg: 1, rand: 0 },
  { id: 'litter-pickup', category: 'waste', label: 'Picked up litter in my street or park', co2Kg: 0, rand: 0 },
];

// Groups for the action dropdown, in the order they are shown.
export const categories = [
  { id: 'travel', label: 'Getting around' },
  { id: 'home', label: 'Energy at home' },
  { id: 'food', label: 'Food' },
  { id: 'waste', label: 'Waste and recycling' },
];

// Look up one action by its id, e.g. findAction('cold-wash').
export const findAction = (id) => actions.find((action) => action.id === id);
