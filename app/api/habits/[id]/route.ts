import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

import { verifyPassword } from '@/lib/auth';

const habitsFile = path.join(process.cwd(), 'data', 'habits.json');
const monthsFile = path.join(process.cwd(), 'data', 'months.json');
const checksFile = path.join(process.cwd(), 'data', 'checks.json');

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const provided = request.headers.get('x-track-password') ?? ''; 
    if (!(await verifyPassword(provided))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Read and update habits
    const habitsData = await fs.readFile(habitsFile, 'utf8');
    let habits = JSON.parse(habitsData);
    habits = habits.filter((habit: any) => habit.id !== id);
    await fs.writeFile(habitsFile, JSON.stringify(habits, null, 2));

    // Read and update months
    const monthsData = await fs.readFile(monthsFile, 'utf8');
    let months = JSON.parse(monthsData);
    const relatedMonths = months.filter((month: any) => month.habit_id === id);
    months = months.filter((month: any) => month.habit_id !== id);
    await fs.writeFile(monthsFile, JSON.stringify(months, null, 2));

    // Read and update checks
    const checksData = await fs.readFile(checksFile, 'utf8');
    let checks = JSON.parse(checksData);
    const relatedMonthIds = relatedMonths.map((m: any) => m.id);
    checks = checks.filter((check: any) => !relatedMonthIds.includes(check.month_id));
    await fs.writeFile(checksFile, JSON.stringify(checks, null, 2));

    return NextResponse.json({ message: 'Habit deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 });
  }
}