import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const provided = request.headers.get('x-track-password') ?? '';
  if (!(await verifyPassword(provided))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    const habits = await prisma.habit.findMany({
      where: {
        ...(year ? { year: parseInt(year) } : {}),
        ...(month ? { month: parseInt(month) } : {}),
      },
      orderBy: { created_at: 'asc' },
    });
    return NextResponse.json(habits);
  } catch (e) {
    console.error('GET /api/habits error:', e);
    return NextResponse.json({ error: 'Failed to fetch habits', detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const provided = request.headers.get('x-track-password') ?? '';
  if (!(await verifyPassword(provided))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, goal, year, month } = await request.json();
    if (!name || !year || !month) {
      return NextResponse.json({ error: 'name, year, and month are required' }, { status: 400 });
    }
    const habit = await prisma.habit.create({
      data: { name, goal: goal ?? 30, year: parseInt(year), month: parseInt(month) },
    });
    return NextResponse.json(habit, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to add habit' }, { status: 500 });
  }
}
