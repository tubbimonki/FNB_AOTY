// Plant stages by this week's eco-points.
export const STAGES = [
  { min: 0, label: 'Seed' },
  { min: 10, label: 'Sprout' },
  { min: 50, label: 'Seedling' },
  { min: 120, label: 'Young plant' },
  { min: 250, label: 'In flower' },
];

export const stageFor = (points) => STAGES.findLastIndex((s) => points >= s.min);
