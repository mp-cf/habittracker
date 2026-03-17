'use client';

import { useState, useEffect } from 'react';

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

interface MonthlyGridProps {
  habitId: string;
  year: number;
  month: number;
  password: string;
}

export default function MonthlyGrid({ habitId, year, month, password }: MonthlyGridProps) {
  const [monthData, setMonthData] = useState<Month | null>(null);
  const [checks, setChecks] = useState<Check[]>([]);

  useEffect(() => {
    fetchMonth();
  }, [habitId, year, month]);

  const fetchMonth = async () => {
    try {
      const res = await fetch(`/api/months?habit_id=${habitId}&year=${year}&month=${month}`, {
        headers: { 'x-track-password': password },
      });
      const months: Month[] = await res.json();
      let monthEntry = months[0];
      if (!monthEntry) {
        // Create new month
        const createRes = await fetch('/api/months', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-track-password': password,
          },
          body: JSON.stringify({ habit_id: habitId, year, month }),
        });
        monthEntry = await createRes.json();
      }
      setMonthData(monthEntry);
      // Fetch checks
      const checksRes = await fetch(`/api/checks?month_id=${monthEntry.id}`, {
        headers: { 'x-track-password': password },
      });
      const checksData: Check[] = await checksRes.json();
      setChecks(checksData);
    } catch (error) {
      console.error('Failed to fetch month/checks', error);
    }
  };

  const handleCheck = async (day: number, completed: boolean) => {
    if (!monthData) return;
    const existingCheck = checks.find(c => c.day === day);
    if (existingCheck) {
      // Optimistic update
      setChecks(checks.map(c => c.id === existingCheck.id ? { ...c, completed } : c));
      fetch(`/api/checks/${existingCheck.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-track-password': password,
        },
        body: JSON.stringify({ completed }),
      });
    } else {
      // Optimistic update with a temporary id
      const tempId = `temp-${day}`;
      setChecks(prev => [...prev, { id: tempId, month_id: monthData.id, day, completed, updated_at: '' }]);
      const res = await fetch('/api/checks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-track-password': password,
        },
        body: JSON.stringify({ month_id: monthData.id, day, completed }),
      });
      const newCheck: Check = await res.json();
      setChecks(prev => prev.map(c => c.id === tempId ? newCheck : c));
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