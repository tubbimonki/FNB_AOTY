import { describe, expect, it } from 'vitest';
import { DEFAULT_ANSWERS, estimateFootprint } from './footprint.js';

describe('estimateFootprint', () => {
  it('adds up home, travel and food', () => {
    const { total, breakdown } = estimateFootprint({
      kwhPerMonth: 300, householdSize: 3, carKmPerWeek: 100, busKmPerWeek: 0, flightsPerYear: 1, diet: 'vegetarian',
    });
    expect(breakdown.home).toBeCloseTo((300 * 12 * 0.95) / 3 / 1000); // 1.14 t
    expect(breakdown.car).toBeCloseTo((100 * 52 * 0.17) / 1000);      // 0.88 t
    expect(breakdown.flights).toBeCloseTo(0.62);
    expect(breakdown.food).toBe(1.4);
    expect(total).toBeCloseTo(1.14 + 0.884 + 0.62 + 1.4);
  });

  it('fills gaps with defaults and ignores nonsense', () => {
    expect(estimateFootprint({}).total).toBeCloseTo(estimateFootprint(DEFAULT_ANSWERS).total);
    const odd = estimateFootprint({ householdSize: 0, carKmPerWeek: -50, diet: 'rocks' });
    expect(odd.breakdown.car).toBe(0);
    expect(odd.breakdown.food).toBe(2.1);
    expect(Number.isFinite(odd.breakdown.home)).toBe(true);
    expect(estimateFootprint({ diet: 'toString' }).breakdown.food).toBe(2.1);
  });
});
