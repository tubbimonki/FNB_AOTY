import { describe, expect, it } from 'vitest';
import {
  addDays,
  calculatePeriodTotals,
  calculateStreak,
  calculateTotals,
  calculateTotalsByDate,
  goalsFor,
  lastDays,
} from './totals';
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

describe('weekly helpers', () => {
  const log = (date, actionId = 'no-beef') => ({ id: date + actionId, actionId, date });

  it('moves dates across month ends', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('lists the last 7 days oldest first', () => {
    expect(lastDays(7, '2026-10-25')).toEqual([
      '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25',
    ]);
  });

  it('totals today or the rolling week', () => {
    const logs = [log('2026-10-25'), log('2026-10-19'), log('2026-10-18')];
    expect(calculatePeriodTotals(logs, 'day', '2026-10-25').count).toBe(1);
    expect(calculatePeriodTotals(logs, 'week', '2026-10-25').count).toBe(2); // the 18th is 8 days back
    expect(goalsFor('week').co2Kg).toBe(goalsFor('day').co2Kg * 7);
  });

  it('counts a streak, keeping it alive while today is still empty', () => {
    const logs = [log('2026-10-24'), log('2026-10-23'), log('2026-10-21')];
    expect(calculateStreak(logs, '2026-10-24')).toBe(2);
    expect(calculateStreak(logs, '2026-10-25')).toBe(2);
    expect(calculateStreak(logs, '2026-10-26')).toBe(0);
  });
});
