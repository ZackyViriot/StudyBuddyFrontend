'use client';

import React from 'react';
import { Team } from '@/types/team';
import { Button } from '@/components/ui/button';
import { config } from '@/config';
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
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, Clock, Target, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface AddGoalDialogProps {
  team: Team;
  isOpen: boolean;
  onClose: () => void;
  onAddGoal: (goal: any) => void;
}

export function AddGoalDialog({ team, isOpen, onClose, onAddGoal }: AddGoalDialogProps) {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [targetDate, setTargetDate] = React.useState<Date | undefined>(undefined);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!targetDate) {
      setError('Please select a target date');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${config.API_URL}/api/teams/${team._id}/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          targetDate: targetDate.toISOString(),
          status: 'active',
          progress
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create goal');
      }

      const updatedTeam = await response.json();
      const newGoal = updatedTeam.goals[updatedTeam.goals.length - 1];
      onAddGoal(newGoal);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating goal:', error);
      setError(error instanceof Error ? error.message : 'Failed to create goal');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTargetDate(undefined);
    setProgress(0);
    setError('');
  };

  const getProgressColor = (value: number) => {
    if (value < 30) return 'from-red-500 to-orange-500';
    if (value < 70) return 'from-yellow-500 to-green-500';
    return 'from-green-500 to-emerald-500';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg bg-white dark:bg-gray-900">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
              Add New Goal
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Create a new goal for your team to work towards.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm"
              >
                <AlertCircle className="h-4 w-4" />
                {error}
              </motion.div>
            )}

            <div>
              <Label htmlFor="title" className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Goal Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter an inspiring goal title"
                className="mt-2 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you want to achieve..."
                className="mt-2 h-32 bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 resize-none"
                required
              />
            </div>

            <motion.div 
              className="grid gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Target Date</Label>
              <div className="relative">
                <DatePicker
                  selected={targetDate}
                  onChange={(date: Date | null) => setTargetDate(date || undefined)}
                  showTimeSelect
                  timeFormat="h:mm aa"
                  timeIntervals={30}
                  timeCaption="Time"
                  dateFormat="MMM d, yyyy h:mm aa"
                  placeholderText="Select date and time"
                  required
                  calendarClassName="!bg-white dark:!bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg"
                  popperClassName="date-picker-popper"
                  customInput={
                    <div className="relative w-full">
                      <Input
                        value={targetDate ? format(targetDate, 'MMM d, yyyy h:mm aa') : ''}
                        readOnly
                        placeholder="Select date and time"
                        className="cursor-pointer bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 pl-10 pr-10 truncate text-gray-900 dark:text-gray-100"
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                        <CalendarIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </div>
                    </div>
                  }
                />
              </div>
            </motion.div>

            <div>
              <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Initial Progress
              </Label>
              <div className="mt-6 space-y-4">
                <Slider
                  value={[progress]}
                  onValueChange={(values: number[]) => setProgress(values[0])}
                  max={100}
                  step={1}
                  className={cn(
                    "w-full h-2",
                    "bg-gradient-to-r",
                    getProgressColor(progress)
                  )}
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Progress</span>
                  <span className={cn(
                    "text-sm font-semibold",
                    progress === 100 ? "text-green-500" : "text-gray-900 dark:text-gray-100"
                  )}>
                    {progress}%
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-transparent border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={cn(
                "flex-1 text-white transition-all duration-300",
                progress === 100
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              )}
            >
              Create Goal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <style jsx global>{`
        .date-picker-popper {
          z-index: 50;
        }

        .react-datepicker {
          font-family: inherit !important;
          background-color: white !important;
          border: 1px solid rgb(229 231 235) !important;
          border-radius: 0.5rem !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
          overflow: hidden !important;
        }

        .dark .react-datepicker {
          background-color: rgb(31 41 55) !important;
          border-color: rgb(55 65 81) !important;
        }

        .react-datepicker__header {
          background-color: rgb(249 250 251) !important;
          border-bottom: 1px solid rgb(229 231 235) !important;
          padding: 1rem !important;
        }

        .dark .react-datepicker__header {
          background-color: rgb(31 41 55) !important;
          border-color: rgb(55 65 81) !important;
        }

        .react-datepicker__current-month {
          color: rgb(17 24 39) !important;
          font-weight: 600 !important;
        }

        .dark .react-datepicker__current-month {
          color: rgb(243 244 246) !important;
        }

        .react-datepicker__day-name {
          color: rgb(107 114 128) !important;
          font-weight: 500 !important;
        }

        .dark .react-datepicker__day-name {
          color: rgb(156 163 175) !important;
        }

        .react-datepicker__day {
          color: rgb(17 24 39) !important;
          border-radius: 0.375rem !important;
        }

        .dark .react-datepicker__day {
          color: rgb(243 244 246) !important;
        }

        .react-datepicker__day:hover {
          background-color: rgb(243 244 246) !important;
        }

        .dark .react-datepicker__day:hover {
          background-color: rgb(55 65 81) !important;
        }

        .react-datepicker__day--selected {
          background: linear-gradient(to right, rgb(99 102 241), rgb(168 85 247)) !important;
          color: white !important;
        }

        .react-datepicker__time-container {
          border-left: 1px solid rgb(229 231 235) !important;
          width: 150px !important;
          background-color: white !important;
        }

        .dark .react-datepicker__time-container {
          border-color: rgb(55 65 81) !important;
          background-color: rgb(31 41 55) !important;
        }

        .react-datepicker__time-box {
          background-color: white !important;
        }

        .dark .react-datepicker__time-box {
          background-color: rgb(31 41 55) !important;
        }

        .react-datepicker__time-list-item {
          height: auto !important;
          padding: 0.5rem !important;
          color: rgb(17 24 39) !important;
          background-color: white !important;
          transition: all 0.2s !important;
          font-size: 0.875rem !important;
          text-align: center !important;
        }

        .dark .react-datepicker__time-list-item {
          color: rgb(243 244 246) !important;
          background-color: rgb(31 41 55) !important;
        }

        .react-datepicker__time-list-item:hover {
          background-color: rgb(243 244 246) !important;
          color: rgb(17 24 39) !important;
        }

        .dark .react-datepicker__time-list-item:hover {
          background-color: rgb(55 65 81) !important;
          color: rgb(243 244 246) !important;
        }

        .react-datepicker__time-list-item--selected {
          background: linear-gradient(to right, rgb(99 102 241), rgb(168 85 247)) !important;
          color: white !important;
          font-weight: 500 !important;
        }

        .react-datepicker__time-container .react-datepicker__time {
          background-color: white !important;
        }

        .dark .react-datepicker__time-container .react-datepicker__time {
          background-color: rgb(31 41 55) !important;
        }

        .react-datepicker__header--time {
          background-color: white !important;
          border-bottom: 1px solid rgb(229 231 235) !important;
        }

        .dark .react-datepicker__header--time {
          background-color: rgb(31 41 55) !important;
          border-color: rgb(55 65 81) !important;
        }

        .react-datepicker-time__header {
          color: rgb(17 24 39) !important;
          font-weight: 600 !important;
          font-size: 0.875rem !important;
        }

        .dark .react-datepicker-time__header {
          color: rgb(243 244 246) !important;
        }

        .react-datepicker__triangle {
          display: none !important;
        }
      `}</style>
    </Dialog>
  );
} 