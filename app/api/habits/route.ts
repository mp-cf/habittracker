import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const provided = request.headers.get('x-track-password') ?? '';
  if (!(await verifyPassword(provided))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const habits = await prisma.habit.findMany({ orderBy: { created_at: 'asc' } });
    return NextResponse.json(habits);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const provided = request.headers.get('x-track-password') ?? '';
  if (!(await verifyPassword(provided))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const habit = await prisma.habit.create({ data: { name } });
    return NextResponse.json(habit, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to add habit' }, { status: 500 });
  }
}
