import { describe, expect, it } from 'vitest';
import { nextCollection } from './collection';

describe('nextCollection', () => {
  // 2026-10-25 is a Sunday.
  it('finds the next weekday', () => {
    expect(nextCollection(2, '2026-10-25')).toBe('2026-10-27'); // Tuesday
  });
  it('counts today when today is collection day', () => {
    expect(nextCollection(0, '2026-10-25')).toBe('2026-10-25');
  });
  it('wraps into next week', () => {
    expect(nextCollection(6, '2026-10-31')).toBe('2026-10-31');
    expect(nextCollection(1, '2026-10-31')).toBe('2026-11-02');
  });
});
