import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const provided = request.headers.get('x-track-password') ?? '';
  if (!(await verifyPassword(provided))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { completed } = await request.json();
    if (completed === undefined) {
      return NextResponse.json({ error: 'completed is required' }, { status: 400 });
    }
    const check = await prisma.check.update({
      where: { id },
      data: { completed: Boolean(completed) },
    });
    return NextResponse.json(check);
  } catch {
    return NextResponse.json({ error: 'Failed to update check' }, { status: 500 });
  }
}
