'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CreateTeamDialog } from './components/CreateTeamDialog';
import { DailyTasks } from './components/DailyTasks';
import { config } from '@/config';
import { Navbar } from '@/app/(landing)/components/Navbar';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Users, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TeamTable } from './components/TeamTable';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import { Team } from '@/types/team';
import { JoinTeamDialog } from './components/JoinTeamDialog';

interface Task {
  _id: string;
  title: string;
  status: string;
  dueDate: string;
}

export function TeamsPageClient() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);

  const fetchTeams = useCallback(async (authToken: string) => {
    try {
      if (!authToken) {
        console.error('No auth token available');
        router.push('/');
        return;
      }

      const response = await fetch(`${config.API_URL}/api/teams`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.error('Authentication failed - redirecting to login');
          localStorage.removeItem('token');
          router.push('/');
          return;
        }
        throw new Error(`Failed to fetch teams: ${response.status}`);
      }

      const data = await response.json();
      setTeams(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setTeams([]);
      throw error;
    }
  }, [router]);

  const fetchUserTeams = useCallback(async (authToken: string) => {
    try {
      if (!authToken) {
        console.error('No auth token available');
        router.push('/');
        return;
      }

      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID not found');
      }

      const response = await fetch(`${config.API_URL}/api/teams/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.error('Authentication failed - redirecting to login');
          localStorage.removeItem('token');
          router.push('/');
          return;
        }
        throw new Error(`Failed to fetch user teams: ${response.status}`);
      }

      const data = await response.json();
      setUserTeams(Array.isArray(data) ? data : []);
      const tasks = data.flatMap((team: Team) => team.tasks);
      setAllTasks(tasks);
    } catch (error) {
      console.error('Error fetching user teams:', error);
      setUserTeams([]);
      throw error;
    }
  }, [router]);

  const fetchData = useCallback(async (authToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchTeams(authToken),
        fetchUserTeams(authToken)
      ]);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load teams. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchTeams, fetchUserTeams]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      console.error('No token found in localStorage');
      router.push('/');
      return;
    }

    try {
      const tokenParts = storedToken.split('.');
      if (tokenParts.length !== 3) {
        console.error('Invalid token format');
        localStorage.removeItem('token');
        router.push('/');
        return;
      }

      const payload = JSON.parse(atob(tokenParts[1]));
      const expirationTime = payload.exp * 1000;
      
      if (Date.now() >= expirationTime) {
        console.error('Token has expired');
        localStorage.removeItem('token');
        router.push('/');
        return;
      }

      setToken(storedToken);
      localStorage.setItem('userId', payload.sub);
      fetchData(storedToken);
    } catch (error) {
      console.error('Error validating token:', error);
      localStorage.removeItem('token');
      router.push('/');
    }
  }, [router, fetchData]);

  const handleCreateTeam = async (newTeam: Team) => {
    try {
      // Update the teams state with the new team
      setTeams(prevTeams => [...prevTeams, newTeam]);
      
      // If the current user is a member of the team, update userTeams as well
      const userId = localStorage.getItem('userId');
      if (userId && (newTeam.createdBy._id === userId || newTeam.members.some(m => m.userId._id === userId))) {
        setUserTeams(prevTeams => [...prevTeams, newTeam]);
      }
      
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error handling team creation:', error);
      setError(error instanceof Error ? error.message : 'Failed to handle team creation');
    }
  };

  const handleJoinTeam = async (teamId: string) => {
    // Open the join dialog when the join button is clicked
    setIsJoinDialogOpen(true);
  };

  const handleJoinWithCode = async (code: string) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      if (!token || !userId) {
        throw new Error('No authentication token or user ID available');
      }

      const response = await fetch(`${config.API_URL}/api/teams/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          joinCode: code,
          userId: userId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid join code');
      }

      // Refresh teams after joining
      await fetchTeams(token);
      await fetchUserTeams(token);
      setIsJoinDialogOpen(false); // Close the dialog after successful join
    } catch (error) {
      console.error('Error joining team:', error);
      throw error;
    }
  };

  const handleLeaveTeam = async (teamId: string) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      if (!token || !userId) {
        console.error('No auth token or user ID available');
        return;
      }

      const team = teams.find(t => t._id === teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      // If user is admin, delete the team instead of leaving
      if (team.createdBy._id === userId) {
        await handleDeleteTeam(teamId);
        return;
      }

      const response = await fetch(`${config.API_URL}/api/teams/${teamId}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Cannot remove member from team');
      }

      // Refresh teams after leaving
      await fetchTeams(token);
      await fetchUserTeams(token);
    } catch (error) {
      console.error('Error leaving team:', error);
      setError(error instanceof Error ? error.message : 'Failed to leave team');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      if (!token || !userId) {
        console.error('No auth token available');
        return;
      }

      const team = teams.find(t => t._id === teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      // Check if user is admin or creator
      const isAdmin = team.createdBy._id === userId || 
                     team.members.some(m => m.userId?._id === userId && m.role === 'admin');
      
      if (!isAdmin) {
        throw new Error('You do not have permission to delete this team');
      }

      const response = await fetch(`${config.API_URL}/api/teams/${teamId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Cannot delete team');
      }

      // Refresh teams after deletion
      await fetchTeams(token);
      await fetchUserTeams(token);
    } catch (error) {
      console.error('Error deleting team:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete team');
    }
  };

  const handleTaskComplete = async (taskId: string) => {
    try {
      const response = await fetch(`${config.API_URL}/api/teams/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to complete task');
      }

      await fetchData(token!);
    } catch (error) {
      console.error('Error completing task:', error);
      setError(error instanceof Error ? error.message : 'Failed to complete task');
    }
  };

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !userTeams.some(userTeam => userTeam._id === team._id)
  );

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

  return (
    <>
      <Navbar onLogin={() => {}} onSignup={() => {}} />
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <motion.div 
            className="flex flex-col space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Header Section */}
            <motion.div 
              className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center bg-white dark:bg-gray-800/90 p-6 rounded-xl shadow-sm"
              variants={itemVariants}
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Teams</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Collaborate and achieve goals together</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsJoinDialogOpen(true)}
                  className="border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                >
                  Join with Code
                </Button>
                <Button
                  variant="default"
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                >
                  Create New Team
                </Button>
              </div>
            </motion.div>

            {error && (
              <motion.div 
                className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-4 rounded-lg text-red-600 dark:text-red-400"
                variants={itemVariants}
              >
                {error}
              </motion.div>
            )}

            <motion.div 
              className="grid grid-cols-1 gap-8"
              variants={containerVariants}
            >
              {/* Your Teams Section */}
              <motion.div variants={itemVariants}>
                <Card className="bg-white dark:bg-gray-800/90 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm">
                  <CardHeader className="border-b border-gray-100 dark:border-gray-700/50 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800/50 dark:to-gray-800/30 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg">
                          <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Your Teams</h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your team memberships</p>
                        </div>
                        <Badge variant="outline" className="ml-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800">
                          {userTeams.length}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full border-2 border-indigo-600/20 border-t-indigo-600 animate-spin" />
                        </div>
                      </div>
                    ) : userTeams.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-full w-20 h-20 mx-auto mb-6">
                          <Users className="h-12 w-12 text-indigo-600/60 dark:text-indigo-400/60" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No teams joined yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">Create your first team to get started</p>
                        <Button 
                          variant="default" 
                          onClick={() => setIsCreateDialogOpen(true)}
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-medium px-8"
                        >
                          Create your first team
                        </Button>
                      </div>
                    ) : (
                      <TeamTable
                        teams={userTeams}
                        currentUserId={localStorage.getItem('userId') || ''}
                        onLeave={handleLeaveTeam}
                        onDelete={handleDeleteTeam}
                        showJoinButton={false}
                      />
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Daily Tasks Section */}
              <motion.div variants={itemVariants}>
                <Card className="bg-white dark:bg-gray-800/90 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm">
                  <CardHeader className="border-b border-gray-100 dark:border-gray-700/50 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800/50 dark:to-gray-800/30 p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                        <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">Daily Tasks</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Track your daily progress</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full border-2 border-green-600/20 border-t-green-600 animate-spin" />
                        </div>
                      </div>
                    ) : allTasks.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-full w-20 h-20 mx-auto mb-6">
                          <CheckCircle2 className="h-12 w-12 text-green-600/60 dark:text-green-400/60" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">All caught up!</h3>
                        <p className="text-gray-500 dark:text-gray-400">No tasks available for today</p>
                      </div>
                    ) : (
                      <DailyTasks tasks={allTasks} onTaskComplete={handleTaskComplete} />
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Available Teams Section */}
              <motion.div variants={itemVariants}>
                <Card className="bg-white dark:bg-gray-800/90 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm">
                  <CardHeader className="border-b border-gray-100 dark:border-gray-700/50 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800/50 dark:to-gray-800/30 p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                        <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">Available Teams</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Discover and join teams</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full border-2 border-purple-600/20 border-t-purple-600 animate-spin" />
                        </div>
                      </div>
                    ) : filteredTeams.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-full w-20 h-20 mx-auto mb-6">
                          <Users className="h-12 w-12 text-purple-600/60 dark:text-purple-400/60" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No teams available</h3>
                        <p className="text-gray-500 dark:text-gray-400">Try creating your own team!</p>
                      </div>
                    ) : (
                      <TeamTable
                        teams={filteredTeams}
                        currentUserId={localStorage.getItem('userId') || ''}
                        onLeave={handleLeaveTeam}
                        onDelete={handleDeleteTeam}
                        onJoin={handleJoinTeam}
                        showJoinButton={true}
                      />
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      <CreateTeamDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateTeam={handleCreateTeam}
      />

      <JoinTeamDialog
        isOpen={isJoinDialogOpen}
        onClose={() => setIsJoinDialogOpen(false)}
        onJoinWithCode={handleJoinWithCode}
      />
    </>
  );
} 