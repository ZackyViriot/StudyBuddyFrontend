'use client';

import React from 'react';
import { Team } from '@/types/team';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, Plus, Check, ArrowUpRight } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { GoalDetailsDialog } from './GoalDetailsDialog';
import { config } from '@/config';

interface TeamGoalsListProps {
  team: Team;
  currentUserId: string;
  onAddGoalClick: () => void;
}

export function TeamGoalsList({ team, currentUserId, onAddGoalClick }: TeamGoalsListProps) {
  const [goals, setGoals] = React.useState(team.goals || []);
  const [selectedGoal, setSelectedGoal] = React.useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Update local goals when team prop changes
  React.useEffect(() => {
    setGoals(team.goals || []);
  }, [team.goals]);

  const handleGoalClick = (goal: any) => {
    setSelectedGoal(goal);
    setIsDetailsOpen(true);
  };

  const handleGoalUpdate = async (goalId: string, status: string, progress: number) => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${config.API_URL}/api/teams/${team._id}/goals/${goalId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          progress,
          status
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update goal');
      }

      // Refresh the page to get updated data
      window.location.reload();
    } catch (error) {
      console.error('Error updating goal:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
            <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Team Goals</h3>
        </div>
        <Button 
          onClick={onAddGoalClick}
          size="sm"
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Goal
        </Button>
      </div>

      <div className="grid gap-4">
        {team.goals.map((goal) => (
          <div
            key={goal._id}
            onClick={() => handleGoalClick(goal)}
            className="p-4 rounded-lg border bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 backdrop-blur-sm border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-base mb-1">{goal.title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{goal.description}</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Progress</span>
                    <span className={cn(
                      "font-medium",
                      goal.status === 'achieved' ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"
                    )}>{goal.progress || 0}%</span>
                  </div>
                  <Progress 
                    value={goal.progress || 0} 
                    className={cn(
                      "h-2",
                      goal.status === 'achieved' 
                        ? "bg-green-100 dark:bg-green-950/20 [&>div]:bg-gradient-to-r [&>div]:from-green-500 [&>div]:to-emerald-500"
                        : "bg-blue-100 dark:bg-blue-950/20 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-indigo-500"
                    )}
                  />
                </div>
                <div className="flex items-center gap-3 flex-wrap mt-3">
                  <Badge 
                    variant="outline" 
                    className={goal.status === 'achieved' ? 
                      'text-green-600 dark:text-green-400 border-green-200 dark:border-green-800' : 
                      'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                    }
                  >
                    {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                  </Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Due: {format(new Date(goal.targetDate), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
              {goal.status === 'achieved' ? (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGoalUpdate(goal._id as string, 'active', goal.progress || 0);
                  }}
                  disabled={isUpdating}
                  className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                >
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  Reopen
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGoalUpdate(goal._id as string, 'achieved', 100);
                  }}
                  disabled={isUpdating}
                  className="hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Mark Achieved
                </Button>
              )}
            </div>
          </div>
        ))}

        {team.goals.length === 0 && (
          <div className="text-center py-6">
            <Target className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No goals set yet</p>
          </div>
        )}
      </div>

      {selectedGoal && (
        <GoalDetailsDialog
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedGoal(null);
          }}
          goal={selectedGoal}
          teamId={team._id}
          onGoalUpdate={() => window.location.reload()}
        />
      )}
    </div>
  );
} 