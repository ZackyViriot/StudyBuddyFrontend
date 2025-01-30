'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Calendar, Clock, ArrowUpDown, Info, BookOpen, UserCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

interface StudyGroupTableProps {
  groups: StudyGroup[];
  isMemberMap: Record<string, boolean>;
  onJoin: (groupId: string) => void;
  onLeave: (groupId: string) => void;
}

type SortField = 'name' | 'members' | 'meetingType' | 'meetingTime';
type SortOrder = 'asc' | 'desc';

export function StudyGroupTable({ groups, isMemberMap, onJoin, onLeave }: StudyGroupTableProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);

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

  return (
    <>
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-700/50">
              <TableHead className="w-[250px]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('name')}
                  className="hover:bg-transparent font-semibold text-indigo-600 dark:text-indigo-400"
                >
                  Group Name
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-[300px]">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">Description</span>
              </TableHead>
              <TableHead className="w-[120px]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('members')}
                  className="hover:bg-transparent font-semibold text-indigo-600 dark:text-indigo-400"
                >
                  Members
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-[150px]">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">Meeting Info</span>
              </TableHead>
              <TableHead className="w-[120px] text-right">
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedGroups.map((group) => (
              <TableRow 
                key={group._id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <TableCell>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {group.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <span>by</span>
                      <span className="font-medium text-indigo-600 dark:text-indigo-400">
                        {group.createdBy.firstname} {group.createdBy.lastname}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {group.description}
                  </p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                      <Users className="h-3 w-3 mr-1" />
                      {group.members.length}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                    onClick={() => setSelectedGroup(group)}
                  >
                    <Info className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  {isMemberMap[group._id] ? (
                    <Button
                      onClick={() => onLeave(group._id)}
                      variant="destructive"
                      size="sm"
                      className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                    >
                      Leave
                    </Button>
                  ) : (
                    <Button
                      onClick={() => onJoin(group._id)}
                      size="sm"
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                    >
                      Join
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
        <DialogContent className="sm:max-w-[900px] p-0 gap-0 dark:bg-gray-800/95 dark:backdrop-blur-xl dark:border-gray-700">
          <div className="flex flex-col md:flex-row h-[600px]">
            {/* Left Panel - Group Info */}
            <div className="flex-1 p-6 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    {selectedGroup?.name}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="bg-indigo-100/80 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                      {selectedGroup?.meetingType}
                    </Badge>
                    <Badge variant="outline" className="bg-indigo-100/80 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                      <Users className="h-3 w-3 mr-1" />
                      {selectedGroup?.members.length} members
                    </Badge>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="mt-6 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="inline-block p-2 rounded-md bg-indigo-100/80 dark:bg-indigo-900/30">
                      <UserCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </span>
                    Created by
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 ml-11">
                    {selectedGroup?.createdBy.firstname} {selectedGroup?.createdBy.lastname}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="inline-block p-2 rounded-md bg-indigo-100/80 dark:bg-indigo-900/30">
                      <Info className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </span>
                    Description
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 ml-11">{selectedGroup?.description}</p>
                </div>

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
            <div className="flex-1 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700">
              <div className="p-6 h-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Members
                </h3>
                <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[calc(600px-120px)]">
                  {selectedGroup?.members.map((member) => (
                    <div 
                      key={member.userId._id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-900/20 border border-indigo-100 dark:border-indigo-800"
                    >
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                        {member.userId.firstname[0]}{member.userId.lastname[0]}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {member.userId.firstname} {member.userId.lastname}
                        </div>
                      </div>
                      <Badge className="ml-auto bg-indigo-100/80 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                        {member.role === 'admin' ? 'Admin' : 'Member'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 