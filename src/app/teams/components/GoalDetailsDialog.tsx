'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Target, Calendar, Check, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { config } from '@/config';
import { motion } from 'framer-motion';

interface GoalDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  goal: any;
  teamId: string;
  onGoalUpdate?: () => void;
}

export function GoalDetailsDialog({ isOpen, onClose, goal, teamId, onGoalUpdate }: GoalDetailsDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(goal.progress || 0);
  const [error, setError] = useState<string | null>(null);

  const updateGoalProgress = async (newProgress: number) => {
    setIsUpdating(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${config.API_URL}/api/teams/${teamId}/goals/${goal._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          progress: newProgress,
          status: newProgress === 100 ? 'achieved' : 'active'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update goal');
      }

      if (onGoalUpdate) {
        onGoalUpdate();
      }
      onClose();
    } catch (err) {
      console.error('Error updating goal:', err);
      setError(err instanceof Error ? err.message : 'Failed to update goal');
    } finally {
      setIsUpdating(false);
    }
  };

  const getProgressColor = (value: number) => {
    if (value < 30) return 'from-red-500 to-orange-500';
    if (value < 70) return 'from-yellow-500 to-green-500';
    return 'from-green-500 to-emerald-500';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] bg-white dark:bg-gray-800/95 dark:backdrop-blur-xl border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <Target className="h-6 w-6 text-purple-500" />
            {goal.title}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            {goal.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status and Date */}
          <div className="flex flex-wrap gap-4">
            <Badge variant="outline" 
              className={cn(
                "px-3 py-1",
                goal.status === 'achieved' 
                  ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800"
                  : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
              )}
            >
              {goal.status === 'achieved' ? 'Achieved' : 'In Progress'}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="h-4 w-4" />
              Target: {format(new Date(goal.targetDate), 'MMM d, yyyy')}
            </div>
          </div>

          {/* Progress Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</h4>
              <span className="text-sm font-medium text-gray-500">{progress}%</span>
            </div>
            <Slider
              value={[progress]}
              onValueChange={(values) => setProgress(values[0])}
              max={100}
              step={1}
              className={cn(
                "w-full h-2",
                "bg-gradient-to-r",
                getProgressColor(progress)
              )}
              disabled={isUpdating}
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 p-2 bg-red-50 dark:bg-red-900/10 rounded-md">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUpdating}
            className="bg-white dark:bg-gray-800"
          >
            Close
          </Button>
          {goal.status !== 'achieved' && (
            <Button
              onClick={() => updateGoalProgress(progress)}
              disabled={isUpdating || progress === goal.progress}
              className={cn(
                "relative",
                progress === 100
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-blue-500 hover:bg-blue-600"
              )}
            >
              {isUpdating ? (
                <motion.span 
                  className="flex items-center gap-2"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Clock className="h-4 w-4" />
                  Updating...
                </motion.span>
              ) : progress === 100 ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Mark as Achieved
                </>
              ) : (
                "Update Progress"
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 