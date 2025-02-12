'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Team } from '@/types/team';
import { User } from '@/types/user';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Target, Calendar, Settings, CheckCircle2, Clock, AlertCircle, Plus, ChartBar, Trophy, Rocket, ArrowUpRight, ChevronLeft, ChevronRight, Check, CalendarDays } from 'lucide-react';
import { TeamMembersList } from '../components/TeamMembersList';
import { TeamGoalsList } from '../components/TeamGoalsList';
import { TeamSettings } from '../components/TeamSettings';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { AddTaskDialog } from '../components/AddTaskDialog';
import { AddGoalDialog } from '../components/AddGoalDialog';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Calendar as BigCalendar, dateFnsLocalizer, Event, View } from 'react-big-calendar';
import { parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { cn } from '@/lib/utils';
import { config } from '@/config';
import { TaskDetailsDialog } from '../components/TaskDetailsDialog';
import { MemberProfileDialog } from '../components/MemberProfileDialog';

interface TeamPageClientProps {
  teamId: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      when: "beforeChildren"
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

const cardHoverVariants = {
  hover: {
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 20
    }
  }
};

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent extends Event {
  id: string;
  resource: any;
}

interface CalendarEventProps {
  event: CalendarEvent;
  title: string;
}

const formatDate = (dateString: string | Date | undefined) => {
  try {
    if (!dateString) {
      return 'No date';
    }
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return format(date, 'MMM d');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

export function TeamPageClient({ teamId }: TeamPageClientProps) {
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [isMemberProfileOpen, setIsMemberProfileOpen] = useState(false);

  const fetchTeam = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token available');
        router.push('/auth/signin?callbackUrl=' + encodeURIComponent(`/teams/${teamId}`));
        setIsLoading(false);
        return;
      }

      console.log('Making request with token');
      
      const response = await fetch(`${config.API_URL}/teams/${teamId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Response not OK:', response.status, errorText);
        if (response.status === 431) {
          console.error('Request header too large');
          // Handle token refresh or re-authentication here if needed
          router.push('/auth/signin');
          return;
        }
        throw new Error(`Failed to fetch team: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Team data received:', data);

      // Check if the user is a member of the team
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const isMember = data.members.some((member: { userId: { _id: string } }) => 
        member.userId._id === userData._id) || data.createdBy._id === userData._id;

      if (!isMember) {
        console.log('User is not a member of this team');
        setTeam(null);
      } else {
        setTeam(data);
      }
    } catch (error) {
      console.error('Error fetching team:', error);
      setTeam(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/signin?callbackUrl=' + encodeURIComponent(`/teams/${teamId}`));
      return;
    }
    fetchTeam();
  }, [teamId, router]);

  const getTaskStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'in_progress':
        return 'text-blue-600 dark:text-blue-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTaskStatusBg = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'in_progress':
        return 'bg-blue-50 dark:bg-blue-900/20';
      case 'pending':
        return 'bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getTaskIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
      default:
        return null;
    }
  };

  const handleAddTask = (newTask: any) => {
    if (team) {
      setTeam({
        ...team,
        tasks: [...team.tasks, newTask],
      });
    }
  };

  const handleAddGoal = (newGoal: any) => {
    if (team) {
      setTeam({
        ...team,
        goals: [...team.goals, newGoal],
      });
    }
  };

  // Add safe status check helper
  const getTaskStatus = (task: any) => {
    return task?.status?.toLowerCase() || 'pending';
  };

  // Update getCompletedTasksCount with null check
  const getCompletedTasksCount = () => {
    return team?.tasks?.filter(task => getTaskStatus(task) === 'completed').length || 0;
  };

  const getTeamProgress = () => {
    if (!team?.goals || team.goals.length === 0) return 0;
    
    const totalProgress = team.goals.reduce((sum, goal) => {
      // If goal is achieved, count as 100%, otherwise use progress value or 0
      const goalProgress = goal.status === 'achieved' ? 100 : (goal.progress || 0);
      return sum + goalProgress;
    }, 0);
    
    return Math.round(totalProgress / team.goals.length);
  };

  const getUpcomingDeadlines = () => {
    const today = new Date();
    return team?.tasks?.filter(task => {
      const dueDate = new Date(task.dueDate);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7 && getTaskStatus(task) !== 'completed';
    }).length || 0;
  };

  // Helper function to normalize assignedTo data
  const normalizeAssignedTo = (assignedTo: any): User[] => {
    if (!assignedTo) return [];
    
    // If it's an array, process each item
    if (Array.isArray(assignedTo)) {
      return assignedTo.filter(user => user).map(user => {
        // If it's already a populated user object
        if (user.firstname || user.lastname || user.email) {
          return user;
        }
        // If it's just an ID or unpopulated reference
        if (typeof user === 'string' || user._id) {
          const userId = typeof user === 'string' ? user : user._id;
          // Try to find the user in team members
          const teamMember = team?.members.find(m => m.userId._id === userId);
          return teamMember ? teamMember.userId : {
            _id: userId,
            firstname: 'Unknown',
            lastname: 'User',
            email: '',
            profilePicture: '',
            role: 'user'
          } as User;
        }
        return null;
      }).filter(Boolean) as User[];
    }
    
    // If it's a single user
    if (typeof assignedTo === 'string' || assignedTo._id) {
      const userId = typeof assignedTo === 'string' ? assignedTo : assignedTo._id;
      const teamMember = team?.members.find(m => m.userId._id === userId);
      return teamMember ? [teamMember.userId] : [{
        _id: userId,
        firstname: 'Unknown',
        lastname: 'User',
        email: '',
        profilePicture: '',
        role: 'user'
      } as User];
    }
    
    // If it's already a populated user object
    if (assignedTo.firstname || assignedTo.lastname || assignedTo.email) {
      return [assignedTo];
    }
    
    return [];
  };

  // Helper function to get user display name
  const getUserDisplayName = (user: any): string => {
    if (!user) return 'Unassigned';
    
    // Check for firstname and lastname
    if (user.firstname || user.lastname) {
      const fullName = [user.firstname, user.lastname].filter(Boolean).join(' ');
      if (fullName.trim()) return fullName;
    }
    
    // If we have an ID, try to find the user in team members
    if (user._id) {
      const teamMember = team?.members.find(m => m.userId._id === user._id);
      if (teamMember) {
        const memberName = [teamMember.userId.firstname, teamMember.userId.lastname].filter(Boolean).join(' ');
        if (memberName.trim()) return memberName;
      }
    }
    
    // Fallback to email if available
    if (user.email) return user.email;
    
    // Final fallback
    return 'Unknown User';
  };

  // Add this function to handle task updates
  const handleTaskUpdate = async (updatedTask: any) => {
    console.log('Task updated:', updatedTask);
    
    // First update the local state immediately for quick feedback
    setTeam(prevTeam => {
      if (!prevTeam) return null;
      return {
        ...prevTeam,
        tasks: prevTeam.tasks.map(task => 
          task._id === updatedTask._id ? updatedTask : task
        )
      };
    });

    // Close the task details dialog
    setIsTaskDetailsOpen(false);

    // Fetch fresh data from the server to ensure consistency
    await fetchTeam();
  };

  const handleTaskStatusUpdate = async (taskId: string, newStatus: 'completed' | 'in_progress' | 'pending') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${config.API_URL}/teams/${teamId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : null,
          progress: newStatus === 'completed' ? 100 : 50
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Task update failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Failed to update task status: ${response.status} - ${errorText}`);
      }

      const updatedTask = await response.json();
      
      // Update local state immediately
      setTeam(prevTeam => {
        if (!prevTeam) return null;
        const updatedTasks = prevTeam.tasks.map(task => 
          task._id === taskId 
            ? { 
                ...task, 
                status: newStatus, 
                completedAt: newStatus === 'completed' ? new Date().toISOString() : null,
                progress: newStatus === 'completed' ? 100 : 50
              } 
            : task
        );
        return {
          ...prevTeam,
          tasks: updatedTasks
        };
      });

      // Fetch fresh data to ensure consistency
      await fetchTeam();

    } catch (error) {
      console.error('Error updating task status:', error);
      // You might want to show a toast/notification to the user here
    }
  };

  // Add this function to handle task click
  const handleTaskClick = (task: any) => {
    console.log('Task clicked:', task);
    console.log('Task assignedTo:', task.assignedTo);
    setSelectedTask(task);
    setIsTaskDetailsOpen(true);
  };

  // Add this function to handle member click
  const handleMemberClick = (member: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!team) return;
    
    const memberStats = {
      completedTasks: team.tasks.filter(task => 
        task.status === 'completed' && 
        normalizeAssignedTo(task.assignedTo).some(u => u._id === member._id)
      ).length,
      totalTasks: team.tasks.filter(task =>
        normalizeAssignedTo(task.assignedTo).some(u => u._id === member._id)
      ).length,
      activeGoals: team.goals.filter(goal => goal.status === 'active').length,
    };
    setSelectedMember({ ...member, teamStats: memberStats });
    setIsMemberProfileOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="w-16 h-16 rounded-full border-4 border-indigo-600/20 border-t-indigo-600 animate-spin" />
        </motion.div>
      </div>
    );
  }

  if (!team) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center"
      >
        <div className="p-6 bg-white dark:bg-gray-800/90 rounded-2xl shadow-xl">
          <div className="text-5xl mb-6">🤔</div>
          <h3 className="text-2xl font-semibold mb-3">Team Not Found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">This team doesn't exist or you don't have access to it.</p>
          <Button 
            onClick={() => router.push('/teams')}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
          >
            Return to Teams
          </Button>
        </div>
      </motion.div>
    );
  }

  const myTasks = team.tasks.filter(task => {
    const assignedUsers = normalizeAssignedTo(task.assignedTo);
    const userId = JSON.parse(localStorage.getItem('user') || '{}')._id;
    return assignedUsers.some(user => user._id === userId);
  });

  const tasksByDate = team.tasks.reduce((acc, task) => {
    const date = new Date(task.dueDate).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(task);
    return acc;
  }, {} as Record<string, typeof team.tasks>);

  const isAdmin = team.createdBy._id === JSON.parse(localStorage.getItem('user') || '{}')._id || 
                 team.members.some(m => m.userId._id === JSON.parse(localStorage.getItem('user') || '{}')._id && m.role === 'admin');

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 px-4 sm:px-6 lg:px-8 max-w-[1800px] mx-auto py-4"
    >
      {/* Team Header Card - Make it more compact */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/5 dark:to-purple-500/5 backdrop-blur-sm border border-white/20 shadow-xl">
          <CardHeader className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-16 w-16 border-2 border-white dark:border-gray-800 shadow-xl">
                    <AvatarImage src={team.createdBy.profilePicture} />
                    <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xl">
                      {team.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-1 -right-1 bg-green-500 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800"
                  />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                    {team.name}
                  </CardTitle>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{team.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => setIsAddTaskOpen(true)}
                  size="sm"
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Task
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Statistics Cards - Make them more compact */}
      <motion.div 
        variants={itemVariants} 
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        <motion.div whileHover="hover" variants={cardHoverVariants}>
          <Card className="relative overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />
            <CardHeader className="pb-2 relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Team Members</CardTitle>
                <Users className="h-5 w-5 text-indigo-500" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{team.members.length}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Active contributors</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover="hover" variants={cardHoverVariants}>
          <Card className="relative overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5" />
            <CardHeader className="pb-2 relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed Tasks</CardTitle>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{getCompletedTasksCount()}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tasks finished</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover="hover" variants={cardHoverVariants}>
          <Card className="relative overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />
            <CardHeader className="pb-2 relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Team Progress</CardTitle>
                <ChartBar className="h-5 w-5 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{getTeamProgress()}%</div>
              <Progress 
                value={getTeamProgress()} 
                className="mt-2 h-1.5 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500 bg-purple-100 dark:bg-purple-950/20"
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover="hover" variants={cardHoverVariants}>
          <Card className="relative overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5" />
            <CardHeader className="pb-2 relative">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">Upcoming Deadlines</CardTitle>
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{getUpcomingDeadlines()}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Due this week</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Main Content Grid - Adjust spacing and layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Calendar Section - Make it larger */}
        <motion.div variants={itemVariants} className="xl:col-span-3">
          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 shadow-xl overflow-hidden">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800 p-4 bg-gradient-to-r from-purple-500/5 to-indigo-500/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
                    <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Team Calendar</CardTitle>
                    <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                      {format(selectedDate || new Date(), 'MMMM yyyy')}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  onClick={() => setIsAddTaskOpen(true)}
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Task
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden">
              <div className="h-[600px] relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-purple-500/10 dark:from-transparent dark:via-purple-900/5 dark:to-purple-900/10 pointer-events-none z-10" />
                <BigCalendar
                  localizer={localizer}
                  events={team.tasks.map(task => ({
                    id: task._id || `temp-${Math.random()}`,
                    title: task.title,
                    start: new Date(task.dueDate),
                    end: new Date(task.dueDate),
                    allDay: true,
                    resource: task
                  }))}
                  views={['month', 'week', 'day', 'agenda']}
                  view={view}
                  date={date}
                  onView={setView}
                  onNavigate={(newDate) => {
                    setDate(newDate);
                    setSelectedDate(newDate);
                  }}
                  defaultView="month"
                  step={60}
                  components={{
                    event: (props: CalendarEventProps) => (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        whileHover={{ 
                          scale: 1.02,
                          transition: { type: "spring", stiffness: 400 }
                        }}
                        className={`p-1.5 rounded-md text-sm ${
                          getTaskStatus(props.event.resource) === 'completed'
                            ? 'bg-green-500/20 text-green-700 dark:text-green-300'
                            : getTaskStatus(props.event.resource) === 'in_progress'
                            ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                            : 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300'
                        }`}
                      >
                        <div className="font-medium truncate text-xs">{props.title}</div>
                      </motion.div>
                    ),
                    dateCellWrapper: (props) => {
                      const hasEvents = team.tasks.some(task => {
                        const taskDate = new Date(task.dueDate);
                        return taskDate.toDateString() === props.value.toDateString();
                      });
                      const isSelected = selectedDate && props.value.toDateString() === selectedDate.toDateString();
                      return (
                        <motion.div
                          whileHover={{ 
                            backgroundColor: "rgba(147, 51, 234, 0.08)",
                            transition: { duration: 0.2 }
                          }}
                          className={`rbc-day-bg ${hasEvents ? 'has-events' : ''} ${isSelected ? 'is-selected' : ''}`}
                        >
                          {props.children}
                        </motion.div>
                      );
                    },
                    toolbar: (props) => (
                      <div className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => props.onNavigate('PREV')}
                              className="h-8 w-8 rounded-md bg-purple-100 dark:bg-purple-800/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-700/30"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="px-4 py-1.5 font-semibold text-sm text-purple-700 dark:text-purple-300 min-w-[140px] text-center">
                              {format(props.date, 'MMMM yyyy')}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => props.onNavigate('NEXT')}
                              className="h-8 w-8 rounded-md bg-purple-100 dark:bg-purple-800/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-700/30"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => props.onNavigate('TODAY')}
                            className="bg-purple-100 dark:bg-purple-800/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-700/30 font-medium rounded-lg"
                          >
                            Today
                          </Button>
                        </div>

                        <div className="flex items-center w-full sm:w-auto">
                          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-1 flex items-center gap-1 w-full sm:w-auto">
                            {['month', 'week', 'day'].map((viewName) => (
                              <Button
                                key={`calendar-view-${viewName}`}
                                variant={props.view === viewName ? "default" : "ghost"}
                                size="sm"
                                onClick={() => props.onView(viewName as View)}
                                className={cn(
                                  "text-sm font-medium flex-1 sm:flex-none px-4 rounded-md transition-all duration-200",
                                  props.view === viewName 
                                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm hover:from-purple-700 hover:to-indigo-700 border-0" 
                                    : "bg-purple-100 dark:bg-purple-800/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-700/30 border-0"
                                )}
                              >
                                {viewName.charAt(0).toUpperCase() + viewName.slice(1)}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  }}
                  onSelectEvent={(event: CalendarEvent) => {
                    setSelectedDate(event.start);
                  }}
                  onSelectSlot={({ start }: { start: Date }) => {
                    setSelectedDate(start);
                  }}
                  className="rounded-lg calendar-modern"
                  popup
                  selectable
                  style={{ height: '100%' }}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Column - Selected Day, Tasks and Team Members */}
        <motion.div variants={itemVariants} className="space-y-4">
          {/* Selected Day Tasks */}
          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 shadow-xl">
            <CardHeader className="p-3 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-purple-500/5 to-indigo-500/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
                    <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                      {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Today'}
                    </CardTitle>
                    <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedDate ? format(selectedDate, 'EEEE') : format(new Date(), 'EEEE')}
                    </CardDescription>
                  </div>
                </div>
                <Button 
                  onClick={() => setIsAddTaskOpen(true)}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 hover:bg-purple-500/10 hover:text-purple-600"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-2">
                {team.tasks
                  .filter(task => {
                    const taskDate = new Date(task.dueDate);
                    const compareDate = selectedDate || new Date();
                    return taskDate.toDateString() === compareDate.toDateString();
                  })
                  .map((task, index) => (
                    <div
                      key={`selected-${task._id}`}
                      onClick={() => handleTaskClick(task)}
                      className="p-4 rounded-lg border border-gray-100 dark:border-gray-700/50 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800/50 dark:to-gray-800/30 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">{task.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`${getTaskStatusColor(getTaskStatus(task))} text-xs px-1`}>
                            {task.status ? task.status.charAt(0).toUpperCase() + task.status.slice(1) : 'Pending'}
                          </Badge>
                          {task.status !== 'completed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (task._id) {
                                  handleTaskStatusUpdate(task._id, 'completed');
                                }
                              }}
                              className="hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`${getTaskStatusColor(getTaskStatus(task))} text-xs px-1`}>
                          {task.status ? task.status.charAt(0).toUpperCase() + task.status.slice(1) : 'Pending'}
                        </Badge>
                        <div className="flex flex-wrap items-center gap-1">
                          {normalizeAssignedTo(task.assignedTo).map((user, index) => (
                            <span 
                              key={`${task._id}-${user._id || index}`}
                              className="px-2 py-0.5 text-xs rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                              onClick={(e) => handleMemberClick(user, e)}
                            >
                              {getUserDisplayName(user)}
                            </span>
                          ))}
                        </div>
                      </div>
                      {task.progress !== undefined && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Progress: {task.progress}%
                        </div>
                      )}
                    </div>
                  ))}
                {team.tasks.filter(task => {
                  const taskDate = new Date(task.dueDate);
                  const compareDate = selectedDate || new Date();
                  return taskDate.toDateString() === compareDate.toDateString();
                }).length === 0 && (
                  <div className="text-center py-6">
                    <Calendar className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No tasks scheduled for this day</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Tasks */}
          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 shadow-xl">
            <CardHeader className="p-3 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 mb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
                    <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Active Tasks</CardTitle>
                    <CardDescription className="text-xs text-gray-500 dark:text-gray-400">In progress</CardDescription>
                  </div>
                </div>
                <Button 
                  onClick={() => setIsAddTaskOpen(true)}
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 hover:bg-purple-500/10 hover:text-purple-600"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="max-h-[300px] overflow-y-auto px-3 pb-3">
              <div className="space-y-2.5">
                <AnimatePresence mode="popLayout">
                  {team.tasks
                    .filter(task => task.status !== 'completed')
                    .map((task) => (
                      <motion.div
                        key={task._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => handleTaskClick(task)}
                        className="group relative overflow-hidden p-2.5 rounded-lg border bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 backdrop-blur-sm border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{task.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  variant="outline" 
                                  className={`${getTaskStatusColor(getTaskStatus(task))} text-[10px] px-1.5 py-0 rounded-full`}
                                >
                                  {task.status ? task.status.charAt(0).toUpperCase() + task.status.slice(1) : 'Pending'}
                                </Badge>
                                <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                                  <CalendarDays className="h-3 w-3" />
                                  {formatDate(task.dueDate)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex flex-wrap items-center gap-1">
                                {normalizeAssignedTo(task.assignedTo).slice(0, 3).map((user, index) => (
                                  <span 
                                    key={`${task._id}-${user._id || index}`}
                                    className="px-2 py-0.5 text-xs rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                                    onClick={(e) => handleMemberClick(user, e)}
                                  >
                                    {getUserDisplayName(user)}
                                  </span>
                                ))}
                                {normalizeAssignedTo(task.assignedTo).length > 3 && (
                                  <span className="px-2 py-0.5 text-xs rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                    +{normalizeAssignedTo(task.assignedTo).length - 3} more
                                  </span>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (task._id) {
                                    handleTaskStatusUpdate(task._id, 'completed');
                                  }
                                }}
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          {/* Team Members Quick View */}
          <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 shadow-xl">
            <CardHeader className="p-3 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-purple-500/5 to-indigo-500/5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Team Members</CardTitle>
                  <CardDescription className="text-xs text-gray-500 dark:text-gray-400">Active contributors</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="space-y-2">
                {team.members.slice(0, 5).map((member, index) => {
                  const memberStats = {
                    completedTasks: team.tasks.filter(task => 
                      task.status === 'completed' && 
                      normalizeAssignedTo(task.assignedTo).some(u => u._id === member.userId._id)
                    ).length,
                    totalTasks: team.tasks.filter(task =>
                      normalizeAssignedTo(task.assignedTo).some(u => u._id === member.userId._id)
                    ).length,
                    activeGoals: team.goals.filter(goal => goal.status === 'active').length,
                    recentActivity: team.tasks
                      .filter(task => normalizeAssignedTo(task.assignedTo).some(u => u._id === member.userId._id))
                      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
                      .slice(0, 3)
                      .map(task => ({
                        type: task.status === 'completed' ? 'completed' : 'updated',
                        task: task.title,
                        date: task.updatedAt || task.createdAt
                      }))
                  };

                  return (
                    <div 
                      key={`member-${member.userId._id}`} 
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-all duration-200"
                      onClick={() => {
                        setSelectedMember({
                          _id: member.userId._id,
                          name: member.userId.name,
                          email: member.userId.email,
                          profilePicture: member.userId.profilePicture,
                          role: member.role,
                          joinedAt: member.joinedAt || team.createdAt,
                          teamStats: memberStats
                        });
                        setIsMemberProfileOpen(true);
                      }}
                    >
                      <Avatar className="h-8 w-8 border-2 border-white dark:border-gray-800">
                        <AvatarImage src={member.userId.profilePicture} />
                        <AvatarFallback className="text-xs">
                          {((member.userId.name ?? (member.userId.firstname && member.userId.lastname ? `${member.userId.firstname} ${member.userId.lastname}` : '')) || '??').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{member.userId.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{member.role}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs Section */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="members" className="space-y-6">
          <TabsList className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 p-1 rounded-xl flex flex-wrap gap-2">
            <TabsTrigger value="members" className="flex-1 sm:flex-none data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg">
              <Users className="h-4 w-4 mr-2" />
              All Members
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex-1 sm:flex-none data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg">
              <Target className="h-4 w-4 mr-2" />
              Team Goals
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex-1 sm:flex-none data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              All Tasks
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="settings" className="flex-1 sm:flex-none data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="members">
            <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardContent className="p-6">
                <TeamMembersList team={team} currentUserId={JSON.parse(localStorage.getItem('user') || '{}')._id || ''} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals">
            <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardContent className="p-6">
                <TeamGoalsList 
                  team={team} 
                  currentUserId={JSON.parse(localStorage.getItem('user') || '{}')._id || ''} 
                  onAddGoalClick={() => setIsAddGoalOpen(true)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 shadow-xl">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Active Tasks Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
                          <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Active Tasks</h3>
                      </div>
                      <Button 
                        onClick={() => setIsAddTaskOpen(true)}
                        size="sm"
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Task
                      </Button>
                    </div>
                    <div className="grid gap-4">
                      {team.tasks
                        .filter(task => task.status !== 'completed')
                        .map((task) => (
                          <div
                            key={task._id}
                            onClick={() => handleTaskClick(task)}
                            className="group relative overflow-hidden p-2.5 rounded-lg border bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 backdrop-blur-sm border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{task.title}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge 
                                      variant="outline" 
                                      className={`${getTaskStatusColor(getTaskStatus(task))} text-[10px] px-1.5 py-0 rounded-full`}
                                    >
                                      {task.status ? task.status.charAt(0).toUpperCase() + task.status.slice(1) : 'Pending'}
                                    </Badge>
                                    <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                                      <CalendarDays className="h-3 w-3" />
                                      {formatDate(task.dueDate)}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex flex-wrap items-center gap-1">
                                    {normalizeAssignedTo(task.assignedTo).slice(0, 3).map((user, index) => (
                                      <span 
                                        key={`${task._id}-${user._id || index}`}
                                        className="px-2 py-0.5 text-xs rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                                        onClick={(e) => handleMemberClick(user, e)}
                                      >
                                        {getUserDisplayName(user)}
                                      </span>
                                    ))}
                                    {normalizeAssignedTo(task.assignedTo).length > 3 && (
                                      <span className="px-2 py-0.5 text-xs rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                        +{normalizeAssignedTo(task.assignedTo).length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Completed Tasks Section */}
                  <div>
                    <h3 className="text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">Completed Tasks</h3>
                    <div className="grid gap-4">
                      {team.tasks
                        .filter(task => task.status === 'completed')
                        .map((task) => (
                          <div
                            key={task._id}
                            onClick={() => handleTaskClick(task)}
                            className="p-4 rounded-lg border bg-green-50/50 dark:bg-green-900/20 hover:shadow-md transition-all duration-200 cursor-pointer"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-base mb-1">{task.title}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{task.description}</p>
                                <div className="flex items-center gap-3 flex-wrap">
                                  <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 text-xs">
                                    Completed
                                  </Badge>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Completed on: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {normalizeAssignedTo(task.assignedTo).map((user, index) => (
                                      <Avatar key={`${task._id}-${user._id || index}`} className="h-6 w-6 border-2 border-white dark:border-gray-800">
                                        <AvatarImage src={user.profilePicture} />
                                        <AvatarFallback>
                                          {((user.name ?? (user.firstname && user.lastname ? `${user.firstname} ${user.lastname}` : '')) || '??').substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isAdmin && (
            <TabsContent value="settings">
              <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-white/20 shadow-xl">
                <CardContent className="p-6">
                  <TeamSettings team={team} />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </motion.div>

      <AddTaskDialog
        team={team}
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onAddTask={handleAddTask}
      />

      <AddGoalDialog
        team={team}
        isOpen={isAddGoalOpen}
        onClose={() => setIsAddGoalOpen(false)}
        onAddGoal={handleAddGoal}
      />

      <TaskDetailsDialog
        isOpen={isTaskDetailsOpen}
        onClose={() => setIsTaskDetailsOpen(false)}
        task={selectedTask}
        onTaskUpdate={handleTaskUpdate}
      />

      <MemberProfileDialog
        isOpen={isMemberProfileOpen}
        onClose={() => setIsMemberProfileOpen(false)}
        member={selectedMember}
        teamStats={selectedMember?.teamStats}
      />
    </motion.div>
  );
}

<style jsx global>{`
  .calendar-modern {
    font-family: inherit !important;
    background: transparent !important;
  }

  /* Calendar Container */
  .rbc-calendar {
    font-family: inherit !important;
    background: transparent !important;
    border-radius: 0.75rem !important;
    overflow: hidden !important;
  }

  /* Day/Week View Styles */
  .rbc-time-view {
    background: transparent !important;
    border: none !important;
  }

  .rbc-time-header {
    border: none !important;
  }

  .rbc-time-content {
    border: none !important;
    background: transparent !important;
  }

  .dark .rbc-time-content {
    background: transparent !important;
  }

  .rbc-day-slot .rbc-time-slot {
    border: none !important;
    background: transparent !important;
  }

  .rbc-time-view .rbc-day-slot .rbc-time-slot {
    background: transparent !important;
  }

  .rbc-day-slot.rbc-today {
    background-color: transparent !important;
  }

  .rbc-day-slot .rbc-events-container {
    margin-right: 0 !important;
  }

  .rbc-current-time-indicator {
    background: linear-gradient(to right, rgb(147, 51, 234), rgb(168, 85, 247)) !important;
    height: 2px !important;
  }

  .rbc-time-view .rbc-header {
    border-bottom: 1px solid rgb(229 231 235) !important;
    background: transparent !important;
  }

  .dark .rbc-time-view .rbc-header {
    border-color: rgb(55 65 81) !important;
    background: transparent !important;
  }

  .rbc-time-view .rbc-allday-cell {
    background: transparent !important;
  }

  .rbc-time-view .rbc-today {
    background: transparent !important;
  }

  .rbc-time-view .rbc-time-header-cell.rbc-today {
    background: linear-gradient(to right, rgb(147, 51, 234), rgb(168, 85, 247)) !important;
    color: white !important;
    font-weight: 600 !important;
  }

  .rbc-time-content > * + * > * {
    border-left: 1px solid rgb(55 65 81) !important;
  }

  .rbc-timeslot-group {
    border-bottom: 1px solid rgb(229 231 235) !important;
    background: transparent !important;
  }

  .dark .rbc-timeslot-group {
    border-color: rgb(55 65 81) !important;
  }

  .rbc-time-gutter.rbc-time-column {
    background: transparent !important;
  }

  .rbc-day-slot.rbc-time-column {
    background: transparent !important;
  }

  .rbc-day-slot .rbc-event {
    border: none !important;
  }

  .rbc-day-bg.rbc-today {
    background-color: transparent !important;
  }

  .rbc-today {
    background-color: transparent !important;
  }

  .rbc-time-header-content {
    border-left: none !important;
    background: transparent !important;
  }

  .rbc-time-header-cell {
    background: transparent !important;
  }

  .rbc-time-slot {
    background: transparent !important;
  }
}
`}</style> 