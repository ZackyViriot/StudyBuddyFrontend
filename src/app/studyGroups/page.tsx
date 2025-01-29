'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StudyGroupCard } from './components/StudyGroupCard';
import { CreateStudyGroupForm } from './components/CreateStudyGroupForm';
import { Button } from './components/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './components/Dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/Tabs';
import { AuthenticatedNavbar } from '../components/AuthenticatedNavbar';
import { Navbar } from '@/app/(landing)/components/Navbar';
import { config } from '@/config';

interface StudyGroup {
  _id: string;
  name: string;
  meetingType: string;
  meetingDays: string[];
  meetingLocation: string;
  members: any[];
  createdBy: {
    _id: string;
    firstname: string;
    lastname: string;
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
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      
      if (Date.now() >= expirationTime) {
        console.error('Token has expired');
        localStorage.removeItem('token');
        router.push('/');
        return;
      }

      setToken(storedToken);
      fetchData(storedToken);
    } catch (error) {
      console.error('Error validating token:', error);
      localStorage.removeItem('token');
      router.push('/');
    }
  }, [router]);

  const fetchData = async (authToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchStudyGroups(authToken),
        fetchMyStudyGroups(authToken)
      ]);
    } catch (err) {
      setError('Failed to load study groups. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudyGroups = async (authToken: string) => {
    try {
      console.log('Attempting to fetch study groups with token:', authToken ? 'Token exists' : 'No token');
      
      if (!authToken) {
        console.error('No auth token available');
        router.push('/');
        return;
      }

      const response = await fetch(`${config.API_URL}/studyGroups`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Study groups error response:', errorData);
        if (response.status === 401 || response.status === 403) {
          console.error('Authentication failed - redirecting to login');
          localStorage.removeItem('token');
          router.push('/');
          return;
        }
        throw new Error(errorData.message || `Failed to fetch study groups: ${response.status}`);
      }

      const data = await response.json();
      console.log('Study groups response:', data);
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

      const url = `${config.API_URL}/studyGroups/myGroups`;
      console.log('Fetching my study groups from URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('My study groups error response:', errorData);
        
        if (response.status === 401 || response.status === 403) {
          console.error('Authentication failed - redirecting to login');
          localStorage.removeItem('token');
          router.push('/');
          return;
        }
        
        throw new Error(errorData.message || `Failed to fetch my study groups: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('My study groups response data:', data);
      setMyGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching my study groups:', error);
      setMyGroups([]);
      if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
        router.push('/');
      }
      throw error;
    }
  };

  const handleCreateStudyGroup = async (formData: any) => {
    try {
      const response = await fetch(`${config.API_URL}/studyGroups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        setIsCreateDialogOpen(false);
        await fetchData(token!);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create study group');
      }
    } catch (error) {
      console.error('Error creating study group:', error);
      setError('Failed to create study group. Please try again.');
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      const response = await fetch(`${config.API_URL}/studyGroups/${groupId}/join`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (response.ok) {
        await fetchData(token!);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to join group');
      }
    } catch (error) {
      console.error('Error joining study group:', error);
      setError('Failed to join group. Please try again.');
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      const response = await fetch(`${config.API_URL}/studyGroups/${groupId}/leave`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (response.ok) {
        await fetchData(token!);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to leave group');
      }
    } catch (error) {
      console.error('Error leaving study group:', error);
      setError('Failed to leave group. Please try again.');
    }
  };

  const isUserInGroup = (group: StudyGroup) => {
    const userId = localStorage.getItem('userId');
    return group.members.some(member => member._id === userId);
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Navbar onLogin={() => {}} onSignup={() => {}} />
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              Study Groups
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Join or create study groups to collaborate with fellow students
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-lg font-semibold flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Study Group
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-center">Create a New Study Group</DialogTitle>
              </DialogHeader>
              <CreateStudyGroupForm onSubmit={handleCreateStudyGroup} />
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="all">All Groups</TabsTrigger>
                <TabsTrigger value="my-groups">My Groups</TabsTrigger>
              </TabsList>
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
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    You haven't joined any study groups yet. Join one from the 'All Groups' tab!
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
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
