import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, Award, CheckCircle2, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { format, formatDistanceToNow } from 'date-fns';

interface MemberProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: any;
  teamStats?: {
    completedTasks: number;
    totalTasks: number;
    activeGoals: number;
    recentActivity: Array<{
      type: 'completed' | 'updated';
      task: string;
      date: Date;
    }>;
  };
}

export function MemberProfileDialog({ isOpen, onClose, member, teamStats }: MemberProfileDialogProps) {
  if (!member) return null;

  const completionRate = teamStats ? Math.round((teamStats.completedTasks / teamStats.totalTasks) * 100) || 0 : 0;
  const timeOnTeam = member.joinedAt 
    ? formatDistanceToNow(new Date(member.joinedAt), { addSuffix: false })
    : 'Founding Member';

  // Format the time string to be more concise
  const formatTimeDisplay = (time: string) => {
    // Convert "about 1 month" to "1 month"
    time = time.replace('about ', '');
    // Convert "less than a minute" to "< 1 min"
    if (time === 'less than a minute') return '< 1 min';
    // Convert "1 day" to "1d", "2 months" to "2mo", etc.
    const parts = time.split(' ');
    if (parts.length === 2) {
      const [num, unit] = parts;
      switch (unit) {
        case 'year':
        case 'years':
          return `${num}y`;
        case 'month':
        case 'months':
          return `${num}mo`;
        case 'day':
        case 'days':
          return `${num}d`;
        case 'hour':
        case 'hours':
          return `${num}h`;
        case 'minute':
        case 'minutes':
          return `${num}m`;
        default:
          return time;
      }
    }
    return time;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20">
        <DialogHeader>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-white dark:border-gray-800 shadow-xl">
                <AvatarImage src={member.profilePicture} />
                <AvatarFallback className="text-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                  {member.name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 bg-green-500 h-4 w-4 rounded-full border-2 border-white dark:border-gray-800" />
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {member.name}
              </DialogTitle>
              <Badge variant="outline" className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-800">
                {member.role}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contact Information */}
          <div className="flex items-center gap-2 justify-center">
            <Mail className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">{member.email}</span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Tasks Completed */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {teamStats?.completedTasks || 0}
                </span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-400">Tasks Completed</p>
            </div>

            {/* Active Goals */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {teamStats?.activeGoals || 0}
                </span>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400">Active Goals</p>
            </div>

            {/* Time on Team */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <div className="flex flex-col items-end">
                  {timeOnTeam === 'Founding Member' ? (
                    <>
                      <div className="flex items-center gap-1">
                        <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          ★
                        </span>
                        <span className="text-sm font-semibold text-purple-600/90 dark:text-purple-400/90">
                          Founding
                        </span>
                      </div>
                      <span className="text-xs font-medium text-purple-500/80 dark:text-purple-400/80">
                        Original Member
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {formatTimeDisplay(timeOnTeam)}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-purple-600 dark:text-purple-400">
                {timeOnTeam === 'Founding Member' ? 'Team Creator' : 'Time on Team'}
              </p>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Task Completion Rate</span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{completionRate}%</span>
            </div>
            <Progress 
              value={completionRate} 
              className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-purple-600 [&>div]:to-indigo-600"
            />
          </div>

          {/* Recent Activity */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Recent Activity</h4>
            <div className="space-y-2">
              {teamStats?.recentActivity?.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                >
                  <div className={`h-2 w-2 rounded-full ${
                    activity.type === 'completed' ? 'bg-green-600' : 'bg-blue-600'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {activity.type === 'completed' ? 'Completed' : 'Updated'} task "{activity.task}"
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(activity.date))} ago
                    </p>
                  </div>
                </div>
              ))}
              {(!teamStats?.recentActivity || teamStats.recentActivity.length === 0) && (
                <div className="text-center p-4 text-sm text-gray-500 dark:text-gray-400">
                  No recent activity
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 