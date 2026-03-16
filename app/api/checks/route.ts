import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import { verifyPassword } from '@/lib/auth';

const filePath = path.join(process.cwd(), 'data', 'checks.json');

export async function GET(request: NextRequest) {
  try {
    const provided = request.headers.get('x-track-password') ?? '';
    if (!(await verifyPassword(provided))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month_id = searchParams.get('month_id');

    const data = await fs.readFile(filePath, 'utf8');
    let checks = JSON.parse(data);

    if (month_id) checks = checks.filter((c: any) => c.month_id === month_id);

    return NextResponse.json(checks);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch checks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const provided = request.headers.get('x-track-password') ?? '';
    if (!(await verifyPassword(provided))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { month_id, day, completed } = await request.json();
    if (!month_id || day === undefined || completed === undefined) {
      return NextResponse.json({ error: 'month_id, day, and completed are required' }, { status: 400 });
    }
    const data = await fs.readFile(filePath, 'utf8');
    const checks = JSON.parse(data);
    const newCheck = {
      id: uuidv4(),
      month_id,
      day: parseInt(day),
      completed: Boolean(completed),
      updated_at: new Date().toISOString(),
    };
    checks.push(newCheck);
    await fs.writeFile(filePath, JSON.stringify(checks, null, 2));
    return NextResponse.json(newCheck, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add check' }, { status: 500 });
  }
}