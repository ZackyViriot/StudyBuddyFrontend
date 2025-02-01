'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardFooter } from './Card';
import { Button } from '@/app/userProfile/components/ui/button';
import { Users, MapPin, Calendar, Clock, FileText, User } from 'lucide-react';
import Image from 'next/image';
import { config } from '@/config';
import { UserProfileCard } from './UserProfileCard';
import { Dialog, DialogContent, DialogTrigger } from '@/app/userProfile/components/ui/dialog';
import { UserRole } from '@/types/user';

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
      profilePicture: string;
      role: UserRole;
    };
    role: string;
  }>;
  createdBy: {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
    profilePicture: string;
    role: UserRole;
  };
}

interface StudyGroupCardProps {
  group: StudyGroup;
  isMember: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
}

const getProfilePictureUrl = (profilePicture: string | undefined | null) => {
  if (!profilePicture) return null;
  if (profilePicture.startsWith('data:')) return profilePicture;
  if (profilePicture.startsWith('http')) return profilePicture;
  if (profilePicture.startsWith('/')) return profilePicture;
  return `${config.API_URL}/uploads/${profilePicture}`;
};

const ProfilePicture = ({ src, name, size = 40, onClick }: { src: string | undefined | null, name: string, size?: number, onClick?: () => void }) => {
  const imageUrl = getProfilePictureUrl(src);

  return (
    <div 
      className={`relative ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`} 
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      {imageUrl ? (
        <Image 
          src={imageUrl}
          alt={`${name}'s profile`}
          fill
          sizes={`${size}px`}
          className="rounded-full object-cover"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <User className="w-1/2 h-1/2 text-gray-500 dark:text-gray-400" />
        </div>
      )}
    </div>
  );
};

export function StudyGroupCard({ group, isMember, onJoin, onLeave }: StudyGroupCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<StudyGroup['members'][0]['userId'] | null>(null);

  const getUserIdFromToken = (token: string | null): string | null => {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload).sub;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  const getUserRoleInGroup = (userId: string | null): string | null => {
    if (!userId) return null;
    const member = group.members.find(m => m.userId._id === userId);
    return member ? member.role : null;
  };

  const handleAction = async (action: 'join' | 'leave') => {
    setIsLoading(true);
    try {
      if (action === 'join' && onJoin) {
        await onJoin();
      } else if (action === 'leave' && onLeave) {
        await onLeave();
      }
    } catch (error) {
      console.error(`Failed to ${action} group:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
      <CardHeader className="space-y-2 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger>
                <ProfilePicture 
                  src={getProfilePictureUrl(group.createdBy.profilePicture)}
                  name={`${group.createdBy.firstname} ${group.createdBy.lastname}`}
                  size={40}
                  onClick={() => setSelectedMember(group.createdBy)}
                />
              </DialogTrigger>
              <DialogContent className="max-w-sm p-0">
                {selectedMember && (
                  <UserProfileCard user={selectedMember} />
                )}
              </DialogContent>
            </Dialog>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{group.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Created by {group.createdBy.firstname} {group.createdBy.lastname}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span className="text-sm">{group.members.length}</span>
            </div>
            {isMember && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {getUserRoleInGroup(getUserIdFromToken(localStorage.getItem('token')))?.toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 p-6">
        <div className="space-y-2">
          <p className="text-gray-600 dark:text-gray-300">{group.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{group.meetingLocation}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{group.meetingDays.join(', ')}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <FileText className="w-4 h-4" />
              <span className="text-sm">{group.meetingType}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{group.meetingTime}</span>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Members</h4>
          <div className="flex flex-wrap gap-2">
            {group.members.map((member) => (
              <Dialog key={member.userId._id}>
                <DialogTrigger>
                  <ProfilePicture
                    src={getProfilePictureUrl(member.userId.profilePicture)}
                    name={`${member.userId.firstname} ${member.userId.lastname}`}
                    size={32}
                    onClick={() => setSelectedMember(member.userId)}
                  />
                </DialogTrigger>
                <DialogContent className="max-w-sm p-0">
                  {selectedMember && (
                    <UserProfileCard user={selectedMember} />
                  )}
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700 p-4">
        {!isMember ? (
          <Button
            onClick={() => handleAction('join')}
            disabled={isLoading}
            className="w-full bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white"
          >
            {isLoading ? 'Processing...' : 'Join Group'}
          </Button>
        ) : (
          <Button
            onClick={() => handleAction('leave')}
            disabled={isLoading}
            variant="outline"
            className="w-full hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-800"
          >
            {isLoading ? 'Processing...' : 'Leave Group'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
} 