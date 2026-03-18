'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Habit {
  id: string;
  name: string;
  goal: number;
  created_at: string;
}

interface Month {
  id: string;
  habit_id: string;
  year: number;
  month: number;
}

interface Check {
  id: string;
  month_id: string;
  day: number;
  completed: boolean;
  updated_at: string;
}

interface CacheEntry {
  monthsMap: Record<string, Month>;   // habitId -> Month
  checksMap: Record<string, Check[]>; // monthId -> Check[]
}

interface Props {
  year: number;
  month: number;
  password: string;
}

const WEEK_COLORS = [
  { bg: '#e8f5e9', color: '#2e7d32' },
  { bg: '#e3f2fd', color: '#1565c0' },
  { bg: '#fff3e0', color: '#e65100' },
  { bg: '#e8f5e9', color: '#2e7d32' },
  { bg: '#fff3e0', color: '#e65100' },
  { bg: '#e3f2fd', color: '#1565c0' },
];

// Compute Mon-Sun week groups covering all 31 columns
function getWeekGroups(year: number, month: number) {
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // 0=Sun … 6=Sat
  const firstDayMon = (firstDayOfMonth + 6) % 7; // Mon=0 … Sun=6

  const weeks: { label: string; days: number[] }[] = [];
  let day = 1;
  let weekNum = 1;

  // First (possibly partial) week: from day 1 to the first Sunday
  const firstWeek: number[] = [];
  for (let i = 0; i < 7 - firstDayMon; i++) firstWeek.push(day++);
  weeks.push({ label: `WEEK ${weekNum++}`, days: firstWeek });

  // Remaining weeks until day 31
  while (day <= 31) {
    const week: number[] = [];
    for (let i = 0; i < 7 && day <= 31; i++) week.push(day++);
    weeks.push({ label: `WEEK ${weekNum++}`, days: week });
  }

  return weeks.map((w, i) => ({ ...w, ...WEEK_COLORS[i % WEEK_COLORS.length] }));
}

