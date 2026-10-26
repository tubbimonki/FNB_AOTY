import { describe, expect, it } from 'vitest';
import { isDay, isLogDay, todaySA } from './checks.js';

describe('date checks', () => {
  it('isDay wants a real calendar day', () => {
    expect(isDay('2026-10-25')).toBe(true);
    expect(isDay('2026-02-31')).toBe(false);
    expect(isDay('25/10/2026')).toBe(false);
    expect(isDay(20261025)).toBe(false);
  });

  it('todaySA uses South African time, not the server clock', () => {
    // 23:30 UTC is already the next day in Johannesburg (UTC+2)
    expect(todaySA(new Date('2026-10-25T23:30:00Z'))).toBe('2026-10-26');
  });

  it('isLogDay allows up to tomorrow in SA, and nothing silly', () => {
    const now = new Date('2026-10-26T10:00:00Z');
    expect(isLogDay('2026-10-26', now)).toBe(true);
    expect(isLogDay('2026-10-27', now)).toBe(true); // a phone a few hours ahead
    expect(isLogDay('2026-10-28', now)).toBe(false);
    expect(isLogDay('2099-01-01', now)).toBe(false);
    expect(isLogDay('1999-12-31', now)).toBe(false);
    expect(isLogDay('2026-02-31', now)).toBe(false);
  });
});
