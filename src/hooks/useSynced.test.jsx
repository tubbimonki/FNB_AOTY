import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../features/auth/authContext';
import { lastBodySentTo, mockApi } from '../test/mockApi';
import { useSyncedList, useSyncedValue } from './useSynced';

const asUser = (user) => ({ children }) => <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
const thandi = { id: 1, name: 'Thandi', email: 'thandi@example.com' };
// Each test starts offline, like setup.js does.
beforeEach(() => {
  vi.mocked(fetch).mockReset();
  vi.mocked(fetch).mockImplementation(() => Promise.reject(new Error('no network in tests')));
});

const log = (id, synced) => ({ id, actionId: 'cold-wash', date: '2026-10-25', ...(synced && { synced }) });

describe('useSyncedList', () => {
  it('shows what the database has once logged in', async () => {
    mockApi({ 'GET /api/wallet/logs': [200, { logs: [log('a')] }] });
    const { result } = renderHook(() => useSyncedList('logs', '/wallet/logs'), { wrapper: asUser(thandi) });
    await waitFor(() => expect(result.current[0]).toEqual([log('a', true)]));
  });

  it('sends logs saved offline (or as a guest) on the next load', async () => {
    localStorage.setItem('logs', JSON.stringify([log('guest')]));
    mockApi({ 'POST /api/wallet/logs/sync': [200, { logs: [log('guest'), log('b')] }] });
    const { result } = renderHook(() => useSyncedList('logs', '/wallet/logs'), { wrapper: asUser(thandi) });
    await waitFor(() => expect(result.current[0].map((l) => l.id)).toEqual(['guest', 'b']));
    expect(lastBodySentTo('/api/wallet/logs/sync')).toEqual({ logs: [log('guest')] });
  });

  it('drops logs that were deleted on another device', async () => {
    localStorage.setItem('logs:u1', JSON.stringify([log('gone', true), log('kept', true)]));
    mockApi({ 'GET /api/wallet/logs': [200, { logs: [log('kept')] }] });
    const { result } = renderHook(() => useSyncedList('logs', '/wallet/logs'), { wrapper: asUser(thandi) });
    await waitFor(() => expect(result.current[0]).toEqual([log('kept', true)]));
  });

  it('saves a new log to the API and marks it synced', async () => {
    mockApi({ 'GET /api/wallet/logs': [200, { logs: [] }], 'POST /api/wallet/logs': [201, { log: log('n') }], 'DELETE /api/wallet/logs/n': [204] });
    const { result } = renderHook(() => useSyncedList('logs', '/wallet/logs'), { wrapper: asUser(thandi) });
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    act(() => result.current[1](log('n')));
    await waitFor(() => expect(result.current[0]).toEqual([log('n', true)]));
    act(() => result.current[2]('n'));
    expect(result.current[0]).toEqual([]);
    expect(vi.mocked(fetch).mock.calls.at(-1)).toEqual(['/api/wallet/logs/n', expect.objectContaining({ method: 'DELETE' })]);
  });

  it('keeps a log deleted offline deleted, and sends the delete on the next load', async () => {
    localStorage.setItem('logs:u1', JSON.stringify([log('gone', true), log('kept', true)]));
    // First visit: offline, so the delete can't reach the API.
    const first = renderHook(() => useSyncedList('logs', '/wallet/logs'), { wrapper: asUser(thandi) });
    act(() => first.result.current[2]('gone'));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2)); // the load and the DELETE both failed
    expect(JSON.parse(localStorage.getItem('logs:u1:deleted'))).toEqual(['gone']);
    first.unmount();

    // Next visit: the API is back but still has the log until the DELETE arrives.
    mockApi({ 'DELETE /api/wallet/logs/gone': [204], 'GET /api/wallet/logs': [200, { logs: [log('kept')] }] });
    const { result } = renderHook(() => useSyncedList('logs', '/wallet/logs'), { wrapper: asUser(thandi) });
    await waitFor(() => expect(localStorage.getItem('logs:u1:deleted')).toBeNull());
    await waitFor(() => expect(result.current[0]).toEqual([log('kept', true)]));
    const calls = vi.mocked(fetch).mock.calls.map(([url, o]) => `${o?.method ?? 'GET'} ${url}`);
    expect(calls.indexOf('DELETE /api/wallet/logs/gone')).toBeLessThan(calls.indexOf('GET /api/wallet/logs'));
  });

  it("hides a log the server still has while its delete keeps failing", async () => {
    localStorage.setItem('logs:u1', JSON.stringify([log('kept', true)]));
    localStorage.setItem('logs:u1:deleted', JSON.stringify(['gone']));
    mockApi({ 'DELETE /api/wallet/logs/gone': [500, { error: 'Something went wrong' }], 'GET /api/wallet/logs': [200, { logs: [log('gone'), log('kept')] }] });
    const { result } = renderHook(() => useSyncedList('logs', '/wallet/logs'), { wrapper: asUser(thandi) });
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current[0]).toEqual([log('kept', true)]));
    expect(JSON.parse(localStorage.getItem('logs:u1:deleted'))).toEqual(['gone']);
  });

  it('keeps a log added while the first load was still on its way', async () => {
    let answer;
    vi.mocked(fetch).mockImplementation((url, options = {}) => {
      if (options.method === 'POST') return Promise.resolve(new Response(JSON.stringify({ log: log('new') }), { status: 201 }));
      return new Promise((resolve) => { answer = () => resolve(new Response(JSON.stringify({ logs: [] }), { status: 200 })); });
    });
    const { result } = renderHook(() => useSyncedList('logs', '/wallet/logs'), { wrapper: asUser(thandi) });
    act(() => result.current[1](log('new')));
    await waitFor(() => expect(result.current[0]).toEqual([log('new', true)]));
    await act(async () => answer()); // the old answer (without the new log) arrives last
    expect(result.current[0]).toEqual([log('new', true)]);
  });

  it('keeps working offline', async () => {
    const { result } = renderHook(() => useSyncedList('logs', '/wallet/logs'), { wrapper: asUser(thandi) }); // fetch fails in tests
    act(() => result.current[1](log('x')));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(result.current[0]).toEqual([log('x')]);
    expect(JSON.parse(localStorage.getItem('logs:u1'))).toEqual([log('x')]);
  });

  it('never calls the API for guests', () => {
    const { result } = renderHook(() => useSyncedList('logs', '/wallet/logs'), { wrapper: asUser(null) });
    act(() => result.current[1](log('g')));
    expect(fetch).not.toHaveBeenCalled();
    expect(result.current[0]).toEqual([log('g')]);
  });
});

