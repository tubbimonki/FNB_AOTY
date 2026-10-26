import { CHECKLIST } from './checklist';
import { useChecklist } from './useChecklist';
import ProgressBar from '../../components/ui/ProgressBar';

// Tick-off list of things to do before bad weather. Real checkboxes, so
// keyboard and screen readers work with no extra code.
const EmergencyChecklist = () => {
  const { done, toggle, doneCount, total } = useChecklist();

  return (
    <section id="checklist" aria-labelledby="checklist-title" className="card">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 id="checklist-title" className="text-lg">Emergency Checklist</h2>
        <p className="text-sm font-semibold text-forest-700">{doneCount} of {total} done</p>
      </div>
      <ProgressBar value={doneCount} max={total} label="Checklist progress" className="mb-3" />
      <ul className="divide-y divide-slate-100">
        {CHECKLIST.map((item) => {
          const checked = done.includes(item.id);
          return (
            <li key={item.id}>
              <label className="flex min-h-12 cursor-pointer items-center gap-3 py-2">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(item.id)}
                  className="size-5 shrink-0 accent-forest-700"
                />
                <span className={checked ? 'text-slate-400 line-through' : ''}>{item.label}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default EmergencyChecklist;
