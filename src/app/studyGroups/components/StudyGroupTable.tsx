'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Calendar, Clock, ArrowUpDown, Info, BookOpen, UserCircle, User, FileText, School, MessageSquare, ArrowUpRight, Plus, Trash2, LogOut } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from 'next/image';
import { config } from '@/config';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

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
    };
    role: string;
  }>;
  createdBy: {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
    profilePicture: string;
  };
}

interface UserProfile {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
  profilePicture: string;
  bio?: string;
  major?: string;
  school?: string;
  preferences?: {
    studyPreferences?: string[];
    availability?: string[];
    subjects?: string[];
  };
}

interface StudyGroupTableProps {
  groups: StudyGroup[];
  isMemberMap: Record<string, boolean>;
  onJoin: (groupId: string) => void;
  onLeave: (groupId: string) => void;
}

type SortField = 'name' | 'members' | 'meetingType' | 'meetingTime';
type SortOrder = 'asc' | 'desc';

const getProfilePictureUrl = (profilePicture: string | undefined | null) => {
  if (!profilePicture) return null;
  if (profilePicture.startsWith('data:')) return profilePicture;
  if (profilePicture.startsWith('http')) return profilePicture;
  if (profilePicture.startsWith('/')) return profilePicture;
  return `${config.API_URL}/uploads/${profilePicture}`;
};

