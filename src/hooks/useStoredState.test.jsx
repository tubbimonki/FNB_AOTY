import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthContext } from '../features/auth/authContext';
import { useStoredState } from './useStoredState';

const asUser = (user) => ({ children }) => <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;

describe('useStoredState', () => {
  it('keeps one copy per account', () => {
    const thandi = renderHook(() => useStoredState('logs', []), { wrapper: asUser({ id: 1 }) });
    act(() => thandi.result.current[1](['a']));
    expect(JSON.parse(localStorage.getItem('logs:u1'))).toEqual(['a']);

    const sipho = renderHook(() => useStoredState('logs', []), { wrapper: asUser({ id: 2 }) });
    expect(sipho.result.current[0]).toEqual([]);
  });

  it('hands guest data to the first account that logs in', () => {
    localStorage.setItem('logs', JSON.stringify(['guest']));
    const { result } = renderHook(() => useStoredState('logs', []), { wrapper: asUser({ id: 3 }) });
    expect(result.current[0]).toEqual(['guest']);
    expect(localStorage.getItem('logs')).toBeNull();
  });

  it('falls back when the stored value has the wrong shape', () => {
    localStorage.setItem('logs', JSON.stringify({ not: 'a list' }));
    const { result } = renderHook(() => useStoredState('logs', []), { wrapper: asUser(null) });
    expect(result.current[0]).toEqual([]);
  });
});
