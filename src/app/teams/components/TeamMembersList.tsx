'use client';

import React, { useState } from 'react';
import { Team } from '@/types/team';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MemberProfileDialog } from './MemberProfileDialog';

interface TeamMembersListProps {
  team: Team;
  currentUserId: string;
}

export function TeamMembersList({ team, currentUserId }: TeamMembersListProps) {
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const getMemberStats = (memberId: string) => {
    const completedTasks = team.tasks.filter(task => 
      task.status === 'completed' && 
      task.assignedTo && 
      (Array.isArray(task.assignedTo) 
        ? task.assignedTo.some(user => user._id === memberId)
        : task.assignedTo._id === memberId)
    ).length;

    const totalTasks = team.tasks.filter(task =>
      task.assignedTo && 
      (Array.isArray(task.assignedTo) 
        ? task.assignedTo.some(user => user._id === memberId)
        : task.assignedTo._id === memberId)
    ).length;

    const activeGoals = team.goals.filter(goal => goal.status === 'active').length;

    const recentActivity = team.tasks
      .filter(task => 
        task.assignedTo && 
        (Array.isArray(task.assignedTo) 
          ? task.assignedTo.some(user => user._id === memberId)
          : task.assignedTo._id === memberId)
      )
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .slice(0, 3)
      .map(task => ({
        type: task.status === 'completed' ? 'completed' : 'updated',
        task: task.title,
        date: task.updatedAt || task.createdAt
      }));

    return {
      completedTasks,
      totalTasks,
      activeGoals,
      recentActivity
    };
  };

  const handleMemberClick = (member: any) => {
    const memberStats = getMemberStats(member.userId._id);
    setSelectedMember({
      _id: member.userId._id,
      name: member.userId.name,
      email: member.userId.email,
      profilePicture: member.userId.profilePicture,
      role: member.role,
      joinedAt: member.joinedAt || team.createdAt,
      teamStats: memberStats
    });
    setIsProfileOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Team Members</h3>
        <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20">
          {team.members.filter(member => member.userId._id !== team.createdBy._id).length} Members
        </Badge>
      </div>

      <div className="grid gap-4">
        {/* Team Members */}
        {team.members
          .filter(member => member.userId._id !== team.createdBy._id)
          .map(member => (
            <div 
              key={member.userId._id}
              onClick={() => handleMemberClick(member)}
              className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={member.userId.profilePicture} />
                  <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                    {member.userId.name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{member.userId.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{member.userId.email}</p>
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={member.role === 'admin' ? 
                  "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" : 
                  "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                }
              >
                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
              </Badge>
            </div>
          ))}
      </div>

      <MemberProfileDialog
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        member={selectedMember}
        teamStats={selectedMember?.teamStats}
      />
    </div>
  );
} 