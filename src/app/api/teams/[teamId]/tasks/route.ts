import { NextResponse } from 'next/server';
import { config } from '@/config';

export async function POST(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const body = await request.json();
    const response = await fetch(`${config.API_URL}/api/teams/${params.teamId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('Failed to create task');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in task creation:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
} 