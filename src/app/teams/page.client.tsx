'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TeamCard } from './components/TeamCard';
import { CreateTeamDialog } from './components/CreateTeamDialog';
import { DailyTasks } from './components/DailyTasks';
import { config } from '@/config';
import { Navbar } from '@/app/(landing)/components/Navbar';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Plus, Users, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TeamTable } from './components/TeamTable';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';

interface Team {
  _id: string;
  name: string;
  members: Array<{ 
    userId: {
      _id: string;
      firstname: string;
      lastname: string;
      email: string;
      profilePicture: string;
    };
    role: string; 
  }>;
  tasks: Array<{ _id: string; title: string; status: string; dueDate: string }>;
  createdBy: {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
    profilePicture: string;
  };
}

export function TeamsPageClient() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
    try {
      const userId = localStorage.getItem('userId');
      if (!userId || !token) {
        console.error('No auth token or user ID available');
        return;
      }

      const response = await fetch(`${config.API_URL}/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          role: 'member'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to join team');
      }

      await fetchData(token);
    } catch (error) {
      console.error('Error joining team:', error);
      setError(error instanceof Error ? error.message : 'Failed to join team');
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
              <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search teams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full md:w-64 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                  />
                </div>
                <CreateTeamDialog onCreateTeam={handleCreateTeam} />
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
                <Card className="bg-white dark:bg-gray-800/90 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="border-b dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold">Your Teams</h2>
                        <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                          {userTeams.length}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
                      </div>
                    ) : userTeams.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No teams joined yet</p>
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => setIsCreateDialogOpen(true)}
                          className="mt-4 bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-600 dark:hover:bg-purple-700 dark:text-white transition-colors duration-200"
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
                <Card className="bg-white dark:bg-gray-800/90 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="border-b dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800/30">
                    <h2 className="text-xl font-semibold">Daily Tasks</h2>
                  </CardHeader>
                  <CardContent className="p-6">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
                      </div>
                    ) : allTasks.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No tasks available</p>
                      </div>
                    ) : (
                      <DailyTasks tasks={allTasks} onTaskComplete={handleTaskComplete} />
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Available Teams Section */}
              <motion.div variants={itemVariants}>
                <Card className="bg-white dark:bg-gray-800/90 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="border-b dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800/30">
                    <h2 className="text-xl font-semibold">Available Teams</h2>
                  </CardHeader>
                  <CardContent className="p-6">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
                      </div>
                    ) : filteredTeams.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No available teams found</p>
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
    </>
  );
} 