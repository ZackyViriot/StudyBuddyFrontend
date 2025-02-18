'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Team } from '@/types/team';
import { User } from '@/types/user';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Target as Goal, Calendar, Settings, CheckCircle2, Clock, AlertCircle, Plus, ChartBar, Trophy, Rocket, ArrowUpRight, ChevronLeft, ChevronRight, Check, CalendarDays, MessageSquare } from 'lucide-react';
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
import { ChatContainer } from '@/components/Chat/ChatContainer';

interface TeamPageClientProps {
  teamId: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      when: "beforeChildren",
      duration: 0.5
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
      damping: 15,
      duration: 0.5
    }
  }
};

const cardHoverVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.02,
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
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

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
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
      
      const response = await fetch(`${config.API_URL}/api/teams/${teamId}`, {
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
    // Scroll to top when page loads
    window.scrollTo(0, 0);
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

  // Add this helper function near the top of the component
  const getUserData = () => {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (error) {
      console.error('Error parsing user data:', error);
      return {};
    }
  };

  // Replace the isAdmin check with this
  const isAdmin = React.useMemo(() => {
    const userData = getUserData();
    return (
      team?.createdBy?._id === userData._id ||
      team?.members?.some(
        (m) => m.userId._id === userData._id && m.role === 'admin'
      )
    );
  }, [team]);

  const renderContent = () => {
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

    if (error) {
      return <div>Error: {error}</div>;
    }

    if (!team) {
      return <div>Team not found or you don't have access</div>;
    }

    return (
      <>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-10"
        >
          {/* Header Section */}
          <motion.div 
            variants={itemVariants} 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <Avatar className="h-20 w-20 border-4 border-white dark:border-gray-700 shadow-2xl">
                  <AvatarImage src={team.createdBy?.profilePicture} />
                  <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-2xl">
                    {team.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                    {team.name}
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 text-lg mt-2">{team.description}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            <motion.div 
              variants={itemVariants}
              whileHover="hover"
              initial="initial"
              animate="visible"
            >
              <Card className="relative overflow-hidden bg-white dark:bg-gray-800 border-none shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
                <CardHeader className="pb-2 relative">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300">Team Members</CardTitle>
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                      <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative pt-4">
                  <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">{team.members.length}</div>
                  <p className="text-base text-gray-500 dark:text-gray-400 mt-2">Active contributors</p>
                  <div className="absolute bottom-0 right-0 h-32 w-32 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full transform translate-x-16 translate-y-16" />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              whileHover="hover"
              initial="initial"
              animate="visible"
            >
              <Card className="relative overflow-hidden bg-white dark:bg-gray-800 border-none shadow-xl hover:shadow-2xl hover:shadow-green-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10" />
                <CardHeader className="pb-2 relative">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300">Completed Tasks</CardTitle>
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                      <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative pt-4">
                  <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">{getCompletedTasksCount()}</div>
                  <p className="text-base text-gray-500 dark:text-gray-400 mt-2">Tasks finished</p>
                  <div className="absolute bottom-0 right-0 h-32 w-32 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-full transform translate-x-16 translate-y-16" />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              whileHover="hover"
              initial="initial"
              animate="visible"
            >
              <Card className="relative overflow-hidden bg-white dark:bg-gray-800 border-none shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
                <CardHeader className="pb-2 relative">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300">Team Progress</CardTitle>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                      <ChartBar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative pt-4">
                  <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">{getTeamProgress()}%</div>
                  <Progress 
                    value={getTeamProgress()} 
                    className="mt-4 h-2 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500 bg-purple-100 dark:bg-purple-950/20"
                  />
                  <div className="absolute bottom-0 right-0 h-32 w-32 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full transform translate-x-16 translate-y-16" />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              whileHover="hover"
              initial="initial"
              animate="visible"
            >
              <Card className="relative overflow-hidden bg-white dark:bg-gray-800 border-none shadow-xl hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10" />
                <CardHeader className="pb-2 relative">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-700 dark:text-gray-300">Upcoming Deadlines</CardTitle>
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                      <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative pt-4">
                  <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">{getUpcomingDeadlines()}</div>
                  <p className="text-base text-gray-500 dark:text-gray-400 mt-2">Due this week</p>
                  <div className="absolute bottom-0 right-0 h-32 w-32 bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-full transform translate-x-16 translate-y-16" />
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Main Content Grid */}
          {/* Calendar Section - Full Width */}
          <motion.div variants={itemVariants}>
            <Card className="bg-white dark:bg-gray-800 shadow-xl border-none h-[700px] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1">
              <CardHeader className="border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800 dark:to-gray-800/50 p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10">
                    <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold">Team Calendar</CardTitle>
                    <CardDescription className="text-base">Schedule and deadlines</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[550px]">
                  <BigCalendar
                    localizer={localizer}
                    events={team.tasks
                      .filter(task => {
                        // Check if this is actually a task object
                        if (!task || typeof task !== 'object') {
                          console.warn('Invalid task object:', task);
                          return false;
                        }
                        
                        // Verify this is a task, not a team
                        if ('members' in task || !('title' in task)) {
                          console.warn('Object appears to be a team, not a task:', task);
                          return false;
                        }

                        if (!task._id) {
                          console.warn('Task missing _id:', task);
                          return false;
                        }
                        
                        if (!task.dueDate) {
                          console.warn('Task missing dueDate:', task);
                          return false;
                        }

                        try {
                          const dueDate = new Date(task.dueDate);
                          if (isNaN(dueDate.getTime())) {
                            console.warn('Task has invalid dueDate:', task);
                            return false;
                          }
                          return true;
                        } catch (error) {
                          console.warn('Error parsing task dueDate:', task, error);
                          return false;
                        }
                      })
                      .map(task => {
                        const dueDate = new Date(task.dueDate);
                        return {
                          id: task._id,
                          title: task.title,
                          start: dueDate,
                          end: dueDate,
                          allDay: true,
                          resource: task
                        } as CalendarEvent;
                      })}
                    views={['month', 'week', 'day']}
                    defaultView="month"
                    view={view}
                    date={date}
                    onNavigate={(newDate) => {
                      setDate(newDate);
                    }}
                    onView={(newView) => {
                      setView(newView);
                    }}
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
                    className="rounded-xl calendar-modern"
                    popup
                    selectable
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Tasks Section */}
            <motion.div variants={itemVariants}>
              <Card className="bg-white dark:bg-gray-800 shadow-xl border-none h-[600px] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/10 hover:-translate-y-1">
                <CardHeader className="border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800 dark:to-gray-800/50 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10">
                        <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-semibold">Tasks</CardTitle>
                        <CardDescription className="text-base">Track team progress</CardDescription>
                      </div>
                    </div>
                    <Button
                      onClick={() => setIsAddTaskOpen(true)}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Task
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 overflow-y-auto h-[calc(100%-5rem)]">
                  <div className="space-y-4">
                    {team.tasks
                      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                      .map((task) => (
                        <motion.div
                          key={task._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.02, y: -2 }}
                          onClick={() => handleTaskClick(task)}
                          className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "p-3 rounded-xl",
                                task.status === 'completed' ? "bg-green-100 dark:bg-green-900/20" :
                                task.status === 'in_progress' ? "bg-blue-100 dark:bg-blue-900/20" :
                                "bg-yellow-100 dark:bg-yellow-900/20"
                              )}>
                                {task.status === 'completed' ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                ) : task.status === 'in_progress' ? (
                                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                ) : (
                                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                )}
                              </div>
                              <div>
                                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">{task.title}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "px-4 py-1.5 text-sm font-medium rounded-lg",
                                task.status === 'completed' ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" :
                                task.status === 'in_progress' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" :
                                "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
                              )}
                            >
                              {task.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Team Members Section */}
            <motion.div variants={itemVariants}>
              <Card className="bg-white dark:bg-gray-800 shadow-xl border-none h-[600px] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1">
                <CardHeader className="border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800 dark:to-gray-800/50 p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
                      <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold">Team Members</CardTitle>
                      <CardDescription className="text-base">Active contributors</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 overflow-y-auto h-[calc(100%-5rem)]">
                  <TeamMembersList team={team} currentUserId={JSON.parse(localStorage.getItem('user') || '{}')._id || ''} />
                </CardContent>
              </Card>
            </motion.div>

            {/* Goals Section */}
            <motion.div variants={itemVariants}>
              <Card className="bg-white dark:bg-gray-800 shadow-xl border-none h-[600px] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1">
                <CardHeader className="border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800 dark:to-gray-800/50 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
                        <Goal className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-semibold">Team Goals</CardTitle>
                        <CardDescription className="text-base">Track team objectives</CardDescription>
                      </div>
                    </div>
                    <Button
                      onClick={() => setIsAddGoalOpen(true)}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Goal
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 overflow-y-auto h-[calc(100%-5rem)]">
                  <TeamGoalsList 
                    team={team} 
                    currentUserId={JSON.parse(localStorage.getItem('user') || '{}')._id || ''} 
                    onAddGoalClick={() => setIsAddGoalOpen(true)}
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Chat Section */}
            <motion.div variants={itemVariants}>
              <Card className="bg-white dark:bg-gray-800 shadow-xl border-none h-[600px] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1">
                <CardHeader className="border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800 dark:to-gray-800/50 p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
                      <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold">Team Chat</CardTitle>
                      <CardDescription className="text-base">Communicate with your team members in real-time</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 h-[calc(100%-5rem)]">
                  <ChatContainer roomId={team._id} roomType="team" />
                </CardContent>
              </Card>
            </motion.div>
          </div>
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
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onTaskUpdate={(updatedTask) => {
            if (updatedTask._id) {
              handleTaskStatusUpdate(updatedTask._id, updatedTask.status);
            }
          }}
        />

        <MemberProfileDialog
          member={selectedMember}
          isOpen={!!selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-6 py-8 font-outfit">
        {renderContent()}
      </div>
    </div>
  );
}

<style jsx global>{`
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

  .font-outfit {
    font-family: 'Outfit', sans-serif;
  }

  .calendar-modern {
    font-family: 'Outfit', sans-serif !important;
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