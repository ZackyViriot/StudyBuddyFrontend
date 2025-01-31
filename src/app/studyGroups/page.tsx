'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { StudyGroupTable } from './components/StudyGroupTable';
import { CreateStudyGroupForm } from './components/CreateStudyGroupForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './components/Dialog';
import { Button } from '@/components/ui/button';
import { Plus, Users, Search } from 'lucide-react';
import { config } from '@/config';
import { Navbar } from '@/app/(landing)/components/Navbar';
import { Card, CardHeader, CardContent } from '@/app/userProfile/components/ui/card';

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

interface FormData {
  name: string;
  description: string;
  meetingType: string;
  meetingDays: string[];
  meetingLocation: string;
  meetingTime: string;
}

export default function StudyGroupsPage() {
  const router = useRouter();
  const [allGroups, setAllGroups] = useState<StudyGroup[]>([]);
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStudyGroups = useCallback(async (authToken: string) => {
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
  }, [router]);

  const fetchMyStudyGroups = useCallback(async (authToken: string) => {
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
  }, [router]);

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

  const handleCreateStudyGroup = async (formData: FormData) => {
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
        method: 'POST',
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

  const isUserInGroup = useCallback((group: StudyGroup) => {
    const userId = localStorage.getItem('userId');
    return group.members.some(member => member.userId._id === userId);
  }, []);

  const filteredMyGroups = myGroups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.meetingType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.meetingLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.members.some(member => 
      `${member.userId.firstname} ${member.userId.lastname}`.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const filteredAllGroups = allGroups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.meetingType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.meetingLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.members.some(member => 
      `${member.userId.firstname} ${member.userId.lastname}`.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950">
        <Navbar onLogin={() => {}} onSignup={() => {}} />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950">
      <Navbar onLogin={() => {}} onSignup={() => {}} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-400 dark:to-indigo-500">
              Study Groups
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Join or create study groups to collaborate with fellow students
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="relative overflow-hidden group bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                <span className="flex items-center gap-2 text-sm font-semibold relative z-10">
                  <Plus className="h-5 w-5" />
                  Create Study Group
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] dark:bg-gray-800/95 dark:backdrop-blur-xl dark:border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-400 dark:to-indigo-500">
                  Create a New Study Group
                </DialogTitle>
              </DialogHeader>
              <CreateStudyGroupForm onSubmit={handleCreateStudyGroup} />
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100/90 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 rounded-lg backdrop-blur-sm">
            {error}
          </div>
        )}

        <div className="mb-8 relative">
          <input
            type="text"
            placeholder="Search all study groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Search className="h-5 w-5" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Study Groups Section */}
          <div className="lg:sticky lg:top-4 h-fit">
            <Card className="hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800/30 dark:backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-100/90 to-indigo-200/90 dark:from-indigo-600/10 dark:to-indigo-500/10 backdrop-blur-sm">
                    <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      My Study Groups
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Groups you&apos;re a member of
                    </p>
                  </div>
                  <span className="ml-auto px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-br from-indigo-100/80 to-indigo-200/80 dark:from-indigo-600/10 dark:to-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-500/20 backdrop-blur-sm">
                    {filteredMyGroups.length} groups
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <StudyGroupTable
                  groups={filteredMyGroups}
                  isMemberMap={Object.fromEntries(myGroups.map(group => [group._id, true]))}
                  onJoin={handleJoinGroup}
                  onLeave={handleLeaveGroup}
                />
              </CardContent>
            </Card>
          </div>

          {/* All Study Groups Section */}
          <div>
            <Card className="hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800/30 dark:backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-100/90 to-indigo-200/90 dark:from-indigo-600/10 dark:to-indigo-500/10 backdrop-blur-sm">
                    <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      All Study Groups
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Discover and join study groups
                    </p>
                  </div>
                  <span className="ml-auto px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-br from-indigo-100/80 to-indigo-200/80 dark:from-indigo-600/10 dark:to-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-500/20 backdrop-blur-sm">
                    {filteredAllGroups.length} groups
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <StudyGroupTable
                  groups={filteredAllGroups}
                  isMemberMap={Object.fromEntries(allGroups.map(group => [group._id, isUserInGroup(group)]))}
                  onJoin={handleJoinGroup}
                  onLeave={handleLeaveGroup}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
