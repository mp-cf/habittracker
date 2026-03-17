import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const provided = request.headers.get('x-track-password') ?? '';
  if (!(await verifyPassword(provided))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    // Cascade deletes months and checks via schema relations
    await prisma.habit.delete({ where: { id } });
    return NextResponse.json({ message: 'Habit deleted' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 });
  }
}
