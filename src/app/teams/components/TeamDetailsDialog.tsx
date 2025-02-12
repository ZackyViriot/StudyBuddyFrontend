import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Users, Target, CheckCircle2, Clock, Calendar, Copy, Check } from 'lucide-react';
import { Team, TeamMember, TeamGoal, TeamTask } from '@/types/team';
import { Button } from '@/components/ui/button';
import { User } from "@/types/user";

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
  const [copied, setCopied] = useState(false);

  if (!team) return null;

  const isUserInTeam = team.createdBy._id === currentUserId || 
                      team.members.some(m => m.userId._id === currentUserId);

  const isAdmin = team.createdBy._id === currentUserId || 
                 team.members.some(m => m.userId._id === currentUserId && m.role === 'admin');

  const normalizeAssignedTo = (assignedTo: User | User[] | undefined): User[] => {
    if (!assignedTo) return [];
    return Array.isArray(assignedTo) ? assignedTo : [assignedTo];
  };

  // Create a complete members list without duplicates
  const allMembers = team.members
    .filter(member => member.userId._id !== team.createdBy._id) // Remove any duplicate of creator from members
    .concat({
      userId: team.createdBy,
      role: 'admin' as const
    })
    .sort((a, b) => {
      // Sort so that admins appear first
      if (a.role === 'admin' && b.role !== 'admin') return -1;
      if (a.role !== 'admin' && b.role === 'admin') return 1;
      return 0;
    });

  const handleCopyCode = async () => {
    if (team.joinCode) {
      await navigator.clipboard.writeText(team.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl bg-white dark:bg-gray-800/90 shadow-lg border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm rounded-xl">
          <DialogHeader className="border-b border-gray-100 dark:border-gray-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg">
                <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  {team.name}
                </DialogTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">Team Details and Management</p>
              </div>
            </div>
          </DialogHeader>

          <div className="p-4 space-y-4">
            {/* Team Info & Members Section - Horizontal Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Members Section */}
              <Card className="lg:col-span-1 bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-300 rounded-lg">
                <CardHeader className="border-b border-gray-100 dark:border-gray-700/50 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800/50 dark:to-gray-800/30 p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-md">
                      <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Team Members</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {allMembers.map((member) => (
                      <div key={member.userId._id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="h-8 w-8 border-2 border-white dark:border-gray-800 shadow-sm">
                            <AvatarImage src={member.userId.profilePicture} alt={member.userId.name} />
                            <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs">
                              {member.userId.name?.substring(0, 2).toUpperCase() || '??'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                              {member.userId.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.userId.email}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={
                          member.role === 'admin' ? 
                            "text-xs bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800" : 
                            "text-xs bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                        }>
                          {member.role === 'admin' ? 'Admin' : member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Goals Section */}
              <Card className="lg:col-span-2 bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-300 rounded-lg">
                <CardHeader className="border-b border-gray-100 dark:border-gray-700/50 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800/50 dark:to-gray-800/30 p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-md">
                      <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">Team Goals</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {team.goals && team.goals.length > 0 ? (
                      team.goals.map((goal, index) => (
                        <div key={index} className="p-3 rounded-lg border border-gray-100 dark:border-gray-700/50 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800/50 dark:to-gray-800/30 shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">{goal.title}</h4>
                            <Badge variant="outline" className={goal.status === 'achieved' ? 
                              'text-xs bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800' : 
                              'text-xs bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                            }>
                              {goal.status === 'achieved' ? 'Completed' : 'In Progress'}
                            </Badge>
                          </div>
                          {goal.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{goal.description}</p>
                          )}
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="h-3 w-3 mr-1" />
                            Progress: {goal.progress}%
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-6">
                        <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/30 dark:to-gray-800/50 rounded-full w-12 h-12 mx-auto mb-3">
                          <Target className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">No goals set yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tasks Section - Only shown for team members */}
            {isUserInTeam && (
              <Card className="bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-300 rounded-lg">
                <CardHeader className="border-b border-gray-100 dark:border-gray-700/50 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800/50 dark:to-gray-800/30 p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-md">
                      <CheckCircle2 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <CardTitle className="text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-600">Team Tasks</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {team.tasks && team.tasks.length > 0 ? (
                      team.tasks.map((task) => (
                        <div key={task._id} className="p-3 rounded-lg border border-gray-100 dark:border-gray-700/50 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800/50 dark:to-gray-800/30 shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">{task.title}</h4>
                            <Badge variant="outline" className={
                              task.status === 'completed' ? 'text-xs bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800' :
                              task.status === 'in_progress' ? 'text-xs bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' :
                              'text-xs bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                            }>
                              {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center text-gray-500 dark:text-gray-400">
                              <Clock className="h-3 w-3 mr-1" />
                              {format(new Date(task.dueDate), 'MMM d')}
                            </div>
                            {task.assignedTo && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 dark:text-gray-400">Assigned to:</span>
                                <div className="flex flex-wrap items-center gap-1">
                                  {normalizeAssignedTo(task.assignedTo).map((user, idx) => (
                                    <span key={user._id} className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                      {user.name || `${user.firstname} ${user.lastname}`}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-6">
                        <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/30 dark:to-gray-800/50 rounded-full w-12 h-12 mx-auto mb-3">
                          <CheckCircle2 className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">No tasks assigned yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Join Code (Only visible to admins) */}
            {isAdmin && (
              <Card className="bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-300 rounded-lg">
                <CardHeader className="border-b border-gray-100 dark:border-gray-700/50 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800/50 dark:to-gray-800/30 p-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-md">
                      <Copy className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <CardTitle className="text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">Team Join Code</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <code className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 font-mono text-lg tracking-wider">
                      {team.joinCode}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyCode}
                      className="h-10 w-10"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Share this code with others to let them join your team
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}; 