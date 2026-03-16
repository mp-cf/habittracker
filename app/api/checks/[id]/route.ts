import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

import { verifyPassword } from '@/lib/auth';

const filePath = path.join(process.cwd(), 'data', 'checks.json');

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const provided = request.headers.get('x-track-password') ?? '';
    if (!(await verifyPassword(provided))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { completed } = await request.json();
    if (completed === undefined) {
      return NextResponse.json({ error: 'completed is required' }, { status: 400 });
    }

    const data = await fs.readFile(filePath, 'utf8');
    let checks = JSON.parse(data);
    const checkIndex = checks.findIndex((c: any) => c.id === id);
    if (checkIndex === -1) {
      return NextResponse.json({ error: 'Check not found' }, { status: 404 });
    }
    checks[checkIndex].completed = Boolean(completed);
    checks[checkIndex].updated_at = new Date().toISOString();
    await fs.writeFile(filePath, JSON.stringify(checks, null, 2));
    return NextResponse.json(checks[checkIndex]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update check' }, { status: 500 });
  }
}