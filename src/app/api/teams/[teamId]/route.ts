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

    // Make sure we're using the correct backend URL
    const backendUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:8000' 
      : 'https://studybuddybackend-production.up.railway.app';

    const response = await fetch(`${backendUrl}/api/teams/${params.teamId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      return new NextResponse(errorText, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching team:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 