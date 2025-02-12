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
  const [isCompleting, setIsCompleting] = useState(false);
  const { toast } = useToast();
  const params = useParams();

  if (!task) return null;

  console.log('TaskDetailsDialog - task:', task);
  console.log('TaskDetailsDialog - assignedTo:', task.assignedTo);

  const getTaskStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'in_progress':
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'pending':
        return 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  };

  const getTaskIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      default:
        return null;
    }
  };

  const normalizeAssignedTo = (assignedTo: any) => {
    if (!assignedTo) return [];

    // Convert to array if single value
    const assignedArray = Array.isArray(assignedTo) ? assignedTo : [assignedTo];

    return assignedArray
      .map(user => {
        // If it's a string (user ID), return empty object to be filtered out
        if (typeof user === 'string') return {};

        // If user has userId property (nested structure)
        if (user.userId) {
          return {
            _id: user.userId._id,
            firstname: user.userId.firstname,
            lastname: user.userId.lastname,
            email: user.userId.email,
            profilePicture: user.userId.profilePicture
          };
        }

        // If user is a direct user object
        if (user._id) {
          return {
            _id: user._id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            profilePicture: user.profilePicture
          };
        }

        return {};
      })
      .filter(user => user._id); // Filter out empty objects and invalid users
  };

  const getUserDisplayName = (user: any): string => {
    if (!user) return 'Unassigned';
    
    if (user.firstname && user.lastname) {
      return `${user.firstname} ${user.lastname}`;
    }
    
    if (user.firstname) return user.firstname;
    if (user.lastname) return user.lastname;
    if (user.email) return user.email;
    
    return 'Unknown User';
  };

  const assignedUsers = normalizeAssignedTo(task.assignedTo);

  const handleTaskCompletion = async () => {
    try {
      setIsUpdating(true);
      setIsCompleting(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      
      const teamId = params.teamId as string;
      const newStatus = task.status === 'completed' ? 'in_progress' as const : 'completed' as const;
      
      const response = await fetch(`${config.API_URL}/api/teams/${teamId}/tasks/${task._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : null,
          progress: newStatus === 'completed' ? 100 : 50,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update task: ${response.status} - ${response.statusText}`);
      }

      const updatedTask = await response.json();

      // Show success toast
      toast({
        title: newStatus === 'completed' ? "Task Completed! 🎉" : "Task Marked as In Progress",
        description: `Successfully updated "${task.title}"`,
        variant: "default",
      });

      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update parent component
      if (onTaskUpdate) {
        onTaskUpdate(updatedTask);
      }

      // Close dialog after a short delay
      setTimeout(() => {
        onClose();
        setIsCompleting(false);
      }, 300);

    } catch (error) {
      console.error('Error updating task:', error);
      setIsCompleting(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update task status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700/50 shadow-xl">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ 
              opacity: isCompleting ? 0.5 : 1,
              scale: isCompleting ? 0.98 : 1 
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <DialogHeader>
              <DialogTitle className="sr-only">Task Details: {task.title}</DialogTitle>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    task.status === 'completed' ? "bg-green-50 dark:bg-green-900/20" :
                    task.status === 'in_progress' ? "bg-yellow-50 dark:bg-yellow-900/20" :
                    "bg-blue-50 dark:bg-blue-900/20"
                  )}>
                    {getTaskIcon(task.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {task.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={`${getTaskStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ').charAt(0).toUpperCase() + task.status.slice(1)}
                      </Badge>
                      {task.progress !== undefined && (
                        <Badge variant="outline" className="bg-gray-50 dark:bg-gray-800">
                          {task.progress}% Complete
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {task.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {task.description}
                  </p>
                )}
              </div>
            </DialogHeader>

            <div className="space-y-6">
              {/* Progress Bar */}
              {task.progress !== undefined && (
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <Progress 
                    value={task.progress} 
                    className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-indigo-500 [&>div]:to-purple-500"
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

                {/* Completion Status */}
                {task.status === 'completed' && task.completedAt && (
                  <div className="col-span-1 p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-white dark:bg-gray-800">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-700 dark:text-green-300">
                          Completed
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {format(new Date(task.completedAt), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Assigned Members */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Assigned Team Members
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {assignedUsers.length > 0 ? (
                    assignedUsers.map((user: any, index: number) => (
                      <div
                        key={user._id || index}
                        className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <Avatar className="h-10 w-10 border-2 border-white dark:border-gray-800 shadow-sm">
                          <AvatarImage src={user.profilePicture} />
                          <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                            {getUserDisplayName(user).substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {getUserDisplayName(user)}
                          </p>
                          {user.email && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {user.email}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center p-6 rounded-lg bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        No team members assigned to this task
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Details */}
              {task.additionalDetails && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Additional Details
                  </h3>
                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {task.additionalDetails}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isUpdating}
                >
                  Close
                </Button>
                <Button
                  onClick={handleTaskCompletion}
                  disabled={isUpdating}
                  className={cn(
                    "min-w-[120px] relative",
                    task.status === 'completed'
                      ? "bg-yellow-500 hover:bg-yellow-600"
                      : "bg-green-500 hover:bg-green-600"
                  )}
                >
                  {isUpdating ? (
                    <motion.span 
                      className="flex items-center gap-2"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <span className="animate-spin">⌛</span>
                      {task.status === 'completed' ? 'Marking as In Progress...' : 'Completing...'}
                    </motion.span>
                  ) : task.status === 'completed' ? (
                    "Mark In Progress"
                  ) : (
                    "Complete Task"
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
} 