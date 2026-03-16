'use client';

import { useState, useEffect } from 'react';
import AddHabitForm from '../components/AddHabitForm';
import HabitCard from '../components/HabitCard';

interface Habit {
  id: string;
  name: string;
  created_at: string;
}

export default function Home() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [password, setPassword] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const fetchHabits = async (pwd: string) => {
    try {
      const res = await fetch('/api/habits', {
        headers: { 'x-track-password': pwd },
      });
      const data: Habit[] = await res.json();
      setHabits(data);
    } catch (error) {
      console.error('Failed to fetch habits', error);
    }
  };

  const checkPassword = async (pwd: string) => {
    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd }),
      });

      if (!res.ok) {
        throw new Error('Invalid password');
      }

      setPassword(pwd);
      setAuthenticated(true);
      localStorage.setItem('habittrackerPassword', pwd);
      await fetchHabits(pwd);
    } catch (err) {
      setAuthenticated(false);
      setAuthError('Invalid password');
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    setCurrentDate(new Date());

    const stored = typeof window !== 'undefined' ? localStorage.getItem('habittrackerPassword') : null;
    if (stored) {
      checkPassword(stored);
    } else {
      setAuthLoading(false);
    }
  }, []);

  if (!currentDate || authLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow">
          <h1 className="text-xl font-semibold mb-4">Enter password</h1>
          <input
            type="password"
            value={inputPassword}
            onChange={(e) => setInputPassword(e.target.value)}
            className="w-full border p-2 mb-3"
            placeholder="Password"
          />
          {authError ? <p className="text-red-600 mb-2">{authError}</p> : null}
          <button
            onClick={() => checkPassword(inputPassword)}
            className="w-full bg-blue-500 text-white p-2"
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // JS months are 0-based

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Monthly Habit Tracker</h1>
      <div className="flex justify-between mb-4">
        <button onClick={handlePrevMonth} className="bg-gray-500 text-white p-2">Previous Month</button>
        <h2 className="text-xl">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
        <button onClick={handleNextMonth} className="bg-gray-500 text-white p-2">Next Month</button>
      </div>
      <div>
        {habits.map(habit => (
          <HabitCard
            key={habit.id}
            habit={habit}
            onDeleted={() => fetchHabits(password)}
            currentYear={currentYear}
            currentMonth={currentMonth}
            password={password}
          />
        ))}
      </div>
      <AddHabitForm onHabitAdded={() => fetchHabits(password)} password={password} />
    </div>
  );
}
