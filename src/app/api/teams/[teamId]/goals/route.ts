import { NextResponse } from 'next/server';
import { config } from '@/config';

export async function POST(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const body = await request.json();
    const response = await fetch(`${config.API_URL}/api/teams/${params.teamId}/goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('Failed to create goal');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in goal creation:', error);
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
} 