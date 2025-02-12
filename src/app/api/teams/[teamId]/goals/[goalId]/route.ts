import { NextResponse } from 'next/server';
import { config } from '@/config';

export async function PATCH(
  request: Request,
  { params }: { params: { teamId: string; goalId: string } }
) {
  try {
    const body = await request.json();
    const response = await fetch(
      `${config.API_URL}/api/teams/${params.teamId}/goals/${params.goalId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update goal');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in goal update:', error);
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    );
  }
} 