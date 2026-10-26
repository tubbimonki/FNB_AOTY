// Community report rules, used by the report form and POST /api/community/reports.

export const REPORT_CATEGORIES = [
  { id: 'hazard', label: 'Hazard (flooding, fallen tree, fire)' },
  { id: 'water', label: 'Water (burst pipe, no water, leak)' },
  { id: 'electricity', label: 'Electricity (outage, fallen line)' },
  { id: 'roads', label: 'Roads (pothole, blocked road)' },
  { id: 'waste', label: 'Waste (missed pickup, illegal dumping)' },
  { id: 'other', label: 'Something else' },
];

// Checks a new report. Returns an error message, or null when it's fine.
export function validateReport({ category, description, lat, lon } = {}) {
  if (!REPORT_CATEGORIES.some((c) => c.id === category)) return 'Pick a category';
  if (typeof description !== 'string' || description.trim().length < 5) return 'Describe the problem in a few words';
  if (description.length > 500) return 'Keep it under 500 characters';
  const hasSpot = lat !== undefined || lon !== undefined;
  if (hasSpot && !(Number.isFinite(lat) && Math.abs(lat) <= 90 && Number.isFinite(lon) && Math.abs(lon) <= 180)) {
    return 'Location must be numbers';
  }
  return null;
}
