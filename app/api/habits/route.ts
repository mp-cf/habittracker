import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const filePath = path.join(process.cwd(), 'data', 'habits.json');

import { verifyPassword } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const provided = request.headers.get('x-track-password') ?? '';
    if (!(await verifyPassword(provided))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await fs.readFile(filePath, 'utf8');
    const habits = JSON.parse(data);
    return NextResponse.json(habits);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const provided = request.headers.get('x-track-password') ?? '';
    if (!(await verifyPassword(provided))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const data = await fs.readFile(filePath, 'utf8');
    const habits = JSON.parse(data);
    const newHabit = {
      id: uuidv4(),
      name,
      created_at: new Date().toISOString(),
    };
    habits.push(newHabit);
    await fs.writeFile(filePath, JSON.stringify(habits, null, 2));
    return NextResponse.json(newHabit, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add habit' }, { status: 500 });
  }
}