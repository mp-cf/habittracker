'use client';

import { useState, useEffect } from 'react';
import HabitTable from '../components/HabitTable';

export default function Home() {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [password, setPassword] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const checkPassword = async (pwd: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd }),
      });
      if (!res.ok) throw new Error();
      setPassword(pwd);
      setAuthenticated(true);
      localStorage.setItem('habittrackerPassword', pwd);
    } catch {
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

  if (!currentDate || authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow">
          <h1 className="text-xl font-semibold mb-4">Enter password</h1>
          <input
            type="password"
            value={inputPassword}
            onChange={e => setInputPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && checkPassword(inputPassword)}
            className="w-full border p-2 mb-3 rounded"
            placeholder="Password"
          />
          {authError && <p className="text-red-600 mb-2 text-sm">{authError}</p>}
          <button onClick={() => checkPassword(inputPassword)} className="w-full bg-blue-500 text-white p-2 rounded">
            Unlock
          </button>
        </div>
      </div>
    );
  }

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-xl font-bold text-gray-700">Monthly Habit Tracker</h1>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={handlePrevMonth} className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50">
            ← Prev
          </button>
          <span className="text-gray-700 font-medium min-w-[140px] text-center">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={handleNextMonth} className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50">
            Next →
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <HabitTable year={year} month={month} password={password} />
      </div>
    </div>
  );
}
