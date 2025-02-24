'use client';

import React from 'react';
import { Team } from '@/types/team';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { format, isValid } from 'date-fns';
import { Calendar as CalendarIcon, Clock, Check } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { config } from '@/config';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface AddTaskDialogProps {
  team: Team;
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: any) => void;
}

export function AddTaskDialog({ team, isOpen, onClose, onAddTask }: AddTaskDialogProps) {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [dueDate, setDueDate] = React.useState<Date | null>(null);
  const [selectedMembers, setSelectedMembers] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      if (!dueDate) {
        setError('Due date is required');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      const taskData = {
        title,
        description,
        dueDate: dueDate instanceof Date && !isNaN(dueDate.getTime()) 
          ? dueDate.toISOString() 
          : new Date().toISOString(),
        status: 'pending',
        assignedTo: selectedMembers.length > 0 ? selectedMembers[0] : team.createdBy._id
      };

      const response = await fetch(`${config.API_URL}/api/teams/${team._id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(taskData),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create task');
      }

      const updatedTeam = await response.json();
      const newTask = updatedTeam.tasks[updatedTeam.tasks.length - 1];
      onAddTask(newTask);
      resetForm();
      onClose();
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate(null);
    setSelectedMembers([]);
    setError(null);
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Remove duplicate members by user ID
  const allMembers = React.useMemo(() => {
    const seen = new Set();
    return [
      { userId: team.createdBy, role: 'admin' },
      ...(Array.isArray(team.members) ? team.members.map(member => ({
        userId: member.userId || member,
        role: member.role || 'member'
      })) : [])
    ]
    .filter(member => {
      if (!member.userId || !member.userId._id) return false;
      const duplicate = seen.has(member.userId._id);
      seen.add(member.userId._id);
      return !duplicate;
    });
  }, [team]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800/95 dark:backdrop-blur-xl border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
              Add New Task
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Create a new task for your team. Add details and assign members.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">Task Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                className="col-span-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description"
                className="col-span-3 h-24 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Due Date & Time</Label>
              <div className="relative">
                <DatePicker
                  selected={dueDate}
                  onChange={(date: Date | null) => {
                    if (date instanceof Date && !isNaN(date.getTime())) {
                      setDueDate(date);
                    } else {
                      setDueDate(null);
                      setError('Invalid date selected');
                    }
                  }}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  timeCaption="Time"
                  dateFormat="MMMM d, yyyy h:mm aa"
                  placeholderText="Select due date and time"
                  required
                  calendarClassName="!bg-white dark:!bg-gray-800 border dark:border-gray-700 shadow-xl rounded-lg !p-3"
                  popperClassName="!z-[9999]"
                  customInput={
                    <div className="relative w-full">
                      <Input
                        value={dueDate ? format(dueDate, 'MMM d, yyyy h:mm aa') : ''}
                        readOnly
                        placeholder="Select date and time"
                        className="cursor-pointer bg-white dark:bg-gray-800 pl-10 pr-10 truncate placeholder:text-gray-500 dark:placeholder:text-gray-400"
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                        <CalendarIcon className="h-4 w-4 text-purple-500 dark:text-purple-400 flex-shrink-0" />
                      </div>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Clock className="h-4 w-4 text-purple-500 dark:text-purple-400 flex-shrink-0" />
                      </div>
                    </div>
                  }
                  portalId="calendar-root"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Assign Members</Label>
              <div className="flex flex-wrap gap-2 p-4 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                {allMembers.map((member) => {
                  const user = member.userId;
                  const displayName = user.name || `${user.firstname} ${user.lastname}`;
                  return (
                    <div
                      key={user._id}
                      onClick={() => toggleMember(user._id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                        selectedMembers.includes(user._id)
                          ? "bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      )}
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {displayName}
                      </span>
                      {selectedMembers.includes(user._id) && (
                        <Check className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {error && (
            <div className="text-sm text-red-500 mb-4 p-2 bg-red-50 dark:bg-red-900/10 rounded-md">
              {error}
            </div>
          )}
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="bg-white dark:bg-gray-800 border-gray-200 hover:border-indigo-300 dark:border-gray-700 dark:hover:border-indigo-700"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 