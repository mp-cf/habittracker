'use client';

import { useState } from 'react';
import MonthlyGrid from './MonthlyGrid';

interface Habit {
  id: string;
  name: string;
  created_at: string;
}

interface HabitCardProps {
  habit: Habit;
  onDeleted: () => void;
  currentYear: number;
  currentMonth: number;
  password: string;
}

export default function HabitCard({ habit, onDeleted, currentYear, currentMonth, password }: HabitCardProps) {
  const handleDelete = async () => {
    if (confirm('Delete this habit?')) {
      try {
        await fetch(`/api/habits/${habit.id}`, {
          method: 'DELETE',
          headers: { 'x-track-password': password },
        });
        onDeleted();
      } catch (error) {
        console.error('Failed to delete habit', error);
      }
    }
  };

  return (
    <div className="border p-4 mb-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">{habit.name}</h3>
        <button onClick={handleDelete} className="bg-red-500 text-white p-1">Delete</button>
      </div>
      <MonthlyGrid habitId={habit.id} year={currentYear} month={currentMonth} password={password} />
    </div>
  );
}