describe('useSyncedValue', () => {
  it('uses the saved value from the database', async () => {
    mockApi({ 'GET /api/alerts/checklist': [200, { value: ['kit'] }] });
    const { result } = renderHook(() => useSyncedValue('ticks', '/alerts/checklist', []), { wrapper: asUser(thandi) });
    await waitFor(() => expect(result.current[0]).toEqual(['kit']));
  });

  it('uploads a value made before logging in when the database has none', async () => {
    localStorage.setItem('ticks', JSON.stringify(['water']));
    mockApi({ 'GET /api/alerts/checklist': [200, { value: [] }], 'PUT /api/alerts/checklist': [200, { value: ['water'] }] });
    const { result } = renderHook(() => useSyncedValue('ticks', '/alerts/checklist', []), { wrapper: asUser(thandi) });
    await waitFor(() => expect(lastBodySentTo('/api/alerts/checklist')).toEqual({ value: ['water'] }));
    expect(result.current[0]).toEqual(['water']);
  });

  it('says the value is pending until the API has it', async () => {
    mockApi({ 'GET /api/alerts/checklist': [200, { value: [] }], 'PUT /api/alerts/checklist': [200, { value: ['kit'] }] });
    const { result } = renderHook(() => useSyncedValue('ticks', '/alerts/checklist', []), { wrapper: asUser(thandi) });
    expect(result.current[2]).toBe(false);
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    act(() => result.current[1](['kit']));
    expect(result.current[2]).toBe(true);
    await waitFor(() => expect(result.current[2]).toBe(false));
  });

  it('saves changes with PUT', async () => {
    mockApi({ 'GET /api/alerts/checklist': [200, { value: [] }], 'PUT /api/alerts/checklist': [200, { value: ['kit'] }] });
    const { result } = renderHook(() => useSyncedValue('ticks', '/alerts/checklist', []), { wrapper: asUser(thandi) });
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    act(() => result.current[1](['kit']));
    await waitFor(() => expect(lastBodySentTo('/api/alerts/checklist')).toEqual({ value: ['kit'] }));
    await waitFor(() => expect(localStorage.getItem('ticks:u1:dirty')).toBeNull());
  });

  it('sends quick saves one at a time, so the newest one is what the server keeps', async () => {
    let finishFirst;
    const puts = [];
    vi.mocked(fetch).mockImplementation(async (url, options = {}) => {
      if (!options.method) return Response.json({ value: [] });
      puts.push(JSON.parse(options.body).value);
      if (puts.length === 1) await new Promise((resolve) => (finishFirst = resolve)); // the first PUT is slow
      return Response.json({ value: [] });
    });
    const { result } = renderHook(() => useSyncedValue('ticks', '/alerts/checklist', []), { wrapper: asUser(thandi) });
    await waitFor(() => expect(fetch).toHaveBeenCalled());

    act(() => result.current[1](['kit']));
    act(() => result.current[1](['kit', 'water']));
    act(() => result.current[1](['kit', 'water', 'charge']));
    expect(puts).toEqual([['kit']]); // the others wait for the first

    finishFirst();
    await waitFor(() => expect(localStorage.getItem('ticks:u1:dirty')).toBeNull());
    expect(puts).toEqual([['kit'], ['kit', 'water', 'charge']]); // the middle one is skipped
  });
});
