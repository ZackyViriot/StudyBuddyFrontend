'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { StudyGroupCard } from './components/StudyGroupCard';
import { CreateStudyGroupForm } from './components/CreateStudyGroupForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './components/Dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/Tabs';
import { Navbar } from '@/app/(landing)/components/Navbar';
import { config } from '@/config';
import { Plus } from 'lucide-react';
import { Button } from '@/app/userProfile/components/ui/button';

interface StudyGroup {
  _id: string;
  name: string;
  description: string;
  meetingType: string;
  meetingDays: string[];
  meetingLocation: string;
  meetingTime: string;
  members: Array<{
    userId: {
      _id: string;
      firstname: string;
      lastname: string;
      email: string;
    };
    role: string;
  }>;
  createdBy: {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
  };
}

export default function StudyGroupsPage() {
  const router = useRouter();
  const [allGroups, setAllGroups] = useState<StudyGroup[]>([]);
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudyGroups = async (authToken: string) => {
    try {
      if (!authToken) {
        console.error('No auth token available');
        router.push('/');
        return;
      }

      const response = await fetch(`${config.API_URL}/api/studyGroups`, {
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
        throw new Error(`Failed to fetch study groups: ${response.status}`);
      }

      const data = await response.json();
      setAllGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching study groups:', error);
      setAllGroups([]);
      throw error;
    }
  };

  const fetchMyStudyGroups = async (authToken: string) => {
    try {
      if (!authToken) {
        console.error('No auth token available');
        router.push('/');
        return;
      }

      const response = await fetch(`${config.API_URL}/api/studyGroups/myGroups`, {
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
        throw new Error(`Failed to fetch my study groups: ${response.status}`);
      }

      const data = await response.json();
      setMyGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching my study groups:', error);
      setMyGroups([]);
      throw error;
    }
  };

  const fetchData = useCallback(async (authToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchStudyGroups(authToken),
        fetchMyStudyGroups(authToken)
      ]);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load study groups. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchStudyGroups, fetchMyStudyGroups]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      console.error('No token found in localStorage');
      router.push('/');
      return;
    }

    // Basic token validation
    try {
      const tokenParts = storedToken.split('.');
      if (tokenParts.length !== 3) {
        console.error('Invalid token format');
        localStorage.removeItem('token');
        router.push('/');
        return;
      }

      const payload = JSON.parse(atob(tokenParts[1]));
      console.log('JWT Payload:', payload);
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      
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

  const handleCreateStudyGroup = async (formData: any) => {
    try {
      if (!token) {
        setError('You must be logged in to create a study group');
        return;
      }

      const userId = localStorage.getItem('userId');
      if (!userId) {
        setError('User ID not found');
        return;
      }

      const response = await fetch(`${config.API_URL}/api/studyGroups`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          router.push('/');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create study group');
      }

      setIsCreateDialogOpen(false);
      await fetchData(token);
    } catch (error) {
      console.error('Error creating study group:', error);
      setError(error instanceof Error ? error.message : 'Failed to create study group');
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      const response = await fetch(`${config.API_URL}/api/studyGroups/${groupId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to join group');
      }

      await fetchData(token!);
    } catch (error) {
      console.error('Error joining study group:', error);
      setError(error instanceof Error ? error.message : 'Failed to join group');
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      const response = await fetch(`${config.API_URL}/api/studyGroups/${groupId}/leave`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to leave group');
      }

      await fetchData(token!);
    } catch (error) {
      console.error('Error leaving study group:', error);
      setError(error instanceof Error ? error.message : 'Failed to leave group');
    }
  };

  const isUserInGroup = (group: StudyGroup) => {
    const userId = localStorage.getItem('userId');
    return group.members.some(member => member.userId._id === userId);
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Navbar onLogin={() => {}} onSignup={() => {}} />
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 relative z-50">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Study Groups
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Join or create study groups to collaborate with fellow students
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="relative overflow-hidden group bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-600 dark:to-purple-600 text-white px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-white/20 dark:bg-black/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                <span className="flex items-center gap-2 text-lg font-semibold relative z-10">
                  <Plus className="w-6 h-6" strokeWidth={2.5} />
                  Create Study Group
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">
                  Create a New Study Group
                </DialogTitle>
              </DialogHeader>
              <CreateStudyGroupForm onSubmit={handleCreateStudyGroup} />
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg transition-colors duration-200">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-2 p-1 bg-gray-100 dark:bg-gray-700/50 rounded-t-xl">
                <TabsTrigger 
                  value="all"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 rounded-lg py-3 text-gray-600 dark:text-gray-300 transition-all duration-200"
                >
                  All Groups
                </TabsTrigger>
                <TabsTrigger 
                  value="my-groups"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 rounded-lg py-3 text-gray-600 dark:text-gray-300 transition-all duration-200"
                >
                  My Groups
                </TabsTrigger>
              </TabsList>
              <div className="p-6">
                <TabsContent value="all">
                  {allGroups.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500 dark:text-gray-400">
                        No study groups available. Be the first to create one!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {allGroups.map((group) => (
                        <StudyGroupCard
                          key={group._id}
                          group={group}
                          isMember={isUserInGroup(group)}
                          onJoin={() => handleJoinGroup(group._id)}
                          onLeave={() => handleLeaveGroup(group._id)}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="my-groups">
                  {myGroups.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500 dark:text-gray-400">
                        You haven&apos;t joined any study groups yet. Join one from the &apos;All Groups&apos; tab!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {myGroups.map((group) => (
                        <StudyGroupCard
                          key={group._id}
                          group={group}
                          isMember={true}
                          onLeave={() => handleLeaveGroup(group._id)}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
