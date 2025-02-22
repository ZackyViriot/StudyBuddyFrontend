import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
import { Users, Target, Calendar, X, Plus, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { config } from '@/config';
import { Team } from '@/types/team';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

interface Goal {
  title: string;
  description?: string;
  targetDate: Date;
  status: 'active' | 'achieved';
}

interface CreateTeamFormData {
  name: string;
  description: string;
  goals: Goal[];
  tasks: any[]; // Adding empty tasks array to satisfy backend
  members?: Array<{
    userId: string;
    role: 'admin' | 'moderator' | 'member';
  }>;
}

interface CreateTeamDialogProps {
  onCreateTeam: (team: Team) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CreateTeamResponse {
  _id: string;
  name: string;
  goals: Array<{
    title: string;
    description: string;
    targetDate: Date;
    status: 'active' | 'achieved';
  }>;
  members: Array<{
    userId: {
      _id: string;
      firstname: string;
      lastname: string;
      email: string;
      profilePicture: string;
    };
    role: string;
  }>;
  tasks: Array<{ _id: string; title: string; status: string; dueDate: string }>;
  createdBy: {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
    profilePicture: string;
  };
}

export const CreateTeamDialog: React.FC<CreateTeamDialogProps> = ({ 
  onCreateTeam, 
  isOpen, 
  onOpenChange 
}) => {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<CreateTeamFormData>({
    defaultValues: {
      name: '',
      description: '',
      goals: [],
      tasks: []
    }
  });

  const [goalDates, setGoalDates] = React.useState<{ [key: number]: Date }>({});
  const goals = watch('goals');
  const [teamName, setTeamName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addGoal = () => {
    const newGoal: Goal = {
      title: '',
      description: '',
      targetDate: new Date(),
      status: 'active'
    };
    setValue('goals', [...goals, newGoal]);
  };

  const removeGoal = (index: number) => {
    const newGoals = goals.filter((_, i) => i !== index);
    setValue('goals', newGoals);
    const newGoalDates = { ...goalDates };
    delete newGoalDates[index];
    setGoalDates(newGoalDates);
  };

  const generateJoinCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  };

  const handleSubmitForm = async (formData: CreateTeamFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const formattedGoals = formData.goals.map(goal => ({
        title: goal.title,
        description: goal.description || '',
        targetDate: goal.targetDate,
        status: 'active' as const
      }));

      const teamData = {
        name: formData.name,
        description: formData.description,
        createdBy: localStorage.getItem('userId'),
        goals: formattedGoals,
        tasks: [],
        joinCode: generateJoinCode(),
        members: [{
          userId: localStorage.getItem('userId'),
          role: 'admin' as const
        }]
      };
      
      const response = await fetch(`${config.API_URL}/api/teams`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create team');
      }

      const responseData = await response.json();
      onCreateTeam(responseData);
      reset();
      onOpenChange(false);
      setTeamName('');
    } catch (error) {
      console.error('Error creating team:', error);
      setError(error instanceof Error ? error.message : 'Failed to create team');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
          Create New Team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-white dark:bg-gray-800/95 dark:backdrop-blur-xl border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
            Create New Team
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-6">
          {/* Team Details Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Users className="h-5 w-5" />
              <h3 className="font-semibold">Team Details</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Team Name
                </Label>
                <Input
                  {...register('name', { required: 'Team name is required' })}
                  type="text"
                  id="name"
                  placeholder="Enter a memorable name for your team"
                  className="w-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Team Description
                </Label>
                <Textarea
                  {...register('description', { required: 'Team description is required' })}
                  id="description"
                  placeholder="Describe the purpose and goals of your team"
                  className="w-full h-24 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Goals Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Target className="h-5 w-5" />
                <h3 className="font-semibold">Team Goals (Optional)</h3>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addGoal}
                className="bg-white dark:bg-gray-800 border-gray-200 hover:border-indigo-300 dark:border-gray-700 dark:hover:border-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Goal
              </Button>
            </div>
            
            <div className="space-y-3">
              {goals.map((goal, index) => (
                <div 
                  key={index} 
                  className="relative p-4 rounded-lg bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <button
                    type="button"
                    onClick={() => removeGoal(index)}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Goal Title
                      </Label>
                      <Input
                        placeholder="What do you want to achieve?"
                        {...register(`goals.${index}.title` as const)}
                        className="mt-1 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Description
                      </Label>
                      <Textarea
                        placeholder="Describe your goal in detail..."
                        {...register(`goals.${index}.description` as const)}
                        className="mt-1 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Target Date
                      </Label>
                      <div className="relative">
                        <DatePicker
                          selected={goalDates[index]}
                          onChange={(date: Date | null) => {
                            if (date) {
                              setGoalDates(prev => ({ ...prev, [index]: date }));
                              const updatedGoals = [...goals];
                              updatedGoals[index] = { ...updatedGoals[index], targetDate: date };
                              setValue('goals', updatedGoals);
                            }
                          }}
                          showTimeSelect
                          timeFormat="h:mm aa"
                          timeIntervals={30}
                          timeCaption="Time"
                          dateFormat="MMM d, yyyy h:mm aa"
                          placeholderText="Select date and time"
                          required
                          calendarClassName="!bg-white dark:!bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl rounded-lg"
                          popperClassName="date-picker-popper"
                          customInput={
                            <div className="relative w-full">
                              <Input
                                value={goalDates[index] ? format(goalDates[index], 'MMM d, yyyy h:mm aa') : ''}
                                readOnly
                                placeholder="Select date and time"
                                className="cursor-pointer bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 pl-10 pr-10 truncate text-gray-900 dark:text-gray-100"
                              />
                              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                                <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              </div>
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              </div>
                            </div>
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting || isLoading} 
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'Create Team'}
          </Button>
        </form>
        {error && (
          <p className="text-sm text-red-500 mt-2">{error}</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

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
    background-color: rgb(17 24 39) !important;
    border-color: rgb(55 65 81) !important;
  }

  .react-datepicker__header {
    background-color: rgb(249 250 251) !important;
    border-bottom: 1px solid rgb(229 231 235) !important;
    padding: 1rem !important;
  }

  .dark .react-datepicker__header {
    background-color: rgb(17 24 39) !important;
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
    background-color: rgb(17 24 39) !important;
  }

  .react-datepicker__time-box {
    background-color: white !important;
  }

  .dark .react-datepicker__time-box {
    background-color: rgb(17 24 39) !important;
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
    background-color: rgb(17 24 39) !important;
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
    background-color: rgb(17 24 39) !important;
  }

  .react-datepicker__header--time {
    background-color: white !important;
    border-bottom: 1px solid rgb(229 231 235) !important;
  }

  .dark .react-datepicker__header--time {
    background-color: rgb(17 24 39) !important;
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