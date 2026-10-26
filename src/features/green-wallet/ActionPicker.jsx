import { useEffect, useId, useRef, useState } from 'react';
import { actions, categories } from './actions';
import { today } from './totals';

// The "Log an action" button under the rings, which drops down a panel of
// actions grouped by category. One tap on an action logs it and closes the
// panel.
//
// This is a "disclosure" pattern: a button with aria-expanded that shows and
// hides a region. Each action inside is an ordinary button, so Tab, Enter
// and screen readers work without extra code. (A true ARIA listbox or menu
// would need arrow-key handling written by hand.)
export default function ActionPicker({ onLog }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(today());
  const panelId = useId();
  const wrapperRef = useRef(null);
  const toggleRef = useRef(null);

  // While open: Escape or a click/tap outside closes the panel. The listeners
  // are added when it opens and removed (the cleanup function) when it closes.
  useEffect(() => {
    if (!open) return;
    // On a phone the panel can open below the fold, so bring it into view.
    // (The ?. skips this in tests: jsdom has no scrollIntoView.)
    document.getElementById(panelId)?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus(); // put keyboard focus back where it was
      }
    };
    const onPointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open, panelId]);

  const pick = (actionId) => {
    // A cleared or future date (typed past the max) logs as today.
    onLog(actionId, date && date <= today() ? date : today());
    setOpen(false);
    setDate(today());
    toggleRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="btn btn-light w-full justify-between gap-2"
      >
        Log an action
        <span aria-hidden="true" className={`transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {/* `hidden` removes it from view and from the accessibility tree. */}
      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full z-20 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-forest-100 bg-white p-3 text-forest-950 shadow-xl"
      >
        <label className="mb-3 flex items-center justify-between gap-3">
          <span className="label mb-0">When?</span>
          <input
            type="date"
            value={date}
            max={today()}
            onChange={(event) => setDate(event.target.value)}
            className="input w-auto"
          />
        </label>

        {categories.map((category) => (
          <section key={category.id} aria-label={category.label} className="mb-2 last:mb-0">
            <h3 className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-forest-600">
              {category.label}
            </h3>
            <ul>
              {actions
                .filter((action) => action.category === category.id)
                .map((action) => (
                  <li key={action.id}>
                    <button
                      type="button"
                      onClick={() => pick(action.id)}
                      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left hover:bg-forest-50"
                    >
                      <span>{action.label}</span>
                      <span className="shrink-0 text-xs text-forest-700/80">
                        {action.co2Kg.toFixed(1)} kg · R{action.rand.toFixed(0)}
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
