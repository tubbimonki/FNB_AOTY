import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { useScrollReveal } from './useScrollReveal';
import { useCountUp } from './useCountUp';

// jsdom has no IntersectionObserver, so this fake one remembers what it
// watches and lets a test say "these elements just scrolled into view".
let watcher;
class FakeObserver {
  constructor(callback) { this.callback = callback; this.watched = new Set(); watcher = this; }
  observe(el) { this.watched.add(el); }
  unobserve(el) { this.watched.delete(el); }
  disconnect() { this.watched.clear(); }
  show(...els) { this.callback(els.map((target) => ({ target, isIntersecting: true }))); }
}

const Page = () => {
  const ref = useRef(null);
  useScrollReveal(ref, 'home');
  return (
    <div ref={ref}>
      <div className="card">On screen</div>
      <div className="card">Below the fold</div>
      <div className="card" data-reveal="off">Opted out</div>
    </div>
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
  delete window.matchMedia;
});

describe('useScrollReveal', () => {
  it('hides cards below the fold until they scroll into view', () => {
    vi.stubGlobal('IntersectionObserver', FakeObserver);
    // Lay the cards out before the hook's first scan runs.
    const spy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
      return { top: this.textContent === 'On screen' ? 10 : 2000, bottom: 0, height: 100 };
    });
    render(<Page />);
    spy.mockRestore();

    const below = screen.getByText('Below the fold');
    expect(screen.getByText('On screen')).not.toHaveAttribute('data-reveal');
    expect(screen.getByText('Opted out')).toHaveAttribute('data-reveal', 'off');
    expect(below).toHaveAttribute('data-reveal', 'wait');

    act(() => watcher.show(below));
    expect(below).toHaveAttribute('data-reveal', 'in');
    expect(watcher.watched.has(below)).toBe(false); // only ever plays once
  });

  it('does nothing for visitors who prefer reduced motion', () => {
    vi.stubGlobal('IntersectionObserver', FakeObserver);
    window.matchMedia = (query) => ({ matches: query.includes('reduce') });
    const spy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ top: 2000, bottom: 0, height: 100 });
    render(<Page />);
    spy.mockRestore();
    expect(screen.getByText('Below the fold')).not.toHaveAttribute('data-reveal');
  });
});

const Counter = () => {
  const [ref, value] = useCountUp(42);
  return <span ref={ref}>{value}</span>;
};

describe('useCountUp', () => {
  it('shows the final number straight away without IntersectionObserver', () => {
    render(<Counter />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('starts at 0 and waits to be seen when it can animate', () => {
    vi.stubGlobal('IntersectionObserver', FakeObserver);
    render(<Counter />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
