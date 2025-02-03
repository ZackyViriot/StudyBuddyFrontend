import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { Textarea } from '@/components/ui/textarea';
import { Users, Target, Calendar, X, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface Goal {
  title: string;
  description?: string;
  targetDate: Date;
  status: 'active' | 'achieved';
}

interface Team {
  _id: string;
  name: string;
  description: string;
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
  goals?: Array<{
    title: string;
    description?: string;
    targetDate: Date;
    status: 'active' | 'achieved';
  }>;
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
  onCreateTeam: (data: Team) => void;
}

export const CreateTeamDialog: React.FC<CreateTeamDialogProps> = ({ onCreateTeam }) => {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<CreateTeamFormData>({
    defaultValues: {
      name: '',
      description: '',
      goals: [],
      tasks: [] // Initialize empty tasks array
    }
  });

  const [isOpen, setIsOpen] = React.useState(false);
  const [goalDates, setGoalDates] = React.useState<{ [key: number]: Date }>({});
  const goals = watch('goals');

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

  const onSubmit = async (data: CreateTeamFormData) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error('User ID not found');
      return;
    }

    const formattedGoals = data.goals.map(goal => ({
      title: goal.title,
      description: goal.description || '',
      targetDate: goal.targetDate,
      status: 'active' as const
    }));

    try {
      const teamData = {
        name: data.name,
        description: data.description,
        createdBy: userId,
        goals: formattedGoals,
        tasks: [],
        members: [{
          userId: userId,
          role: 'admin' as const
        }]
      };
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(teamData)
      });

      if (response.ok) {
        const result = await response.json();
        onCreateTeam(result);
        reset();
        setIsOpen(false);
      } else {
        console.error('Failed to create team');
      }
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "mt-1 w-full justify-start text-left font-normal",
                              "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
                              "hover:bg-gray-100 dark:hover:bg-gray-700",
                              "focus:ring-indigo-500 focus:border-indigo-500",
                              !goalDates[index] && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {goalDates[index] ? format(goalDates[index], "PPP") : <span>Select a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={goalDates[index]}
                            onSelect={(date) => {
                              if (date) {
                                setGoalDates(prev => ({ ...prev, [index]: date }));
                                setValue(`goals.${index}.targetDate` as const, date);
                              }
                            }}
                            initialFocus
                            className="rounded-md border border-gray-200 dark:border-gray-700"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Team'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 