import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from 'date-fns';
import { CalendarDays, Clock, CheckCircle2, AlertCircle, X, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from "@/components/ui/use-toast";
import { config } from "@/config";
import { motion, AnimatePresence } from "framer-motion";

interface TaskDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
  onTaskUpdate?: (updatedTask: any) => void;
}

export function TaskDetailsDialog({ isOpen, onClose, task, onTaskUpdate }: TaskDetailsDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${config.API_URL}/api/teams/${task.teamId}/tasks/${task._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      const updatedTask = await response.json();
      if (onTaskUpdate) {
        onTaskUpdate(updatedTask);
      }

      toast({
        title: "Task Updated",
        description: `Task status changed to ${newStatus}`,
        variant: "default",
      });

      onClose();
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'in_progress':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] bg-white dark:bg-gray-800/95 dark:backdrop-blur-xl border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg",
              task.status === 'completed'
                ? "bg-green-50 dark:bg-green-900/20"
                : task.status === 'in_progress'
                ? "bg-blue-50 dark:bg-blue-900/20"
                : "bg-yellow-50 dark:bg-yellow-900/20"
            )}>
              {getStatusIcon(task.status)}
            </div>
            {task.title}
          </DialogTitle>
          {task.description && (
            <DialogDescription className="text-gray-600 dark:text-gray-400 mt-2">
              {task.description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-4">
            <Badge 
              variant="outline" 
              className={cn(
                "px-3 py-1 capitalize",
                getStatusColor(task.status)
              )}
            >
              {task.status.replace('_', ' ')}
            </Badge>
          </div>

          {/* Progress Bar */}
          {task.progress !== undefined && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                <span className="text-sm font-medium text-gray-500">{task.progress}%</span>
              </div>
              <Progress 
                value={task.progress} 
                className={cn(
                  "h-2",
                  task.status === 'completed'
                    ? "[&>div]:bg-gradient-to-r [&>div]:from-green-500 [&>div]:to-emerald-500"
                    : "[&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-indigo-500"
                )}
              />
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Due Date */}
            <div className="col-span-1 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-900/20">
                  <CalendarDays className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(task.dueDate), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            </div>

            {/* Time */}
            <div className="col-span-1 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-purple-50 dark:bg-purple-900/20">
                  <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Time</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(task.dueDate), 'h:mm a')}
                  </p>
                </div>
              </div>
            </div>

            {/* Assignees */}
            {task.assignees && task.assignees.length > 0 && (
              <div className="col-span-2 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-indigo-50 dark:bg-indigo-900/20">
                    <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assignees</p>
                    <div className="flex flex-wrap gap-2">
                      {task.assignees.map((assignee: any) => (
                        <div
                          key={assignee._id}
                          className="flex items-center gap-2 px-2 py-1 rounded-md bg-white dark:bg-gray-900/50"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={assignee.profilePicture} />
                            <AvatarFallback>
                              {assignee.firstname?.[0]}{assignee.lastname?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {assignee.firstname} {assignee.lastname}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
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
          {task.status !== 'completed' && (
            <Button
              onClick={() => handleStatusUpdate('completed')}
              disabled={isUpdating}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 