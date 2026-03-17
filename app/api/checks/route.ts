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
    const month_id = searchParams.get('month_id');

    const checks = await prisma.check.findMany({
      where: month_id ? { month_id } : {},
    });
    return NextResponse.json(checks);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch checks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const provided = request.headers.get('x-track-password') ?? '';
  if (!(await verifyPassword(provided))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { month_id, day, completed } = await request.json();
    if (!month_id || day === undefined || completed === undefined) {
      return NextResponse.json({ error: 'month_id, day, and completed are required' }, { status: 400 });
    }
    const check = await prisma.check.create({
      data: { month_id, day: parseInt(day), completed: Boolean(completed) },
    });
    return NextResponse.json(check, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to add check' }, { status: 500 });
  }
}
