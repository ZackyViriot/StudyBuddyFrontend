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
import { format, isValid, setHours, setMinutes } from 'date-fns';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
        dueDate: dueDate.toISOString(),
        status: 'pending',
        assignedTo: selectedMembers.length > 0 ? selectedMembers : [team.createdBy._id]
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams/${team._id}/tasks`, {
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

      const data = await response.json();
      onAddTask(data);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px] bg-white dark:bg-gray-800/95 dark:backdrop-blur-xl border-gray-200 dark:border-gray-700">
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
                  onChange={(date: Date | null) => setDueDate(date)}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={15}
                  timeCaption="Time"
                  dateFormat="MMMM d, yyyy h:mm aa"
                  placeholderText="Select due date and time"
                  required
                  calendarClassName="!bg-white dark:!bg-gray-800 border dark:border-gray-700 shadow-xl rounded-lg !p-3"
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
                  renderCustomHeader={({
                    date,
                    decreaseMonth,
                    increaseMonth,
                    prevMonthButtonDisabled,
                    nextMonthButtonDisabled,
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
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Assign Members</Label>
              <div className="flex flex-wrap gap-2 p-4 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                {[
                  // Add creator as the first member
                  { userId: team.createdBy, role: 'admin' },
                  // Add all other team members
                  ...team.members
                ]
                  .filter(member => 
                    member.userId && 
                    member.userId._id
                  )
                  .map((member) => {
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
      <style jsx global>{`
        .react-datepicker {
          font-family: inherit !important;
          border: none !important;
          background: transparent !important;
        }
        
        .react-datepicker__header {
          background: transparent !important;
          border-bottom: none !important;
          padding: 0 !important;
        }
        
        .react-datepicker__month-container {
          background: transparent !important;
        }
        
        .react-datepicker__day-names {
          display: flex !important;
          justify-content: space-between !important;
          padding: 0 0.5rem !important;
          margin-bottom: 0.5rem !important;
          border-bottom: 1px solid #e5e7eb !important;
        }
        
        .dark .react-datepicker__day-names {
          border-color: rgb(55 65 81) !important;
        }
        
        .react-datepicker__day-name {
          color: #6b7280 !important;
          font-weight: 500 !important;
          width: 2.25rem !important;
          line-height: 2.25rem !important;
          margin: 0 !important;
          font-size: 0.875rem !important;
        }
        
        .react-datepicker__month {
          margin: 0 !important;
          padding: 0 0.5rem !important;
        }
        
        .react-datepicker__week {
          display: flex !important;
          justify-content: space-between !important;
        }
        
        .react-datepicker__day {
          width: 2.25rem !important;
          line-height: 2.25rem !important;
          margin: 0 !important;
          border-radius: 0.5rem !important;
          color: #374151 !important;
          font-weight: 400 !important;
          font-size: 0.875rem !important;
          transition: all 200ms !important;
        }
        
        .dark .react-datepicker__day {
          color: #e5e7eb !important;
        }
        
        .react-datepicker__day:hover:not(.react-datepicker__day--selected, .react-datepicker__day--disabled) {
          background: rgba(147, 51, 234, 0.1) !important;
          color: rgb(147, 51, 234) !important;
        }
        
        .dark .react-datepicker__day:hover:not(.react-datepicker__day--selected, .react-datepicker__day--disabled) {
          background: rgba(147, 51, 234, 0.2) !important;
          color: rgb(216, 180, 254) !important;
        }
        
        .react-datepicker__day--selected {
          background: linear-gradient(to right, rgb(147, 51, 234), rgb(129, 140, 248)) !important;
          color: white !important;
          font-weight: 600 !important;
        }
        
        .react-datepicker__day--keyboard-selected {
          background: rgba(147, 51, 234, 0.1) !important;
          color: rgb(147, 51, 234) !important;
          font-weight: 600 !important;
        }
        
        .dark .react-datepicker__day--keyboard-selected {
          background: rgba(147, 51, 234, 0.2) !important;
          color: rgb(216, 180, 254) !important;
        }
        
        .react-datepicker__day--today {
          position: relative !important;
          font-weight: 600 !important;
          color: rgb(147, 51, 234) !important;
        }
        
        .dark .react-datepicker__day--today {
          color: rgb(216, 180, 254) !important;
        }
        
        .react-datepicker__day--outside-month {
          color: #9ca3af !important;
          font-weight: 300 !important;
        }
        
        .dark .react-datepicker__day--outside-month {
          color: #6b7280 !important;
        }
        
        .react-datepicker__time-container {
          border-left: 1px solid #e5e7eb !important;
          width: 120px !important;
          background: transparent !important;
        }
        
        .dark .react-datepicker__time-container {
          border-color: rgb(55 65 81) !important;
        }
        
        .react-datepicker__time {
          background: transparent !important;
        }
        
        .react-datepicker__time-box {
          width: 100% !important;
          text-align: center !important;
          border-radius: 0.5rem !important;
          overflow: hidden !important;
        }
        
        .react-datepicker__header--time {
          background: transparent !important;
          border-bottom: 1px solid #e5e7eb !important;
          padding: 0.5rem !important;
        }
        
        .dark .react-datepicker__header--time {
          border-color: rgb(55 65 81) !important;
        }
        
        .react-datepicker__time-list {
          height: 264px !important;
          overflow-y: auto !important;
          background: transparent !important;
          scrollbar-width: thin !important;
          scrollbar-color: rgba(147, 51, 234, 0.3) transparent !important;
          padding: 0 !important;
        }
        
        .react-datepicker__time-list::-webkit-scrollbar {
          width: 4px !important;
        }
        
        .react-datepicker__time-list::-webkit-scrollbar-track {
          background: transparent !important;
        }
        
        .react-datepicker__time-list::-webkit-scrollbar-thumb {
          background-color: rgba(147, 51, 234, 0.3) !important;
          border-radius: 2px !important;
        }
        
        .react-datepicker__time-list-item {
          padding: 0.5rem 0.75rem !important;
          height: auto !important;
          line-height: 1.5 !important;
          color: #374151 !important;
          font-size: 0.875rem !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          transition: all 150ms ease-in-out !important;
          margin: 2px 4px !important;
          border-radius: 0.375rem !important;
          white-space: nowrap !important;
        }
        
        .dark .react-datepicker__time-list-item {
          color: #e5e7eb !important;
        }
        
        .react-datepicker__time-list-item:hover:not(.react-datepicker__time-list-item--selected) {
          background: rgba(147, 51, 234, 0.1) !important;
          color: rgb(147, 51, 234) !important;
        }
        
        .dark .react-datepicker__time-list-item:hover:not(.react-datepicker__time-list-item--selected) {
          background: rgba(147, 51, 234, 0.2) !important;
          color: rgb(216, 180, 254) !important;
        }
        
        .react-datepicker__time-list-item--selected {
          background: linear-gradient(to right, rgb(147, 51, 234), rgb(129, 140, 248)) !important;
          color: white !important;
          font-weight: 500 !important;
          position: relative !important;
          box-shadow: 0 2px 4px rgba(147, 51, 234, 0.1) !important;
        }
        
        .react-datepicker__time-list-item--selected::after {
          content: "" !important;
          position: absolute !important;
          inset: 0 !important;
          border-radius: 0.375rem !important;
          border: 2px solid rgba(147, 51, 234, 0.5) !important;
          pointer-events: none !important;
        }
        
        .react-datepicker-time__caption {
          font-weight: 500 !important;
          color: #6b7280 !important;
          font-size: 0.875rem !important;
          margin-bottom: 0.5rem !important;
          display: block !important;
          text-align: center !important;
        }
        
        .dark .react-datepicker-time__caption {
          color: #9ca3af !important;
        }
        
        /* Time Caption Styles */
        .react-datepicker-time__header {
          background: transparent !important;
          color: transparent !important;
          font-weight: 500 !important;
          font-size: 0.875rem !important;
          padding: 0.5rem !important;
          text-align: center !important;
          background-image: linear-gradient(to right, rgb(147, 51, 234), rgb(129, 140, 248)) !important;
          -webkit-background-clip: text !important;
          background-clip: text !important;
          margin-bottom: 0.5rem !important;
        }

        /* Input Field Styles */
        .react-datepicker__input-container {
          display: block !important;
          width: 100% !important;
        }

        .react-datepicker__input-container input {
          width: 100% !important;
          height: 2.5rem !important;
          padding-left: 2.5rem !important;
          padding-right: 2.5rem !important;
          font-size: 0.875rem !important;
          line-height: 1.25rem !important;
          border-radius: 0.375rem !important;
          border: 1px solid #e5e7eb !important;
          background-color: white !important;
          color: #374151 !important;
          cursor: pointer !important;
        }

        .dark .react-datepicker__input-container input {
          background-color: rgb(31, 41, 55) !important;
          border-color: rgb(55, 65, 81) !important;
          color: #e5e7eb !important;
        }

        .react-datepicker__input-container input::placeholder {
          color: #9ca3af !important;
        }

        .dark .react-datepicker__input-container input::placeholder {
          color: #6b7280 !important;
        }

        .react-datepicker__input-container input:focus {
          outline: none !important;
          ring: 2px !important;
          ring-offset: 2px !important;
          ring-color: rgb(147, 51, 234) !important;
          border-color: rgb(147, 51, 234) !important;
        }

        /* Popper Styles */
        .react-datepicker-popper {
          z-index: 50 !important;
        }

        /* Month Header Styles */
        .react-datepicker__current-month {
          background: linear-gradient(to right, rgb(147, 51, 234), rgb(129, 140, 248)) !important;
          -webkit-background-clip: text !important;
          background-clip: text !important;
          color: transparent !important;
          font-weight: 600 !important;
          font-size: 1rem !important;
          line-height: 1.5rem !important;
          margin-bottom: 0.5rem !important;
        }

        .dark .react-datepicker__current-month {
          opacity: 0.9 !important;
        }
      `}</style>
    </Dialog>
  );
} 