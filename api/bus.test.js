// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { createBus } from './bus.js';

describe('createBus', () => {
  it('runs every listener and waits for them', async () => {
    const bus = createBus();
    const heard = [];
    bus.on('log.created', async ({ userId }) => heard.push(`a${userId}`));
    bus.on('log.created', async ({ userId }) => heard.push(`b${userId}`));
    await bus.emit('log.created', { userId: 1 });
    expect(heard).toEqual(['a1', 'b1']);
  });

  it('gives a failing listener one more try', async () => {
    const bus = createBus({ retryMs: 0 });
    const flaky = vi.fn().mockRejectedValueOnce(new Error('connection dropped')).mockResolvedValue();
    bus.on('report.created', flaky);
    await bus.emit('report.created', { reportId: 1 });
    expect(flaky).toHaveBeenCalledTimes(2);
  });

  it('logs a listener that fails twice and never throws to the request', async () => {
    const log = vi.fn();
    const bus = createBus({ retryMs: 0, log });
    const ok = vi.fn();
    bus.on('badge.unlocked', () => Promise.reject(new Error('down')));
    bus.on('badge.unlocked', ok);
    await expect(bus.emit('badge.unlocked', {})).resolves.toBeUndefined();
    expect(ok).toHaveBeenCalledOnce();
    expect(log).toHaveBeenCalledWith('Listener for badge.unlocked failed twice:', expect.any(Error));
  });

  it('does nothing for an event nobody listens to', async () => {
    await expect(createBus().emit('nobody.cares', {})).resolves.toBeUndefined();
  });
});
