'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Team } from '@/types/team';
import { config } from '@/config';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Target, CheckCircle2, Clock, Settings, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { User } from '@/types/user';

interface TeamPageClientProps {
  teamId: string;
}

export function TeamPageClient({ teamId }: TeamPageClientProps) {
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/');
          return;
        }

        const response = await fetch(`${config.API_URL}/api/teams/${teamId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch team details');
        }

        const data = await response.json();
        setTeam(data);
      } catch (error) {
        console.error('Error fetching team:', error);
        setError(error instanceof Error ? error.message : 'Failed to load team');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeam();
  }, [teamId, router]);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const normalizeAssignedTo = (assignedTo: User | User[] | undefined): User[] => {
    if (!assignedTo) return [];
    return Array.isArray(assignedTo) ? assignedTo : [assignedTo];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-indigo-600/20 border-t-indigo-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-full mx-auto">
            <Users className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Failed to load team</h2>
          <p className="text-gray-500 dark:text-gray-400">{error || 'Team not found'}</p>
          <Button onClick={() => router.push('/teams')} className="mt-4">
            Return to Teams
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          className="space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Team Header */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-gray-800/90 shadow-lg rounded-xl border border-gray-100 dark:border-gray-700/50 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl">
                  <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                    {team.name}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Team Dashboard</p>
                </div>
              </div>
              <Button variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Members Section */}
            <motion.div variants={itemVariants}>
              <Card className="bg-white dark:bg-gray-800/90 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border border-gray-100 dark:border-gray-700/50">
                <CardHeader className="border-b border-gray-100 dark:border-gray-700/50 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800/50 dark:to-gray-800/30 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Team Members</CardTitle>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{team.members.filter(member => member.userId._id !== team.createdBy._id).length} members</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Member
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {team.members
                      .filter(member => member.userId._id !== team.createdBy._id)
                      .map((member) => (
                      <div key={member.userId._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-white dark:border-gray-800 shadow-sm">
                            <AvatarImage src={member.userId.profilePicture} alt={member.userId.name} />
                            <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                              {member.userId.name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {member.userId.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{member.userId.email}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={
                          member.role === 'admin' ? 
                            "bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800" : 
                            "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                        }>
                          {member.role === 'admin' ? 'Admin' : member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Goals Section */}
            <motion.div variants={itemVariants}>
              <Card className="bg-white dark:bg-gray-800/90 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border border-gray-100 dark:border-gray-700/50">
                <CardHeader className="border-b border-gray-100 dark:border-gray-700/50 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800/50 dark:to-gray-800/30 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                        <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">Team Goals</CardTitle>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{team.goals?.length || 0} active goals</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Goal
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {team.goals && team.goals.length > 0 ? (
                      team.goals.map((goal, index) => (
                        <div key={index} className="p-4 rounded-lg border border-gray-100 dark:border-gray-700/50 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800/50 dark:to-gray-800/30 shadow-sm hover:shadow-md transition-all duration-200">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">{goal.title}</h4>
                            <Badge variant="outline" className={goal.status === 'achieved' ? 
                              'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800' : 
                              'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                            }>
                              {goal.status === 'achieved' ? 'Completed' : 'In Progress'}
                            </Badge>
                          </div>
                          {goal.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{goal.description}</p>
                          )}
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="h-3 w-3 mr-1" />
                            Progress: {goal.progress}%
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/30 dark:to-gray-800/50 rounded-full w-16 h-16 mx-auto mb-4">
                          <Target className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">No goals set yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tasks Section */}
            <motion.div variants={itemVariants} className="md:col-span-2">
              <Card className="bg-white dark:bg-gray-800/90 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border border-gray-100 dark:border-gray-700/50">
                <CardHeader className="border-b border-gray-100 dark:border-gray-700/50 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800/50 dark:to-gray-800/30 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-600">Team Tasks</CardTitle>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{team.tasks.length} tasks</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Task
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {team.tasks.length > 0 ? (
                      team.tasks.map((task) => {
                        const assignedUsers = normalizeAssignedTo(task.assignedTo);
                        return (
                          <div key={task._id} className="p-4 rounded-lg border border-gray-100 dark:border-gray-700/50 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800/50 dark:to-gray-800/30 shadow-sm hover:shadow-md transition-all duration-200">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">{task.title}</h4>
                              <Badge variant="outline" className={
                                task.status === 'completed' ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800' :
                                task.status === 'in_progress' ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' :
                                'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                              }>
                                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center text-gray-500 dark:text-gray-400">
                                <Clock className="h-3 w-3 mr-1" />
                                Due: {format(new Date(task.dueDate), 'PPP')}
                              </div>
                              {assignedUsers.length > 0 && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-gray-500 dark:text-gray-400">Assigned to:</span>
                                  <Avatar className="h-6 w-6 border-2 border-white dark:border-gray-800 shadow-sm">
                                    <AvatarImage src={assignedUsers[0].profilePicture} alt={assignedUsers[0].name} />
                                    <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs">
                                      {assignedUsers[0].name?.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/30 dark:to-gray-800/50 rounded-full w-16 h-16 mx-auto mb-4">
                          <CheckCircle2 className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">No tasks created yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </main>
  );
} 