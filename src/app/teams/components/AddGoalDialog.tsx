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
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!targetDate) {
      alert('Please select a target date');
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
      // Get the newly created goal (it will be the last one in the array)
      const newGoal = updatedTeam.goals[updatedTeam.goals.length - 1];
      onAddGoal(newGoal);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating goal:', error);
      alert(error instanceof Error ? error.message : 'Failed to create goal');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTargetDate(undefined);
    setProgress(0);
  };

  const getProgressColor = (value: number) => {
    if (value < 30) return 'from-red-500 to-orange-500';
    if (value < 70) return 'from-yellow-500 to-green-500';
    return 'from-green-500 to-emerald-500';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] bg-white dark:bg-gray-800/95 dark:backdrop-blur-xl border-gray-200 dark:border-gray-700">
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
            <motion.div 
              className="grid gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">Goal Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter goal title"
                className="col-span-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                required
              />
            </motion.div>
            <motion.div 
              className="grid gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter goal description"
                className="col-span-3 h-24 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                required
              />
            </motion.div>
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
                  calendarClassName="!bg-white dark:!bg-gray-800 border dark:border-gray-700 shadow-xl rounded-lg !p-3"
                  customInput={
                    <div className="relative w-full">
                      <Input
                        value={targetDate ? format(targetDate, 'MMM d, yyyy h:mm aa') : ''}
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
                  renderCustomHeader={({
                    date,
                    decreaseMonth,
                    increaseMonth,
                    prevMonthButtonDisabled,
                    nextMonthButtonDisabled
                  }) => (
                    <div className="flex items-center justify-between px-1 py-2 mb-2 border-b border-gray-100 dark:border-gray-700">
                      <button
                        onClick={decreaseMonth}
                        disabled={prevMonthButtonDisabled}
                        type="button"
                        className={cn(
                          "p-1.5 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors",
                          "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                      >
                        <ChevronLeft className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </button>
                      <div className="text-base font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        {format(date, 'MMMM yyyy')}
                      </div>
                      <button
                        onClick={increaseMonth}
                        disabled={nextMonthButtonDisabled}
                        type="button"
                        className={cn(
                          "p-1.5 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors",
                          "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                      >
                        <ChevronRight className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </button>
                    </div>
                  )}
                  popperClassName="react-datepicker-popper z-50"
                  popperPlacement="bottom-start"
                  className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                    "text-sm text-gray-900 dark:text-gray-100"
                  )}
                />
              </div>
            </motion.div>
            <motion.div 
              className="grid gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Initial Progress</Label>
              <div className="space-y-3">
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
                <motion.div 
                  className="flex justify-between items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <span className="text-sm text-gray-500 dark:text-gray-400">Progress</span>
                  <motion.span
                    key={progress}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={cn(
                      "font-medium text-sm",
                      progress === 100 ? "text-green-500" : "text-gray-700 dark:text-gray-300"
                    )}
                  >
                    {progress}%
                  </motion.span>
                </motion.div>
              </div>
            </motion.div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="bg-white dark:bg-gray-800 border-gray-200 hover:border-indigo-300 dark:border-gray-700 dark:hover:border-indigo-700"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className={cn(
                "bg-gradient-to-r text-white transition-all duration-300",
                progress === 100
                  ? "from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  : "from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              )}
            >
              Create Goal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

<style jsx global>{`
  .react-datepicker {
    font-family: inherit !important;
    border: none !important;
    background: transparent !important;
  }
  
  /* ... copy all the calendar styles from AddTaskDialog ... */
`}</style> 