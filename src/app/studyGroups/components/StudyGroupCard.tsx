import React from 'react';
import { Card, CardContent, CardHeader, CardFooter } from './Card';
import { Button } from './Button';

interface StudyGroupCardProps {
  group: {
    _id: string;
    name: string;
    meetingType: string;
    meetingDays: string[];
    meetingLocation: string;
    members: any[];
    createdBy: {
      firstname: string;
      lastname: string;
    };
  };
  onJoin?: () => void;
  onLeave?: () => void;
  isMember?: boolean;
}

export function StudyGroupCard({ group, onJoin, onLeave, isMember }: StudyGroupCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{group.name}</h3>
          <p className="text-sm text-gray-500">
            Created by {group.createdBy.firstname} {group.createdBy.lastname}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm">{group.members.length} members</span>
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p><span className="font-medium">Meeting Type:</span> {group.meetingType}</p>
          <p><span className="font-medium">Location:</span> {group.meetingLocation}</p>
          <p><span className="font-medium">Days:</span> {group.meetingDays.join(', ')}</p>
        </div>
      </CardContent>
      <CardFooter>
        {isMember ? (
          <Button variant="destructive" onClick={onLeave} className="w-full">
            Leave Group
          </Button>
        ) : (
          <Button onClick={onJoin} className="w-full">
            Join Group
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 