const ALL_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function HabitTable({ year, month, password }: Props) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [monthsMap, setMonthsMap] = useState<Record<string, Month>>({});
  const [checksMap, setChecksMap] = useState<Record<string, Check[]>>({});
  const [loading, setLoading] = useState(true);
  const [newHabitName, setNewHabitName] = useState('');
  const [editingGoal, setEditingGoal] = useState<{ id: string; value: string } | null>(null);
  const cache = useRef<Record<string, CacheEntry>>({});

  const cacheKey = `${year}-${month}`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const todayDay = today.getDate();

  const loadMonthData = useCallback(async (y: number, m: number, applyToState: boolean) => {
    const key = `${y}-${m}`;
    try {
      const monthsRes = await fetch(`/api/months?year=${y}&month=${m}`, {
        headers: { 'x-track-password': password },
      });
      const months: Month[] = await monthsRes.json();

      const mMap: Record<string, Month> = {};
      for (const mo of months) mMap[mo.habit_id] = mo;

      const checksResults = await Promise.all(
        months.map(mo =>
          fetch(`/api/checks?month_id=${mo.id}`, { headers: { 'x-track-password': password } }).then(r => r.json())
        )
      );

      const cMap: Record<string, Check[]> = {};
      months.forEach((mo, i) => { cMap[mo.id] = checksResults[i]; });

      cache.current[key] = { monthsMap: mMap, checksMap: cMap };
      if (applyToState) {
        setMonthsMap(mMap);
        setChecksMap(cMap);
      }
    } catch (e) {
      console.error('Failed to load month data', e);
    }
  }, [password]);

  // Fetch habits once
  useEffect(() => {
    fetch('/api/habits', { headers: { 'x-track-password': password } })
      .then(r => r.json())
      .then(setHabits);
  }, [password]);

  // Load month data + prefetch neighbours on month change
  useEffect(() => {
    const cached = cache.current[cacheKey];
    if (cached) {
      setMonthsMap(cached.monthsMap);
      setChecksMap(cached.checksMap);
      setLoading(false);
    } else {
      setLoading(true);
      loadMonthData(year, month, true).then(() => setLoading(false));
    }

    const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
    const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
    if (!cache.current[`${prev.y}-${prev.m}`]) loadMonthData(prev.y, prev.m, false);
    if (!cache.current[`${next.y}-${next.m}`]) loadMonthData(next.y, next.m, false);
  }, [year, month]);

  const getChecks = (habitId: string): Check[] => {
    const mo = monthsMap[habitId];
    if (!mo) return [];
    return checksMap[mo.id] || [];
  };

  const handleCheck = async (habitId: string, day: number) => {
    if (day > daysInMonth) return;

    let mo = monthsMap[habitId];
    let currentMonthsMap = monthsMap;
    let currentChecksMap = checksMap;

    if (!mo) {
      const res = await fetch('/api/months', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-track-password': password },
        body: JSON.stringify({ habit_id: habitId, year, month }),
      });
      mo = await res.json();
      currentMonthsMap = { ...monthsMap, [habitId]: mo };
      setMonthsMap(currentMonthsMap);
    }

    const checks = currentChecksMap[mo.id] || [];
    const existing = checks.find(c => c.day === day);

    if (existing) {
      const updated = checks.map(c => c.id === existing.id ? { ...c, completed: !c.completed } : c);
      currentChecksMap = { ...currentChecksMap, [mo.id]: updated };
      setChecksMap(currentChecksMap);
      cache.current[cacheKey] = { monthsMap: currentMonthsMap, checksMap: currentChecksMap };
      fetch(`/api/checks/${existing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-track-password': password },
        body: JSON.stringify({ completed: !existing.completed }),
      });
    } else {
      const tempId = `temp-${habitId}-${day}`;
      const optimistic = [...checks, { id: tempId, month_id: mo.id, day, completed: true, updated_at: '' }];
      currentChecksMap = { ...currentChecksMap, [mo.id]: optimistic };
      setChecksMap(currentChecksMap);
      cache.current[cacheKey] = { monthsMap: currentMonthsMap, checksMap: currentChecksMap };

      const res = await fetch('/api/checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-track-password': password },
        body: JSON.stringify({ month_id: mo.id, day, completed: true }),
      });
      const saved: Check = await res.json();
      const withSaved = optimistic.map(c => c.id === tempId ? saved : c);
      setChecksMap(prev => ({ ...prev, [mo.id]: withSaved }));
      cache.current[cacheKey] = { monthsMap: currentMonthsMap, checksMap: { ...currentChecksMap, [mo.id]: withSaved } };
    }
  };

  const handleAddHabit = async () => {
    if (!newHabitName.trim()) return;
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-track-password': password },
      body: JSON.stringify({ name: newHabitName.trim(), goal: 30 }),
    });
    const habit: Habit = await res.json();
    setHabits(prev => [...prev, habit]);
    setNewHabitName('');
  };

  const handleDeleteHabit = (habitId: string) => {
    if (!confirm('Delete this habit?')) return;
    setHabits(prev => prev.filter(h => h.id !== habitId));
    fetch(`/api/habits/${habitId}`, { method: 'DELETE', headers: { 'x-track-password': password } });
  };

  const handleGoalSave = (habitId: string, value: string) => {
    const goal = parseInt(value);
    if (!isNaN(goal) && goal > 0) {
      setHabits(prev => prev.map(h => h.id === habitId ? { ...h, goal } : h));
      fetch(`/api/habits/${habitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-track-password': password },
        body: JSON.stringify({ goal }),
      });
    }
    setEditingGoal(null);
  };

  const getDailyTotal = (day: number) =>
    habits.reduce((n, h) => n + (getChecks(h.id).find(c => c.day === day && c.completed) ? 1 : 0), 0);

  const weekCols = getWeekGroups(year, month);

  const progressColor = (pct: number) =>
    pct >= 80 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-500';

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-sm w-full min-w-max">
        <thead>
          {/* Week headers */}
          <tr>
            <th className="border border-gray-200 px-2 py-1 bg-gray-50 text-gray-500 font-normal" rowSpan={2}>#</th>
            <th className="border border-gray-200 px-3 py-1 bg-gray-50 text-left text-gray-500 font-normal min-w-[160px]" rowSpan={2}>Habit Name</th>
            <th className="border border-gray-200 px-2 py-1 bg-gray-50 text-gray-500 font-normal" rowSpan={2}>Goal</th>
            {weekCols.map(w => (
              <th
                key={w.label}
                colSpan={w.days.length}
                className="border border-gray-200 px-1 py-1 text-center text-xs font-semibold"
                style={{ backgroundColor: w.bg, color: w.color }}
              >
                {w.label}
              </th>
            ))}
            <th className="border border-gray-200 px-2 py-1 bg-gray-50 text-gray-500 font-normal" rowSpan={2}>Done</th>
            <th className="border border-gray-200 px-2 py-1 bg-gray-50 text-gray-500 font-normal" rowSpan={2}>Left</th>
            <th className="border border-gray-200 px-2 py-1 bg-gray-50 text-gray-500 font-normal w-24" rowSpan={2}>Progress</th>
            <th className="border border-gray-200 px-2 py-1 bg-gray-50 text-gray-500 font-normal" rowSpan={2}>%</th>
          </tr>
          {/* Day numbers */}
          <tr>
            {ALL_DAYS.map(day => {
              const valid = day <= daysInMonth;
              const isToday = isCurrentMonth && day === todayDay;
              return (
                <th
                  key={day}
                  className={`border border-gray-200 w-7 py-1 text-center font-normal text-xs
                    ${!valid ? 'text-gray-300' : 'text-gray-500'}
                    ${isToday ? '!text-orange-500 font-bold' : ''}`}
                >
                  {day}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {habits.map((habit, i) => {
            const checks = getChecks(habit.id);
            const done = checks.filter(c => c.completed).length;
            const left = Math.max(0, habit.goal - done);
            const pct = habit.goal > 0 ? Math.round((done / habit.goal) * 100) : 0;

            return (
              <tr key={habit.id} className="hover:bg-gray-50 group">
                <td className="border border-gray-200 px-2 py-1 text-center text-gray-400 text-xs">{i + 1}</td>
                <td className="border border-gray-200 px-3 py-1 font-medium">
                  <div className="flex items-center justify-between gap-2">
                    <span>{habit.name}</span>
                    <button
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="text-red-400 opacity-0 group-hover:opacity-100 text-base leading-none shrink-0"
                    >×</button>
                  </div>
                </td>
                <td className="border border-gray-200 px-1 py-1 text-center text-gray-600">
                  {editingGoal?.id === habit.id ? (
                    <input
                      type="number"
                      value={editingGoal.value}
                      onChange={e => setEditingGoal({ id: habit.id, value: e.target.value })}
                      onBlur={() => handleGoalSave(habit.id, editingGoal.value)}
                      onKeyDown={e => e.key === 'Enter' && handleGoalSave(habit.id, editingGoal.value)}
                      className="w-10 text-center border rounded text-sm"
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => setEditingGoal({ id: habit.id, value: String(habit.goal) })}
                      className="cursor-pointer hover:underline"
                    >
                      {habit.goal}
                    </span>
                  )}
                </td>

                {ALL_DAYS.map(day => {
                  const valid = day <= daysInMonth;
                  const check = checks.find(c => c.day === day);
                  const completed = check?.completed ?? false;
                  return (
                    <td
                      key={day}
                      onClick={() => valid && handleCheck(habit.id, day)}
                      className={`border border-gray-200 w-7 h-7 text-center select-none
                        ${valid ? 'cursor-pointer' : 'bg-gray-50 cursor-default'}
                        ${completed ? 'bg-green-400' : valid ? 'hover:bg-green-100' : ''}`}
                    >
                      {completed && <span className="text-white text-xs font-bold">✓</span>}
                    </td>
                  );
                })}

                <td className="border border-gray-200 px-2 py-1 text-center font-semibold text-gray-700">{done}</td>
                <td className="border border-gray-200 px-2 py-1 text-center text-gray-400">{left}</td>
                <td className="border border-gray-200 px-3 py-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${progressColor(pct)}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </td>
                <td className="border border-gray-200 px-2 py-1 text-center font-semibold text-gray-700">{pct}%</td>
              </tr>
            );
          })}

          {/* Daily totals row */}
          <tr className="bg-gray-50">
            <td colSpan={3} className="border border-gray-200 px-3 py-1 text-right text-xs text-gray-400 font-medium">
              Daily Total:
            </td>
            {ALL_DAYS.map(day => (
              <td key={day} className="border border-gray-200 w-7 py-1 text-center text-xs text-gray-500">
                {day <= daysInMonth ? (getDailyTotal(day) || '') : ''}
              </td>
            ))}
            <td colSpan={4} className="border border-gray-200" />
          </tr>
        </tbody>
      </table>

      {/* Add habit */}
      <div className="flex items-center gap-2 mt-3">
        <input
          type="text"
          value={newHabitName}
          onChange={e => setNewHabitName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddHabit()}
          placeholder="New habit name..."
          className="border border-gray-300 px-2 py-1 text-sm rounded focus:outline-none focus:border-blue-400"
        />
        <button onClick={handleAddHabit} className="text-green-600 font-bold text-xl leading-none">+</button>
      </div>
    </div>
  );
}
