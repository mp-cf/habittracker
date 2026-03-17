'use client';

import { useState } from 'react';

interface Habit {
  id: string;
  name: string;
  created_at: string;
}

interface AddHabitFormProps {
  onHabitAdded: (habit: Habit) => void;
  password: string;
}

export default function AddHabitForm({ onHabitAdded, password }: AddHabitFormProps) {
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-track-password': password,
        },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const habit = await res.json();
        setName('');
        onHabitAdded(habit);
      }
    } catch (error) {
      console.error('Failed to add habit', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter habit name"
        className="border p-2 mr-2"
      />
      <button type="submit" className="bg-blue-500 text-white p-2">Add Habit</button>
    </form>
  );
}