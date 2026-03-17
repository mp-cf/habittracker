'use client';

import { useState, useEffect, useRef } from 'react';

interface Check {
  id: string;
  month_id: string;
  day: number;
  completed: boolean;
  updated_at: string;
}

interface Month {
  id: string;
  habit_id: string;
  year: number;
  month: number;
}

interface CacheEntry {
  monthData: Month | null;
  checks: Check[];
}

interface MonthlyGridProps {
  habitId: string;
  year: number;
  month: number;
  password: string;
}

export default function MonthlyGrid({ habitId, year, month, password }: MonthlyGridProps) {
  const [monthData, setMonthData] = useState<Month | null>(null);
  const [checks, setChecks] = useState<Check[]>([]);
  const cache = useRef<Record<string, CacheEntry>>({});

  const cacheKey = `${year}-${month}`;

  const loadMonth = async (y: number, m: number, applyToState: boolean) => {
    const key = `${y}-${m}`;
    try {
      const res = await fetch(`/api/months?habit_id=${habitId}&year=${y}&month=${m}`, {
        headers: { 'x-track-password': password },
      });
      const months: Month[] = await res.json();
      const monthEntry = months[0] ?? null;
      let checksData: Check[] = [];
      if (monthEntry) {
        const checksRes = await fetch(`/api/checks?month_id=${monthEntry.id}`, {
          headers: { 'x-track-password': password },
        });
        checksData = await checksRes.json();
      }
      cache.current[key] = { monthData: monthEntry, checks: checksData };
      if (applyToState) {
        setMonthData(monthEntry);
        setChecks(checksData);
      }
    } catch (error) {
      console.error('Failed to fetch month/checks', error);
    }
  };

  useEffect(() => {
    const cached = cache.current[cacheKey];
    if (cached) {
      setMonthData(cached.monthData);
      setChecks(cached.checks);
    } else {
      loadMonth(year, month, true).then(() => {
        // Prefetch adjacent months in the background
        const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
        const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
        if (!cache.current[`${prev.y}-${prev.m}`]) loadMonth(prev.y, prev.m, false);
        if (!cache.current[`${next.y}-${next.m}`]) loadMonth(next.y, next.m, false);
      });
    }
  }, [habitId, year, month]);

  const handleCheck = async (day: number, completed: boolean) => {
    let currentMonth = monthData;
    if (!currentMonth) {
      const res = await fetch('/api/months', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-track-password': password },
        body: JSON.stringify({ habit_id: habitId, year, month }),
      });
      currentMonth = await res.json();
      setMonthData(currentMonth);
    }
    const existingCheck = checks.find(c => c.day === day);
    if (existingCheck) {
      const updated = checks.map(c => c.id === existingCheck.id ? { ...c, completed } : c);
      setChecks(updated);
      cache.current[cacheKey] = { monthData, checks: updated };
      fetch(`/api/checks/${existingCheck.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-track-password': password },
        body: JSON.stringify({ completed }),
      });
    } else {
      const tempId = `temp-${day}`;
      const optimistic = [...checks, { id: tempId, month_id: currentMonth!.id, day, completed, updated_at: '' }];
      setChecks(optimistic);
      cache.current[cacheKey] = { monthData, checks: optimistic };
      const res = await fetch('/api/checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-track-password': password },
        body: JSON.stringify({ month_id: currentMonth!.id, day, completed }),
      });
      const newCheck: Check = await res.json();
      setChecks(prev => prev.map(c => c.id === tempId ? newCheck : c));
      cache.current[cacheKey] = { monthData, checks: optimistic.map(c => c.id === tempId ? newCheck : c) };
    }
  };

  const daysInMonth = new Date(year, month, 0).getDate();

  return (
    <div className="grid grid-cols-7 md:grid-cols-31 gap-1 md:gap-1 mt-4">
      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
        const check = checks.find(c => c.day === day);
        const isCompleted = check?.completed || false;
        const isValidDay = day <= daysInMonth;
        return (
          <div
            key={day}
            className={`p-1 md:p-1 border text-center ${isCompleted ? 'bg-green-200' : 'bg-gray-100'} ${!isValidDay ? 'opacity-50' : ''}`}
          >
            <label className="w-full h-full flex items-center justify-center cursor-pointer">
              <input
                type="checkbox"
                checked={isCompleted}
                onChange={(e) => handleCheck(day, e.target.checked)}
                disabled={!isValidDay}
                className="hidden"
              />
              {day}
            </label>
          </div>
        );
      })}
    </div>
  );
}
