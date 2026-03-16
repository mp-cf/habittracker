import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import { verifyPassword } from '@/lib/auth';

const filePath = path.join(process.cwd(), 'data', 'months.json');

export async function GET(request: NextRequest) {
  try {
    const provided = request.headers.get('x-track-password') ?? '';
    if (!(await verifyPassword(provided))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const habit_id = searchParams.get('habit_id');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    const data = await fs.readFile(filePath, 'utf8');
    let months = JSON.parse(data);

    if (habit_id) months = months.filter((m: any) => m.habit_id === habit_id);
    if (year) months = months.filter((m: any) => m.year === parseInt(year));
    if (month) months = months.filter((m: any) => m.month === parseInt(month));

    return NextResponse.json(months);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch months' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const provided = request.headers.get('x-track-password') ?? '';
    if (!(await verifyPassword(provided))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { habit_id, year, month } = await request.json();
    if (!habit_id || !year || !month) {
      return NextResponse.json({ error: 'habit_id, year, and month are required' }, { status: 400 });
    }
    const data = await fs.readFile(filePath, 'utf8');
    const months = JSON.parse(data);
    const newMonth = {
      id: uuidv4(),
      habit_id,
      year: parseInt(year),
      month: parseInt(month),
    };
    months.push(newMonth);
    await fs.writeFile(filePath, JSON.stringify(months, null, 2));
    return NextResponse.json(newMonth, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add month' }, { status: 500 });
  }
}