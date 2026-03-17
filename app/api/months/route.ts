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
    const habit_id = searchParams.get('habit_id');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    const months = await prisma.month.findMany({
      where: {
        ...(habit_id ? { habit_id } : {}),
        ...(year ? { year: parseInt(year) } : {}),
        ...(month ? { month: parseInt(month) } : {}),
      },
    });
    return NextResponse.json(months);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch months' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const provided = request.headers.get('x-track-password') ?? '';
  if (!(await verifyPassword(provided))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { habit_id, year, month } = await request.json();
    if (!habit_id || !year || !month) {
      return NextResponse.json({ error: 'habit_id, year, and month are required' }, { status: 400 });
    }
    const newMonth = await prisma.month.create({
      data: { habit_id, year: parseInt(year), month: parseInt(month) },
    });
    return NextResponse.json(newMonth, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to add month' }, { status: 500 });
  }
}
