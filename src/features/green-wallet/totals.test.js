import { describe, expect, it } from 'vitest';
import { calculateTotals, calculateTotalsByDate } from './totals';
import { findAction } from './actions';

describe('calculateTotals', () => {
  it('returns zeros for no logs', () => {
    expect(calculateTotals([])).toEqual({ count: 0, co2Kg: 0, rand: 0 });
  });

  it('adds up CO2 and rand and skips unknown actions', () => {
    const logs = [
      { id: '1', actionId: 'cold-wash', date: '2026-10-24' },
      { id: '2', actionId: 'cold-wash', date: '2026-10-24' },
      { id: '3', actionId: 'deleted-action', date: '2026-10-24' },
    ];
    const coldWash = findAction('cold-wash');
    const totals = calculateTotals(logs);
    expect(totals.count).toBe(2);
    expect(totals.co2Kg).toBeCloseTo(coldWash.co2Kg * 2);
    expect(totals.rand).toBeCloseTo(coldWash.rand * 2);
  });

  it('groups totals by date', () => {
    const logs = [
      { id: '1', actionId: 'no-beef', date: '2026-10-23' },
      { id: '2', actionId: 'no-beef', date: '2026-10-24' },
      { id: '3', actionId: 'no-beef', date: '2026-10-24' },
    ];
    const byDate = calculateTotalsByDate(logs);
    expect(byDate['2026-10-23'].count).toBe(1);
    expect(byDate['2026-10-24'].co2Kg).toBeCloseTo(7);
  });
});