const ProfilePicture = ({ src, name, size = 40 }: { src: string | undefined | null, name: string, size?: number }) => {
  const imageUrl = getProfilePictureUrl(src);

  return (
    <div className="relative" style={{ width: size, height: size }}>
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

export function StudyGroupTable({ groups, isMemberMap, onJoin, onLeave }: StudyGroupTableProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [showMembersGroup, setShowMembersGroup] = useState<StudyGroup | null>(null);
  const [selectedMember, setSelectedMember] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    groupId: string;
    action: 'delete' | 'leave';
    groupName: string;
  }>({
    isOpen: false,
    groupId: '',
    action: 'leave',
    groupName: ''
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedGroups = [...groups].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'members':
        comparison = a.members.length - b.members.length;
        break;
      case 'meetingType':
        comparison = a.meetingType.localeCompare(b.meetingType);
        break;
      case 'meetingTime':
        comparison = a.meetingTime.localeCompare(b.meetingTime);
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Filter groups based on search query
  const filteredGroups = sortedGroups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.meetingType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.meetingLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.members.some(member => 
      member.userId && `${member.userId.firstname} ${member.userId.lastname}`.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const getUserIdFromToken = (token: string | null): string | null => {
    if (!token) return null;
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) return null;
      const payload = JSON.parse(atob(tokenParts[1]));
      return payload.sub || null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  // Add function to check if user is creator
  const isCreator = (group: StudyGroup) => {
    const token = localStorage.getItem('token');
    const userIdFromToken = getUserIdFromToken(token);
    return group.createdBy && userIdFromToken === group.createdBy._id;
  };

  const handleConfirmAction = async () => {
    try {
      await onLeave(confirmationDialog.groupId);
      setConfirmationDialog(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.API_URL}/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch user profile');
      
      const userData = await response.json();
      setSelectedMember(userData);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Add function to handle view button click
  const handleViewGroup = (groupId: string) => {
    router.push(`/studyGroups/${groupId}`);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Search input for everything */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search groups or members by name..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50/50 to-white dark:from-gray-800/50 dark:to-gray-800/90 backdrop-blur-sm">
                  <th className="px-6 py-4 text-left">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      Group
                      <ArrowUpDown className="h-4 w-4" />
                    </motion.button>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Description</span>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSort('members')}
                      className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      Members
                      <ArrowUpDown className="h-4 w-4" />
                    </motion.button>
                  </th>
                  <th className="px-6 py-4 text-left">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSort('meetingType')}
                      className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      Meeting Type
                      <ArrowUpDown className="h-4 w-4" />
                    </motion.button>
                  </th>
                  <th className="px-6 py-4 text-right">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredGroups.map((group, index) => (
                  <motion.tr
                    key={group._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <motion.div 
                          whileHover={{ scale: 1.05 }}
                          className="relative flex-shrink-0"
                        >
                          <ProfilePicture 
                            src={group.createdBy ? getProfilePictureUrl(group.createdBy.profilePicture) : null}
                            name={group.createdBy ? `${group.createdBy.firstname} ${group.createdBy.lastname}` : 'Unknown'}
                            size={40}
                          />
                        </motion.div>
                        <div>
                          <motion.div 
                            className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                            whileHover={{ x: 3 }}
                          >
                            {group.name}
                          </motion.div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            by {group.createdBy ? `${group.createdBy.firstname} ${group.createdBy.lastname}` : 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 max-w-md">
                        {group.description}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant="secondary" 
                        className="bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-700 cursor-pointer hover:scale-105 transition-transform"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMembersGroup(group);
                        }}
                      >
                        <Users className="h-3 w-3 mr-1" />
                        {group.members.length} members
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant="secondary" 
                        className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-700"
                      >
                        {group.meetingType}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                          onClick={() => setSelectedGroup(group)}
                        >
                          <Info className="h-5 w-5" />
                        </motion.button>
                        {isMemberMap[group._id] ? (
                          <div className="flex items-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleViewGroup(group._id)}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-sm hover:shadow-md transition-all"
                            >
                              View
                              <ArrowUpRight className="h-4 w-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setConfirmationDialog({
                                isOpen: true,
                                groupId: group._id,
                                action: isCreator(group) ? 'delete' : 'leave',
                                groupName: group.name
                              })}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium shadow-sm hover:shadow-md transition-all ${
                                isCreator(group)
                                  ? "bg-red-600 hover:bg-red-700"
                                  : "bg-orange-500 hover:bg-orange-600"
                              }`}
                            >
                              {isCreator(group) ? (
                                <>Delete</>
                              ) : (
                                <>Leave</>
                              )}
                            </motion.button>
                          </div>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onJoin(group._id)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-sm hover:shadow-md transition-all"
                          >
                            Join
                            <Plus className="h-4 w-4" />
                          </motion.button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
        <DialogContent className="sm:max-w-[900px] p-0 gap-0 dark:bg-gray-800/95 dark:backdrop-blur-xl dark:border-gray-700">
          <DialogHeader className="sr-only">
            <DialogTitle>Study Group Details</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col lg:flex-row h-[600px]">
            {/* Left Panel - Group Info */}
            <div className="flex-1 p-6 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 overflow-y-auto">
              <div className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedGroup?.name}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="outline" className="bg-indigo-100/80 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                  {selectedGroup?.meetingType}
                </Badge>
                <Badge variant="outline" className="bg-indigo-100/80 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                  <Users className="h-3 w-3 mr-1" />
                  {selectedGroup?.members.length} members
                </Badge>
              </div>

              <div className="mt-6 space-y-6">
                {/* Created by */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="inline-block p-2 rounded-md bg-indigo-100/80 dark:bg-indigo-900/30">
                      <UserCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </span>
                    Created by
                  </h3>
                  <div className="flex items-center gap-3 ml-11">
                    <ProfilePicture 
                      src={selectedGroup?.createdBy ? getProfilePictureUrl(selectedGroup.createdBy.profilePicture) : null}
                      name={selectedGroup?.createdBy ? `${selectedGroup.createdBy.firstname} ${selectedGroup.createdBy.lastname}` : 'Unknown'}
                      size={40}
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedGroup?.createdBy ? `${selectedGroup.createdBy.firstname} ${selectedGroup.createdBy.lastname}` : 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedGroup?.createdBy?.email || 'No email available'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="inline-block p-2 rounded-md bg-indigo-100/80 dark:bg-indigo-900/30">
                      <Info className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </span>
                    Description
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 ml-11">{selectedGroup?.description}</p>
                </div>

                {/* Meeting Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="inline-block p-2 rounded-md bg-indigo-100/80 dark:bg-indigo-900/30">
                      <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </span>
                    Meeting Details
                  </h3>
                  <div className="ml-11 space-y-4">
                    <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 shadow-sm backdrop-blur-sm border border-indigo-100/50 dark:border-indigo-800/50">
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                        <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        <span className="font-medium">{selectedGroup?.meetingDays.join(', ')}</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 shadow-sm backdrop-blur-sm border border-indigo-100/50 dark:border-indigo-800/50">
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                        <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        <span className="font-medium">{selectedGroup?.meetingTime}</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 shadow-sm backdrop-blur-sm border border-indigo-100/50 dark:border-indigo-800/50">
                      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                        <MapPin className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        <span className="font-medium">{selectedGroup?.meetingLocation}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Members */}
            <div className="flex-1 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700">
              <div className="p-6 h-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Members ({selectedGroup?.members.length})
                </h3>
                <div className="flex-1 overflow-y-auto min-h-0">
                  <div className="grid grid-cols-1 gap-3">
                    {selectedGroup?.members.map((member) => (
                      <div 
                        key={member.userId?._id || 'unknown'}
                        className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-900/20 border border-indigo-100 dark:border-indigo-800 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => member.userId && fetchUserProfile(member.userId._id)}
                      >
                        <ProfilePicture 
                          src={member.userId ? getProfilePictureUrl(member.userId.profilePicture) : null}
                          name={member.userId ? `${member.userId.firstname} ${member.userId.lastname}` : 'Unknown'}
                          size={40}
                        />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {member.userId ? `${member.userId.firstname} ${member.userId.lastname}` : 'Unknown Member'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {member.userId?.email || 'No email available'}
                          </div>
                        </div>
                        {member.role === 'admin' ? (
                          <Badge className="ml-auto bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700">
                            Admin
                          </Badge>
                        ) : (
                          <Badge className="ml-auto bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                            Member
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  {isMemberMap[selectedGroup?._id || ''] ? (
                    <Button
                      onClick={() => {
                        setConfirmationDialog({
                          isOpen: true,
                          groupId: selectedGroup?._id || '',
                          action: isCreator(selectedGroup!) ? 'delete' : 'leave',
                          groupName: selectedGroup?.name || ''
                        });
                        setSelectedGroup(null);
                      }}
                      variant="destructive"
                      className={`w-full ${
                        isCreator(selectedGroup!) 
                          ? "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                          : "bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {isCreator(selectedGroup!) ? (
                          <>Delete Group</>
                        ) : (
                          <>Leave Group</>
                        )}
                      </span>
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        onJoin(selectedGroup?._id || '');
                        setSelectedGroup(null);
                      }}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                    >
                      <span className="flex items-center gap-2">
                        Join Group
                      </span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Members List Dialog */}
      <Dialog open={!!showMembersGroup} onOpenChange={() => setShowMembersGroup(null)}>
        <DialogContent className="sm:max-w-[500px] p-6 dark:bg-gray-800/95 dark:backdrop-blur-xl dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Group Members ({showMembersGroup?.members.length})
            </DialogTitle>
          </DialogHeader>
          <div className="mt-6 space-y-4">
            {showMembersGroup?.members.map((member) => (
              <div 
                key={member.userId._id}
                className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                onClick={() => fetchUserProfile(member.userId._id)}
              >
                <div className="flex items-center gap-4">
                  <ProfilePicture 
                    src={getProfilePictureUrl(member.userId.profilePicture)}
                    name={`${member.userId.firstname} ${member.userId.lastname}`}
                    size={48}
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white text-base">
                      {member.userId.firstname} {member.userId.lastname}
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={member.role === 'admin' 
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                      }
                    >
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* User Profile Dialog */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden dark:bg-gray-800/95 dark:backdrop-blur-xl dark:border-gray-700">
          <DialogHeader className="sr-only">
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          {/* Profile Header with Background */}
          <div className="relative h-32 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20">
            <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg">
                <ProfilePicture 
                  src={getProfilePictureUrl(selectedMember?.profilePicture)}
                  name={`${selectedMember?.firstname} ${selectedMember?.lastname}`}
                  size={128}
                />
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="px-6 pt-20 pb-6 space-y-6">
            {/* Basic Info */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedMember?.firstname} {selectedMember?.lastname}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {selectedMember?.email}
              </p>
            </div>

            {/* Bio Section */}
            {selectedMember?.bio && (
              <div className="text-center px-4">
                <p className="text-gray-600 dark:text-gray-300 text-sm italic">
                  &ldquo;{selectedMember.bio}&rdquo;
                </p>
              </div>
            )}

            {/* Academic Info */}
            {(selectedMember?.school || selectedMember?.major) && (
              <div className="space-y-3">
                {selectedMember?.school && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <School className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <span className="text-sm">{selectedMember.school}</span>
                  </div>
                )}
                {selectedMember?.major && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <span className="text-sm">{selectedMember.major}</span>
                  </div>
                )}
              </div>
            )}

            {/* Study Preferences */}
            {selectedMember?.preferences && (
              <div className="space-y-4">
                {selectedMember.preferences.studyPreferences && selectedMember.preferences.studyPreferences.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Study Style
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMember.preferences.studyPreferences.map((pref, index) => (
                        <Badge 
                          key={index}
                          variant="secondary"
                          className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                        >
                          {pref}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedMember.preferences.subjects && selectedMember.preferences.subjects.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Subjects
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMember.preferences.subjects.map((subject, index) => (
                        <Badge 
                          key={index}
                          variant="secondary"
                          className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                        >
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedMember.preferences.availability && selectedMember.preferences.availability.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Availability
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedMember.preferences.availability.map((time, index) => (
                        <Badge 
                          key={index}
                          variant="secondary"
                          className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                        >
                          {time}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Confirmation Dialog */}
      <Dialog 
        open={confirmationDialog.isOpen} 
        onOpenChange={(isOpen) => setConfirmationDialog(prev => ({ ...prev, isOpen }))}
      >
        <DialogContent className="sm:max-w-[425px] p-6 dark:bg-gray-800/95 dark:backdrop-blur-xl dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {confirmationDialog.action === 'delete' ? (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-500">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  Delete Group
                </div>
              ) : (
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-500">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                    <LogOut className="h-5 w-5" />
                  </div>
                  Leave Group
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <p className="text-gray-600 dark:text-gray-300">
              {confirmationDialog.action === 'delete' 
                ? `Are you sure you want to delete "${confirmationDialog.groupName}"? This action cannot be undone.`
                : `Are you sure you want to leave "${confirmationDialog.groupName}"? You can always join back later.`
              }
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setConfirmationDialog(prev => ({ ...prev, isOpen: false }))}
              className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmAction}
              className={`flex items-center gap-2 ${
                confirmationDialog.action === 'delete' 
                ? "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                : "bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800"
              }`}
            >
              {confirmationDialog.action === 'delete' ? (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  Leave
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 