'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

interface CreateStudyGroupFormProps {
  onSubmit: (data: any) => void;
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
  { value: 'online', label: 'Online' },
  { value: 'in-person', label: 'In Person' },
  { value: 'hybrid', label: 'Hybrid' },
];

export function CreateStudyGroupForm({ onSubmit }: CreateStudyGroupFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  const meetingType = watch('meetingType');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const handleDayToggle = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  };

  const onFormSubmit = (data: any) => {
    const formData = {
      ...data,
      meetingDays: selectedDays,
    };
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Group Name
        </label>
        <input
          {...register('name', { required: 'Group name is required' })}
          type="text"
          id="name"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Enter group name"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message as string}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Meeting Type
        </label>
        <select
          {...register('meetingType', { required: 'Meeting type is required' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="">Select a meeting type</option>
          {MEETING_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {errors.meetingType && (
          <p className="mt-1 text-sm text-red-600">{errors.meetingType.message as string}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Meeting Days
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => handleDayToggle(day)}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                selectedDays.includes(day)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-200'
              } hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {day}
            </button>
          ))}
        </div>
        {selectedDays.length === 0 && (
          <p className="mt-1 text-sm text-red-600">Please select at least one day</p>
        )}
      </div>

      <div>
        <label htmlFor="meetingLocation" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Meeting Location
        </label>
        <input
          {...register('meetingLocation', { required: 'Meeting location is required' })}
          type="text"
          id="meetingLocation"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder={meetingType === 'online' ? 'Enter meeting link' : 'Enter meeting location'}
        />
        {errors.meetingLocation && (
          <p className="mt-1 text-sm text-red-600">{errors.meetingLocation.message as string}</p>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="submit"
          disabled={selectedDays.length === 0}
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Group
        </button>
      </div>
    </form>
  );
} 