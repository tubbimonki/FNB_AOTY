// A 7-day bar chart in plain HTML and CSS: each bar's height is its share of
// the tallest day. Days over the goal turn amber; the dashed line is the goal.
const WeeklyBars = ({ days, goal, todayDate }) => {
  const top = Math.max(goal * 1.2, ...days.map((d) => d.litres));
  const weekday = (date) => new Date(`${date}T12:00`).toLocaleDateString('en-ZA', { weekday: 'short' });

  return (
    <div className="relative">
      <div aria-hidden="true" className="absolute inset-x-0 border-t-2 border-dashed border-forest-300" style={{ bottom: `calc(1.75rem + ${(goal / top) * 10}rem)` }} />
      <ol aria-label="Litres per day" className="grid grid-cols-7 items-end gap-2">
        {days.map((day) => {
          const over = day.litres > goal;
          const isToday = day.date === todayDate;
          return (
            <li key={day.date} className="flex flex-col items-center gap-1.5">
              <span className="sr-only">{`${weekday(day.date)}: ${day.litres} litres`}</span>
              <div className="flex h-40 w-full items-end" aria-hidden="true">
                <div
                  title={`${day.litres} L`}
                  className={`w-full rounded-t-lg motion-safe:transition-[height] motion-safe:duration-700 ${over ? 'bg-amber-500' : isToday ? 'bg-blue-700' : 'bg-blue-500'}`}
                  style={{ height: `${Math.max((day.litres / top) * 100, day.litres ? 4 : 1)}%` }}
                />
              </div>
              <span aria-hidden="true" className={`text-xs ${isToday ? 'font-bold text-blue-700' : 'text-slate-500'}`}>{weekday(day.date)}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default WeeklyBars;
