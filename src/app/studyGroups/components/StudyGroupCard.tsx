'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardFooter } from './Card';
import { Button } from '@/app/userProfile/components/ui/button';
import { Users, MapPin, Calendar, Clock, FileText } from 'lucide-react';

interface StudyGroupCardProps {
  group: {
    _id: string;
    name: string;
    description: string;
    meetingType: string;
    meetingDays: string[];
    meetingLocation: string;
    meetingTime: string;
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
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
      <CardHeader className="space-y-2 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{group.name}</h3>
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Users className="w-4 h-4" />
            <span className="text-sm">{group.members.length}</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Created by {group.createdBy.firstname} {group.createdBy.lastname}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
          <FileText className="w-4 h-4 mt-1 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
          <p className="text-sm">{group.description}</p>
        </div>

        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <div>
            <span className="text-sm font-medium">{group.meetingType}</span>
            <span className="mx-2 text-gray-400">•</span>
            <span className="text-sm">{group.meetingLocation}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <div className="text-sm">
            {group.meetingDays.join(', ')}
          </div>
        </div>

        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <div className="text-sm">
            {group.meetingTime}
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700 p-4">
        {isMember ? (
          <Button
            onClick={onLeave}
            variant="destructive"
            className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white"
          >
            Leave Group
          </Button>
        ) : (
          <Button
            onClick={onJoin}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
          >
            Join Group
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 