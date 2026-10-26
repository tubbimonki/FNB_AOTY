import { describe, expect, it } from 'vitest';
import { daysUnderGoal, lastWeek, litresByDate } from './water';

const logs = [
  { date: '2026-10-25', litres: 45 },
  { date: '2026-10-25', litres: 9 },
  { date: '2026-10-24', litres: 150 },
  { date: '2026-10-23', litres: 60 },
];

describe('water helpers', () => {
  it('adds up litres per day', () => {
    expect(litresByDate(logs)).toEqual({ '2026-10-25': 54, '2026-10-24': 150, '2026-10-23': 60 });
  });

  it('gives seven days ending today, zeros included', () => {
    const week = lastWeek(logs, '2026-10-25');
    expect(week).toHaveLength(7);
    expect(week.at(-1)).toEqual({ date: '2026-10-25', litres: 54 });
    expect(week[0]).toEqual({ date: '2026-10-19', litres: 0 });
  });

  it('counts finished days under the goal only', () => {
    // 23rd is under, 24th is over, today (25th) isn't finished yet.
    expect(daysUnderGoal(logs, 100, '2026-10-25')).toBe(1);
  });
});
