import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Users, CheckCircle2 } from 'lucide-react';

interface TeamMember {
  userId?: {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
    profilePicture: string;
  };
  _id?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  profilePicture?: string;
  role: string;
}

interface TeamCardProps {
  team: {
    _id: string;
    name: string;
    members: TeamMember[];
    tasks: Array<{ _id: string; title: string; status: string; dueDate: string }>;
    createdBy: {
      _id: string;
      firstname: string;
      lastname: string;
      email: string;
      profilePicture: string;
    };
  };
  isUserMember: boolean;
  isAdmin: boolean;
  onJoin: (teamId: string) => void;
  onLeave: (teamId: string) => void;
  onDelete: (teamId: string) => void;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  isUserMember,
  isAdmin,
  onJoin,
  onLeave,
  onDelete,
}) => {
  const activeTasks = team.tasks.filter(task => task.status === 'in_progress' || task.status === 'pending').length;
  const totalMembers = team.members.length;

  return (
    <Card className="w-full hover:shadow-md transition-shadow duration-200 bg-white dark:bg-gray-800/90 border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
              {team.name}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Created by{' '}
                <span className="font-medium text-indigo-600 dark:text-indigo-400">
                  {team.createdBy?.firstname} {team.createdBy?.lastname}
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-900/20">
                  <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Members:</span>
                <Badge variant="secondary" className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                  {totalMembers}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <div className="p-1 rounded-md bg-purple-50 dark:bg-purple-900/20">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Tasks:</span>
                <Badge variant="secondary" className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                  {activeTasks}
                </Badge>
              </div>
            </div>
            {totalMembers > 0 && (
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Team Members:</span>
                <div className="flex -space-x-2">
                  {team.members.slice(0, 3).map((member) => (
                    <Avatar 
                      key={member.userId?._id || member._id} 
                      className="w-8 h-8 border-2 border-white dark:border-gray-800 ring-2 ring-gray-100 dark:ring-gray-700"
                    >
                      <AvatarImage 
                        src={member.userId?.profilePicture || member.profilePicture} 
                        alt={member.userId ? `${member.userId.firstname} ${member.userId.lastname}` : 'Member'} 
                      />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 text-indigo-600 dark:text-indigo-400">
                        {member.userId && member.userId.firstname && member.userId.lastname ? (
                          `${member.userId.firstname[0]}${member.userId.lastname[0]}`
                        ) : member.firstname && member.lastname ? (
                          `${member.firstname[0]}${member.lastname[0]}`
                        ) : (
                          'M'
                        )}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {totalMembers > 3 && (
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 ring-2 ring-gray-100 dark:ring-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">
                      +{totalMembers - 3}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end pt-2 space-x-2">
            {isAdmin ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(team._id)}
                className="bg-red-600 hover:bg-red-700 text-white font-medium"
              >
                Delete Team
              </Button>
            ) : isUserMember ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onLeave(team._id)}
                className="bg-red-500 hover:bg-red-600 text-white font-medium"
              >
                Leave Team
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => onJoin(team._id)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium"
              >
                Join Team
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 