import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Users, Target, CheckCircle2, Clock } from 'lucide-react';
import { Team, User } from '@/types/team';
import { UserProfileDialog } from '@/components/UserProfileDialog';
import { Button } from '@/components/ui/button';

interface TeamMember {
  userId: {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
    profilePicture: string;
  };
  role: string;
}

interface TeamGoal {
  title: string;
  description?: string;
  targetDate: Date;
  status: 'active' | 'achieved';
}

interface TeamTask {
  _id: string;
  title: string;
  status: string;
  dueDate: string;
  assignedTo: {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
    profilePicture: string;
  };
}

interface TeamDetailsDialogProps {
  team: Team | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

export const TeamDetailsDialog: React.FC<TeamDetailsDialogProps> = ({
  team,
  isOpen,
  onClose,
  currentUserId,
}) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);

  if (!team) return null;

  const isUserInTeam = team.createdBy._id === currentUserId || 
                      team.members.some(m => m.userId._id === currentUserId);

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setIsUserProfileOpen(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl bg-white dark:bg-gray-800/95 dark:backdrop-blur-xl border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
              {team.name}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Team Info & Members Section */}
            <Card className="col-span-1 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <CardTitle className="text-lg">Team Members</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...team.members].map((member) => (
                    <div key={member.userId._id} className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        className="flex items-center space-x-3 hover:bg-gray-100 dark:hover:bg-gray-700/50 p-2 rounded-lg"
                        onClick={() => handleUserClick(member.userId)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.userId.profilePicture} alt={`${member.userId.firstname || ''} ${member.userId.lastname || ''}`} />
                          <AvatarFallback>
                            {(member.userId.firstname?.[0] || '') + (member.userId.lastname?.[0] || '')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <p className="text-sm font-medium">
                            {member.userId.firstname || ''} {member.userId.lastname || ''}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{member.userId.email}</p>
                        </div>
                      </Button>
                      <Badge variant="outline" className={
                        member.role === 'admin' ? 
                          "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" : 
                          "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      }>
                        {member.role === 'admin' ? 'Admin' : member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Goals Section */}
            <Card className="col-span-1 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <CardTitle className="text-lg">Team Goals</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {team.goals && team.goals.length > 0 ? (
                    team.goals.map((goal, index) => (
                      <div key={index} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{goal.title}</h4>
                          <Badge variant="outline" className={goal.status === 'achieved' ? 
                            'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 
                            'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          }>
                            {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                          </Badge>
                        </div>
                        {goal.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{goal.description}</p>
                        )}
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="h-3 w-3 mr-1" />
                          Target: {format(new Date(goal.targetDate), 'PPP')}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400">No goals set</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tasks Section - Only shown for team members */}
            {isUserInTeam && (
              <Card className="col-span-1 md:col-span-2 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <CardTitle className="text-lg">Team Tasks</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {team.tasks && team.tasks.length > 0 ? (
                      team.tasks.map((task) => (
                        <div key={task._id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{task.title}</h4>
                            <Badge variant="outline" className={
                              task.status === 'completed' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                              task.status === 'in-progress' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' :
                              'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                            }>
                              {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center text-gray-500 dark:text-gray-400">
                              <Clock className="h-3 w-3 mr-1" />
                              Due: {format(new Date(task.dueDate), 'PPP')}
                            </div>
                            {task.assignedTo && (
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-500 dark:text-gray-400">Assigned to:</span>
                                <Avatar className="h-6 w-6 cursor-pointer" onClick={() => handleUserClick(task.assignedTo!)}>
                                  <AvatarImage src={task.assignedTo.profilePicture} alt={`${task.assignedTo.firstname || ''} ${task.assignedTo.lastname || ''}`} />
                                  <AvatarFallback>
                                    {(task.assignedTo.firstname?.[0] || '') + (task.assignedTo.lastname?.[0] || '')}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 dark:text-gray-400">No tasks assigned</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <UserProfileDialog
        user={selectedUser}
        isOpen={isUserProfileOpen}
        onClose={() => {
          setIsUserProfileOpen(false);
          setSelectedUser(null);
        }}
      />
    </>
  );
}; 