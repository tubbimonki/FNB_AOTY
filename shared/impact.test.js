import { describe, expect, it } from 'vitest';
import { computeImpact } from './impact.js';

const logs = (category, n) => Array.from({ length: n }, () => ({ category }));

describe('computeImpact', () => {
  it('starts at zero as a Seedling', () => {
    expect(computeImpact()).toMatchObject({ points: 0, level: 1, title: 'Seedling', nextAt: 500, nextTitle: 'Climate Hero' });
  });

  it('adds points from every source and levels up every 500', () => {
    const impact = computeImpact({ actionLogs: logs('travel', 30), waterDaysUnderGoal: 5, checklistDone: true, footprintDone: true });
    expect(impact.points).toBe(300 + 100 + 50 + 100);
    expect(impact).toMatchObject({ level: 2, title: 'Climate Hero', nextAt: 1000 });
  });

  it('unlocks badges once their goal is met', () => {
    const badges = computeImpact({ actionLogs: [...logs('travel', 5), ...logs('waste', 2)] }).badges;
    const byId = Object.fromEntries(badges.map((b) => [b.id, b]));
    expect(byId['green-commuter'].unlocked).toBe(true);
    expect(byId['recycling-champ']).toMatchObject({ have: 2, need: 5, unlocked: false });
  });

  it('stops at the top level', () => {
    expect(computeImpact({ actionLogs: logs('home', 1000) })).toMatchObject({ level: 5, nextTitle: null });
  });
});
