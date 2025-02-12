import { NextResponse } from 'next/server';
import { config } from '@/config';

export async function GET(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    // Get token from request headers
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const response = await fetch(`${config.API_URL}/api/teams/${params.teamId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      return new NextResponse(response.statusText, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching team:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 