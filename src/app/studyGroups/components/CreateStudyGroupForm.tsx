'use client';

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Button } from '@/app/userProfile/components/ui/button';
import { Input } from '@/app/userProfile/components/ui/input';
import { Label } from '@/app/userProfile/components/ui/label';
import { Textarea } from '@/app/userProfile/components/ui/textarea';
import { Users, Calendar, MapPin } from 'lucide-react';

interface FormData {
  name: string;
  description: string;
  meetingType: string;
  meetingDays: string[];
  meetingLocation: string;
  meetingTime: string;
}

interface CreateStudyGroupFormProps {
  onSubmit: (data: FormData) => void;
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const MEETING_TYPES = [
  { value: 'online', label: 'Online', icon: '🌐' },
  { value: 'in-person', label: 'In Person', icon: '🏛️' },
  { value: 'hybrid', label: 'Hybrid', icon: '🔄' },
];

export function CreateStudyGroupForm({ onSubmit }: CreateStudyGroupFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<FormData>();

  const meetingType = watch('meetingType');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const handleDayToggle = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  };

  const onFormSubmit: SubmitHandler<FormData> = (data) => {
    const formData = {
      ...data,
      meetingDays: selectedDays,
    };
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Group Name Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <Users className="h-5 w-5" />
          <h3 className="font-semibold">Group Details</h3>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Group Name
          </Label>
          <Input
            {...register('name', { required: 'Group name is required' })}
            type="text"
            id="name"
            placeholder="Enter a memorable name for your study group"
            className="w-full"
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Group Description
          </Label>
          <Textarea
            {...register('description', { required: 'Group description is required' })}
            id="description"
            placeholder="Describe the purpose and goals of your study group"
            className="w-full h-24"
          />
          {errors.description && (
            <p className="text-sm text-red-500 mt-1">{errors.description.message as string}</p>
          )}
        </div>
      </div>

      {/* Meeting Type Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <MapPin className="h-5 w-5" />
          <h3 className="font-semibold">Meeting Format</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {MEETING_TYPES.map((type) => (
            <label
              key={type.value}
              className={`
                relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer
                transition-all duration-200
                ${watch('meetingType') === type.value 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800'
                }
              `}
            >
              <input
                type="radio"
                {...register('meetingType', { required: 'Please select a meeting type' })}
                value={type.value}
                className="sr-only"
              />
              <span className="text-2xl">{type.icon}</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{type.label}</span>
            </label>
          ))}
        </div>
        {errors.meetingType && (
          <p className="text-sm text-red-500 mt-1">{errors.meetingType.message as string}</p>
        )}
      </div>

      {/* Meeting Schedule Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <Calendar className="h-5 w-5" />
          <h3 className="font-semibold">Meeting Schedule</h3>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Meeting Days
            </Label>
            <div className="grid grid-cols-7 gap-2 mt-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayToggle(day)}
                  className={`
                    p-2 text-sm font-medium rounded-md transition-all duration-200
                    ${selectedDays.includes(day)
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
            {selectedDays.length === 0 && (
              <p className="text-sm text-red-500 mt-1">Please select at least one day</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetingTime" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Meeting Time
            </Label>
            <Input
              {...register('meetingTime', { required: 'Meeting time is required' })}
              type="time"
              id="meetingTime"
              className="w-full"
            />
            {errors.meetingTime && (
              <p className="text-sm text-red-500 mt-1">{errors.meetingTime.message as string}</p>
            )}
          </div>
        </div>
      </div>

      {/* Meeting Location Section */}
      <div className="space-y-2">
        <Label htmlFor="meetingLocation" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {meetingType === 'online' ? 'Meeting Link' : 'Meeting Location'}
        </Label>
        <Input
          {...register('meetingLocation', { required: 'Meeting location is required' })}
          type="text"
          id="meetingLocation"
          placeholder={meetingType === 'online' 
            ? 'Enter the virtual meeting link (e.g., Zoom, Teams)' 
            : 'Enter the physical meeting location'
          }
          className="w-full"
        />
        {errors.meetingLocation && (
          <p className="text-sm text-red-500 mt-1">{errors.meetingLocation.message as string}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={selectedDays.length === 0 || isSubmitting}
          className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Creating...' : 'Create Study Group'}
        </Button>
      </div>
    </form>
  );
} 