import { describe, expect, it } from 'vitest';
import { compare, COMPARISONS } from './comparisons';

describe('impact comparisons', () => {
  it('turns kg of CO2 into something you can picture', () => {
    expect(compare(10, 0).text).toBe("That's like 40 km not driven in an average petrol car.");
    expect(compare(1.013, 1).text).toBe("That's like 1 kWh of coal-heavy grid power not used.");
    expect(compare(1, 2).text).toMatch(/^That's like 122 smartphone charges/);
  });

  it('wraps around the list and always names a source', () => {
    expect(compare(5, COMPARISONS.length)).toEqual(compare(5, 0));
    for (const c of COMPARISONS) expect(c.url).toMatch(/^https:\/\//);
  });
});
