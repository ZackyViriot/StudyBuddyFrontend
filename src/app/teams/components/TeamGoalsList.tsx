'use client';

import React from 'react';
import { Team } from '@/types/team';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, Plus, Check } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TeamGoalsListProps {
  team: Team;
  currentUserId: string;
  onAddGoalClick: () => void;
}

export function TeamGoalsList({ team, currentUserId, onAddGoalClick }: TeamGoalsListProps) {
  const [goals, setGoals] = React.useState(team.goals || []);
  const [unsavedProgress, setUnsavedProgress] = React.useState<Record<string, number>>({});
  const activeGoals = goals.filter(goal => goal.status === 'active') || [];
  const completedGoals = goals.filter(goal => goal.status === 'achieved') || [];

  // Update local goals when team prop changes
  React.useEffect(() => {
    setGoals(team.goals || []);
  }, [team.goals]);

  const updateGoalProgress = async (goalId: string, newProgress: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams/${team._id}/goals/${goalId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          progress: newProgress,
          status: newProgress === 100 ? 'achieved' : 'active'
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to update goal progress');
      }

      const updatedTeam = await response.json();
      
      // Update local state with the response from the server
      const updatedGoal = updatedTeam.goals.find((g: { _id: string }) => g._id === goalId);
      if (updatedGoal) {
        setGoals(prevGoals => 
          prevGoals.map(goal => 
            goal._id === goalId ? { ...goal, progress: newProgress, status: newProgress === 100 ? 'achieved' : 'active' } : goal
          )
        );
      }
      
      // Clear unsaved progress for this goal
      setUnsavedProgress(prev => {
        const updated = { ...prev };
        delete updated[goalId];
        return updated;
      });

    } catch (error) {
      console.error('Error updating goal progress:', error);
      alert(error instanceof Error ? error.message : 'Failed to update goal progress');
    }
  };

  const handleSliderChange = (goalId: string, newValue: number) => {
    setUnsavedProgress(prev => ({
      ...prev,
      [goalId]: newValue
    }));
  };

  const getProgressColor = (value: number) => {
    if (value < 30) return 'from-red-500 to-orange-500';
    if (value < 70) return 'from-yellow-500 to-green-500';
    return 'from-green-500 to-emerald-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Team Goals</h3>
        <Button 
          onClick={onAddGoalClick}
          variant="outline" 
          size="sm" 
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Goal
        </Button>
      </div>

      {(!goals || goals.length === 0) ? (
        <div className="text-center py-12">
          <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Goals Set</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Create your first team goal to start tracking progress!
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Goals */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Active Goals ({activeGoals.length})
            </h4>
            {activeGoals.map(goal => (
              <motion.div
                key={goal._id}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {goal.title}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {goal.description}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => updateGoalProgress(goal._id, 100)}
                    className="hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Mark Complete
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Slider
                        value={[unsavedProgress[goal._id] ?? (goal.progress || 0)]}
                        onValueChange={(values: number[]) => {
                          handleSliderChange(goal._id, values[0]);
                        }}
                        max={100}
                        step={1}
                        className={cn(
                          "relative flex w-full touch-none select-none items-center py-4",
                          "[&>.relative>.absolute]:bg-gradient-to-r",
                          `[&>.relative>.absolute]:${getProgressColor(unsavedProgress[goal._id] ?? (goal.progress || 0))}`
                        )}
                      />
                    </div>
                    <motion.span
                      key={unsavedProgress[goal._id] ?? (goal.progress || 0)}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={cn(
                        "font-medium text-sm min-w-[3rem] text-right",
                        (unsavedProgress[goal._id] ?? (goal.progress || 0)) === 100 ? "text-green-500" : "text-gray-700 dark:text-gray-300"
                      )}
                    >
                      {unsavedProgress[goal._id] ?? (goal.progress || 0)}%
                    </motion.span>
                  </div>
                  {unsavedProgress[goal._id] !== undefined && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-end"
                    >
                      <Button
                        size="sm"
                        onClick={() => updateGoalProgress(goal._id, unsavedProgress[goal._id])}
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                      >
                        Save Progress
                      </Button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Completed Goals ({completedGoals.length})
              </h4>
              {completedGoals.map(goal => (
                <motion.div
                  key={goal._id}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {goal.title}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {goal.description}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => updateGoalProgress(goal._id, 0)}
                      className="hover:bg-yellow-50 hover:text-yellow-600 dark:hover:bg-yellow-900/20"
                    >
                      Reopen Goal
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Completed</span>
                      <span className="font-medium text-green-600 dark:text-green-400">100%</span>
                    </div>
                    <Slider
                      value={[100]}
                      disabled
                      className="relative flex w-full touch-none select-none items-center py-4 opacity-50"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 