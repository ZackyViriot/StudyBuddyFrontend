import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { db } = await connectToDatabase();
    const teamId = params.teamId;

    // Validate teamId format
    if (!ObjectId.isValid(teamId)) {
      return new NextResponse('Invalid team ID', { status: 400 });
    }

    // Find the team and populate necessary fields
    const team = await db.collection('teams').aggregate([
      { $match: { _id: new ObjectId(teamId) } },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdByUser'
        }
      },
      { $unwind: '$createdByUser' },
      {
        $lookup: {
          from: 'users',
          localField: 'members.userId',
          foreignField: '_id',
          as: 'memberUsers'
        }
      },
      {
        $addFields: {
          members: {
            $map: {
              input: '$members',
              as: 'member',
              in: {
                userId: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$memberUsers',
                        as: 'user',
                        cond: { $eq: ['$$user._id', '$$member.userId'] }
                      }
                    },
                    0
                  ]
                },
                role: '$$member.role'
              }
            }
          },
          createdBy: '$createdByUser'
        }
      },
      {
        $project: {
          createdByUser: 0,
          memberUsers: 0,
          'createdBy.password': 0,
          'members.userId.password': 0
        }
      }
    ]).toArray();

    if (!team || team.length === 0) {
      return new NextResponse('Team not found', { status: 404 });
    }

    // Check if user has access to the team
    const userIsCreator = team[0].createdBy._id.toString() === session.user.id;
    const userIsMember = team[0].members.some(
      (member: any) => member.userId._id.toString() === session.user.id
    );

    if (!userIsCreator && !userIsMember) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    return NextResponse.json(team[0]);
  } catch (error) {
    console.error('Error fetching team:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 