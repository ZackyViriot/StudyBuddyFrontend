'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Target as Goal, Calendar, CheckCircle2, Clock, AlertCircle, Plus, ChartBar, MessageSquare, ChevronLeft, ChevronRight, CalendarDays, MapPin, Video, Users2, BookOpen, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Calendar as BigCalendar, dateFnsLocalizer, Event, View } from 'react-big-calendar';
import { parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { cn } from '@/lib/utils';
import { config } from '@/config';
import { TaskDetailsDialog } from '../../teams/components/TaskDetailsDialog';
import { AddTaskDialog } from '../../teams/components/AddTaskDialog';
import { AddGoalDialog } from '../../teams/components/AddGoalDialog';
import { ChatContainer } from '@/components/Chat/ChatContainer';
import { Navbar } from '@/app/(landing)/components/Navbar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

interface StudyGroupPageClientProps {
  groupId: string;
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
  initial: { 
    scale: 1,
    y: 0
  },
  hover: {
    scale: 1.02,
    y: -4,
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

interface UpdatedTask {
  _id: string;
  status: string;
}

interface GroupMember {
  userId: {
    _id: string;
    firstname: string;
    lastname: string;
    profilePicture: string;
  };
  role: string;
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

interface MeetingFormData {
  meetingType: string;
  meetingDays: string[];
  meetingLocation: string;
  startTime: string;
  endTime: string;
}

interface StudyMeeting {
  subject: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  meetingType: string;
}

const formatTime = (time: string) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return format(date, 'h:mm a'); // This will format time like "9:30 AM"
};

export function StudyGroupPageClient({ groupId }: StudyGroupPageClientProps) {
  const router = useRouter();
  const [group, setGroup] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [studySessions, setStudySessions] = useState<any[]>([]);
  const [isCreateMeetingOpen, setIsCreateMeetingOpen] = useState(false);
  const [selectedMeetingDays, setSelectedMeetingDays] = useState<string[]>([]);
  const [meetingFormData, setMeetingFormData] = useState<MeetingFormData>({
    meetingType: 'online',
    meetingDays: [],
    meetingLocation: '',
    startTime: '',
    endTime: '',
  });
  const [isAddMeetingDateOpen, setIsAddMeetingDateOpen] = useState(false);
  const [isAddMeetingOpen, setIsAddMeetingOpen] = useState(false);
  const [studyMeeting, setStudyMeeting] = useState<StudyMeeting>({
    subject: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    meetingType: 'online'
  });
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  const fetchGroup = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/signin?callbackUrl=' + encodeURIComponent(`/studyGroups/${groupId}`));
        return;
      }

      // First fetch the group data
      const groupResponse = await fetch(`${config.API_URL}/api/studyGroups/${groupId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!groupResponse.ok) {
        throw new Error('Failed to fetch study group');
      }

      const groupData = await groupResponse.json();
      groupData.tasks = groupData.tasks || [];
      groupData.goals = groupData.goals || [];
      setGroup(groupData);

      // Then fetch the meetings data
      try {
        const meetingsResponse = await fetch(`${config.API_URL}/api/studyGroups/${groupId}/meetings`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (meetingsResponse.ok) {
          const meetingsData = await meetingsResponse.json();
          setStudySessions(meetingsData);
        } else {
          console.error('Failed to fetch meetings');
          setStudySessions([]);
        }
      } catch (meetingsError) {
        console.error('Error fetching meetings:', meetingsError);
        setStudySessions([]);
      }
    } catch (error) {
      console.error('Error fetching study group:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch study group');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGroup();
  }, [groupId, router]);

  useEffect(() => {
    if (group) {
      setMeetingFormData({
        meetingType: group.meetingType || 'online',
        meetingDays: group.meetingDays || [],
        meetingLocation: group.meetingLocation || '',
        startTime: group.startTime || '',
        endTime: group.endTime || '',
      });
      setSelectedMeetingDays(group.meetingDays || []);
    }
  }, [group]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error</h2>
          <p className="text-gray-600 dark:text-gray-400">{error || 'Study group not found'}</p>
          <Button
            onClick={() => router.push('/studyGroups')}
            className="mt-4"
          >
            Back to Study Groups
          </Button>
        </div>
      </div>
    );
  }

  const tasks = group.tasks || [];
  const goals = group.goals || [];

  const getTaskStatus = (task: any) => {
    return task?.status?.toLowerCase() || 'pending';
  };

  const getCompletedTasksCount = () => {
    return tasks.filter((task: any) => getTaskStatus(task) === 'completed').length;
  };

  const getGroupProgress = () => {
    if (!goals.length) return 0;
    
    const totalProgress = goals.reduce((sum: number, goal: any) => {
      const goalProgress = goal.status === 'achieved' ? 100 : (goal.progress || 0);
      return sum + goalProgress;
    }, 0);
    
    return Math.round(totalProgress / goals.length);
  };

  const getUpcomingDeadlines = () => {
    const today = new Date();
    return tasks.filter((task: any) => {
      const dueDate = new Date(task.dueDate);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7 && getTaskStatus(task) !== 'completed';
    }).length;
  };

  const handleAddTask = (newTask: any) => {
    if (group) {
      setGroup({
        ...group,
        tasks: [...group.tasks, newTask],
      });
    }
  };

  const handleAddGoal = (newGoal: any) => {
    if (group) {
      setGroup({
        ...group,
        goals: [...group.goals, newGoal],
      });
    }
  };

  const handleTaskStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`${config.API_URL}/api/studyGroups/${groupId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : null,
          progress: newStatus === 'completed' ? 100 : 50
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      await fetchGroup();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleUpdateMeeting = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      // Validate the form data
      if (selectedMeetingDays.length === 0) {
        throw new Error('Please select at least one meeting day');
      }
      if (!meetingFormData.startTime) {
        throw new Error('Please set a start time');
      }
      if (!meetingFormData.endTime) {
        throw new Error('Please set an end time');
      }
      if (!meetingFormData.meetingLocation && meetingFormData.meetingType === 'online') {
        throw new Error('Please provide a meeting link for online meetings');
      }
      if (!meetingFormData.meetingLocation && meetingFormData.meetingType === 'in-person') {
        throw new Error('Please provide a location for in-person meetings');
      }

      const updateData = {
        meetingType: meetingFormData.meetingType,
        meetingDays: selectedMeetingDays,
        meetingLocation: meetingFormData.meetingLocation,
        startTime: meetingFormData.startTime,
        endTime: meetingFormData.endTime,
      };

      console.log('Current meeting details:', {
        type: group.meetingType,
        days: group.meetingDays,
        location: group.meetingLocation,
        startTime: group.startTime,
        endTime: group.endTime
      });
      console.log('Updating meeting schedule with data:', updateData);

      const response = await fetch(`${config.API_URL}/api/studyGroups/${groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        throw new Error(errorData.message || 'Failed to update meeting schedule');
      }

      const data = await response.json();
      console.log('Meeting schedule updated successfully. Server response:', data);

      // Verify the returned data has the expected fields
      if (!data.startTime || !data.endTime) {
        console.warn('Warning: Server response is missing time fields:', data);
      }

      // Show success message
      toast({
        title: 'Success',
        description: 'Meeting schedule has been updated',
        variant: 'default',
      });

      // Fetch the updated group data
      await fetchGroup();
      
      // Verify the group data after fetching
      console.log('Group data after update:', {
        startTime: group.startTime,
        endTime: group.endTime,
        meetingDays: group.meetingDays,
        meetingType: group.meetingType,
        meetingLocation: group.meetingLocation
      });

      setIsCreateMeetingOpen(false);
    } catch (error) {
      console.error('Error updating meeting schedule:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update meeting schedule',
        variant: 'destructive',
      });
    }
  };

  const getMeetingEvents = () => {
    if (!group.meetingDays || !group.startTime || !group.endTime) return [];
    
    const events: CalendarEvent[] = [];
    const currentDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3); // Show meetings for next 3 months
    
    while (currentDate <= endDate) {
      const dayName = format(currentDate, 'EEEE');
      if (group.meetingDays.includes(dayName)) {
        const [startHours, startMinutes] = group.startTime.split(':');
        const [endHours, endMinutes] = group.endTime.split(':');
        
        const startDate = new Date(currentDate);
        startDate.setHours(parseInt(startHours), parseInt(startMinutes), 0);
        
        const endDate = new Date(currentDate);
        endDate.setHours(parseInt(endHours), parseInt(endMinutes), 0);
        
        events.push({
          id: `meeting-${startDate.toISOString()}`,
          title: `${group.meetingType} Meeting`,
          start: startDate,
          end: endDate,
          allDay: false,
          resource: {
            type: 'meeting',
            location: group.meetingLocation,
            meetingType: group.meetingType,
            startTime: group.startTime,
            endTime: group.endTime,
            date: startDate,
            isRegularMeeting: true
          }
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return events;
  };

  const getStudySessionEvents = () => {
    if (!studySessions.length) return [];
    
    return studySessions.map(session => ({
      id: session._id,
      title: `${session.subject} (${session.meetingType})`,
      start: new Date(`${session.date}T${session.startTime}`),
      end: new Date(`${session.date}T${session.endTime}`),
      allDay: false,
      resource: {
        type: 'study-session',
        ...session
      }
    }));
  };

  const handleAddMeeting = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      // Validate required fields
      if (!studyMeeting.subject) throw new Error('Subject is required');
      if (!studyMeeting.date) throw new Error('Date is required');
      if (!studyMeeting.startTime) throw new Error('Start time is required');
      if (!studyMeeting.endTime) throw new Error('End time is required');
      if (!studyMeeting.location && studyMeeting.meetingType === 'online') throw new Error('Meeting link is required for online meetings');
      if (!studyMeeting.location && studyMeeting.meetingType === 'in-person') throw new Error('Location is required for in-person meetings');

      // Format the data
      const meetingData = {
        ...studyMeeting,
        date: new Date(studyMeeting.date).toISOString().split('T')[0],
        groupId: groupId,
      };

      const isEditing = !!editingSessionId;
      const url = isEditing 
        ? `${config.API_URL}/api/studyGroups/${groupId}/meetings/${editingSessionId}`
        : `${config.API_URL}/api/studyGroups/${groupId}/meetings`;

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(meetingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'add'} meeting`);
      }

      const data = await response.json();
      console.log(`Meeting ${isEditing ? 'updated' : 'added'} successfully:`, data);

      await fetchGroup();
      setIsAddMeetingOpen(false);
      setEditingSessionId(null);
      setStudyMeeting({
        subject: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        location: '',
        meetingType: 'online'
      });

      toast({
        title: 'Success',
        description: `Study session ${isEditing ? 'updated' : 'added'} successfully`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error handling meeting:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to handle meeting',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Navbar onLogin={() => {}} onSignup={() => {}} />
      <div className="container mx-auto px-4 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Header Section */}
          <motion.div variants={itemVariants}>
            <Card className="bg-white dark:bg-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border-none p-8 transition-all duration-300 hover:shadow-[0_20px_40px_rgb(147,51,234,0.1)] dark:hover:shadow-[0_20px_40px_rgb(147,51,234,0.2)] hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <Avatar className="h-20 w-20 border-4 border-white dark:border-gray-700 shadow-2xl">
                    <AvatarImage src={group.createdBy?.profilePicture} />
                    <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-2xl">
                      {group.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                      {group.name}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-lg mt-2">{group.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-lg">
                    <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      {group.members.length} Members
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Chat Section */}
          <motion.div variants={itemVariants}>
            <Card className="bg-white dark:bg-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border-none h-[calc(100vh-32rem)] overflow-hidden transition-all duration-300 hover:shadow-[0_20px_40px_rgb(147,51,234,0.1)] dark:hover:shadow-[0_20px_40px_rgb(147,51,234,0.2)] hover:-translate-y-1">
              <CardHeader className="border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800 dark:to-gray-800/50 p-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
                    <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold">Group Chat</CardTitle>
                    <CardDescription className="text-base">Communicate with your group members in real-time</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-4.5rem)]">
                <ChatContainer key={group._id} roomId={group._id} roomType="study-group" />
              </CardContent>
            </Card>
          </motion.div>

          {/* Calendar Section */}
          <motion.div variants={itemVariants}>
            <Card className="bg-white dark:bg-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border-none h-[700px] overflow-hidden transition-all duration-300 hover:shadow-[0_20px_40px_rgb(249,115,22,0.1)] dark:hover:shadow-[0_20px_40px_rgb(249,115,22,0.2)] hover:-translate-y-1">
              <CardHeader className="border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800 dark:to-gray-800/50 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10">
                      <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold">Group Calendar</CardTitle>
                      <CardDescription className="text-base">Meeting schedule and study sessions</CardDescription>
                    </div>
                  </div>
                  <Button
                    onClick={() => setIsAddMeetingOpen(true)}
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Study Session
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[550px]">
                  <BigCalendar
                    localizer={localizer}
                    events={[
                      ...getMeetingEvents(),
                      ...getStudySessionEvents(),
                      ...tasks.map((task: any) => ({
                        id: task._id,
                        title: task.title,
                        start: new Date(task.dueDate),
                        end: new Date(task.dueDate),
                        allDay: true,
                        resource: { type: 'task', ...task }
                      }))
                    ]}
                    views={['month', 'week', 'day']}
                    defaultView="month"
                    view={view}
                    date={date}
                    onNavigate={setDate}
                    onView={setView}
                    selectable
                    popup
                    className="rounded-xl calendar-modern"
                    onSelectEvent={(event: CalendarEvent) => {
                      if (event.resource.type === 'task') {
                        setSelectedTask(event.resource);
                      } else if (event.resource.type === 'meeting' || event.resource.type === 'study-session') {
                        setSelectedMeeting(event.resource);
                      }
                    }}
                    eventPropGetter={(event) => ({
                      className: cn(
                        'border-none rounded-lg shadow-md hover:shadow-lg transition-all duration-200',
                        {
                          'bg-gradient-to-r from-purple-600 to-indigo-600 text-white': event.resource.type === 'task',
                          'bg-gradient-to-r from-green-600 to-teal-600 text-white': event.resource.type === 'meeting',
                          'bg-gradient-to-r from-orange-600 to-red-600 text-white': event.resource.type === 'study-session',
                          'opacity-75': event.resource.type === 'task' && event.resource.status === 'completed',
                        }
                      ),
                    })}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Meeting Section */}
          <motion.div variants={itemVariants}>
            <Card className="group relative overflow-hidden border border-black/10 dark:border-none bg-gradient-to-br from-white to-gray-50/80 dark:from-gray-800 dark:to-gray-900/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:shadow-[0_20px_40px_rgb(99,102,241,0.15)] dark:hover:shadow-[0_20px_40px_rgb(99,102,241,0.25)] transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-blue-500/5 dark:from-purple-500/10 dark:via-indigo-500/10 dark:to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-sm" />
              <CardContent className="p-6 relative z-[1]">
                <div className="flex flex-col gap-6">
                  {/* Meeting Type and Location Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div 
                      onClick={() => setSelectedMeeting({
                        type: 'meeting-type',
                        meetingType: group.meetingType,
                        description: group.meetingType === 'online' 
                          ? 'Online meetings are conducted virtually through video conferencing.'
                          : group.meetingType === 'in-person'
                          ? 'In-person meetings are conducted face-to-face at a physical location.'
                          : 'Hybrid meetings offer both online and in-person attendance options.'
                      })}
                      className="flex items-start gap-4 bg-white dark:bg-transparent p-4 rounded-xl border border-black/5 dark:border-none hover:border-purple-500/20 dark:hover:bg-purple-500/5 transition-all duration-500 hover:shadow-lg hover:shadow-purple-500/10 group/item transform hover:-translate-y-1 cursor-pointer"
                    >
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 border border-black/5 dark:border-none group-hover/item:scale-110 group-hover/item:rotate-6 transition-all duration-500">
                        <Video className="h-5 w-5 text-purple-600 dark:text-purple-400 group-hover/item:animate-pulse" />
                      </div>
                      <div className="flex-1 min-w-0 group-hover/item:translate-x-2 transition-all duration-500">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Meeting Type</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 capitalize group-hover/item:text-purple-600 dark:group-hover/item:text-purple-400 transition-colors duration-300">{group.meetingType}</p>
                      </div>
                    </div>
                    
                    <div 
                      onClick={() => setSelectedMeeting({
                        type: 'location',
                        meetingType: group.meetingType,
                        location: group.meetingLocation,
                        description: group.meetingType === 'online'
                          ? 'Click to join the online meeting through the provided link.'
                          : 'Physical meeting location where the group gathers.'
                      })}
                      className="flex items-start gap-4 bg-white dark:bg-transparent p-4 rounded-xl border border-black/5 dark:border-none hover:border-blue-500/20 dark:hover:bg-blue-500/5 transition-all duration-500 hover:shadow-lg hover:shadow-blue-500/10 group/item transform hover:-translate-y-1 cursor-pointer"
                    >
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border border-black/5 dark:border-none group-hover/item:scale-110 group-hover/item:rotate-6 transition-all duration-500">
                        <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 group-hover/item:animate-pulse" />
                      </div>
                      <div className="flex-1 min-w-0 group-hover/item:translate-x-2 transition-all duration-500">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Location</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 break-all group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors duration-300">{group.meetingLocation}</p>
                      </div>
                    </div>
                  </div>

                  {/* Meeting Days and Time Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-gray-900/50 rounded-xl p-6 border border-black/5 dark:border-none transform hover:scale-[1.02] transition-all duration-500 hover:shadow-xl hover:shadow-indigo-500/10">
                    <div 
                      onClick={() => setSelectedMeeting({
                        type: 'meeting-days',
                        meetingDays: group.meetingDays,
                        description: 'Regular meeting schedule for the study group.',
                        isRegularMeeting: true
                      })}
                      className="flex items-start gap-4 bg-gray-50/80 dark:bg-gray-800/50 p-4 rounded-xl border border-black/5 dark:border-none group/days hover:bg-white dark:hover:bg-gray-800 transition-all duration-500 hover:shadow-lg hover:shadow-green-500/10 transform hover:-translate-y-1 cursor-pointer"
                    >
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-green-100 to-teal-100 dark:from-green-900/20 dark:to-teal-900/20 border border-black/5 dark:border-none group-hover/days:scale-110 group-hover/days:rotate-6 transition-all duration-500">
                        <Calendar className="h-5 w-5 text-green-600 dark:text-green-400 group-hover/days:animate-pulse" />
                      </div>
                      <div className="flex-1 min-w-0 group-hover/days:translate-x-2 transition-all duration-500">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Meeting Days</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {group.meetingDays.map((day: string) => (
                            <Badge
                              key={day}
                              className="bg-gradient-to-r from-green-100 to-teal-100 dark:from-green-900/30 dark:to-teal-900/30 text-green-700 dark:text-green-300 border border-green-600/10 dark:border-none hover:scale-110 hover:shadow-md hover:shadow-green-500/10 hover:border-green-500/20 transition-all duration-300 cursor-default"
                            >
                              {day}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div 
                      onClick={() => setSelectedMeeting({
                        type: 'meeting-time',
                        startTime: group.startTime,
                        endTime: group.endTime,
                        description: 'Regular meeting time slot.',
                        isRegularMeeting: true
                      })}
                      className="flex items-start gap-4 bg-gray-50/80 dark:bg-gray-800/50 p-4 rounded-xl border border-black/5 dark:border-none group/time hover:bg-white dark:hover:bg-gray-800 transition-all duration-500 hover:shadow-lg hover:shadow-orange-500/10 transform hover:-translate-y-1 cursor-pointer"
                    >
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 border border-black/5 dark:border-none group-hover/time:scale-110 group-hover/time:rotate-6 transition-all duration-500">
                        <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400 group-hover/time:animate-pulse" />
                      </div>
                      <div className="flex-1 min-w-0 group-hover/time:translate-x-2 transition-all duration-500">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Meeting Time</h3>
                        <div className="space-y-2 mt-2">
                          <div className="flex items-center gap-2 group/start hover:translate-x-1 transition-transform duration-300">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Start:</span>
                            <span className="text-sm text-gray-900 dark:text-gray-100 group-hover/time:text-orange-600 dark:group-hover/time:text-orange-400 transition-colors duration-300">{formatTime(group.startTime)}</span>
                          </div>
                          <div className="flex items-center gap-2 group/end hover:translate-x-1 transition-transform duration-300">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">End:</span>
                            <span className="text-sm text-gray-900 dark:text-gray-100 group-hover/time:text-orange-600 dark:group-hover/time:text-orange-400 transition-colors duration-300">{formatTime(group.endTime)}</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 group-hover/time:text-orange-500 dark:group-hover/time:text-orange-400 transition-colors duration-300">
                            Duration: {(() => {
                              if (!group.startTime || !group.endTime) return 'Not set';
                              const [startHours, startMinutes] = group.startTime.split(':');
                              const [endHours, endMinutes] = group.endTime.split(':');
                              const start = new Date(2000, 0, 1, parseInt(startHours), parseInt(startMinutes));
                              const end = new Date(2000, 0, 1, parseInt(endHours), parseInt(endMinutes));
                              const diff = (end.getTime() - start.getTime()) / (1000 * 60);
                              const hours = Math.floor(diff / 60);
                              const minutes = diff % 60;
                              return `${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m` : ''}`;
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Members Section */}
                  <div className="bg-white dark:bg-gray-900/50 rounded-xl p-6 border border-black/5 dark:border-none">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 border border-black/5 dark:border-none">
                        <Users2 className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Attending Members</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {group.members
                        .filter((member: GroupMember | null) => member?.userId)
                        .map((member: GroupMember) => {
                          const firstName = member.userId?.firstname || 'Unknown';
                          const lastName = member.userId?.lastname || 'User';
                          const initials = `${firstName[0]}${lastName[0]}`;
                          
                          return (
                            <div key={member.userId?._id || Math.random()} 
                              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/80 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 border border-black/5 dark:border-none hover:border-purple-500/20 hover:shadow-lg hover:shadow-purple-500/10 group/member">
                              <Avatar className="h-8 w-8 border-2 border-white dark:border-gray-700 shadow-sm group-hover/member:scale-110 transition-transform duration-300">
                                <AvatarImage src={member.userId?.profilePicture} />
                                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                                  {initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col min-w-0 group-hover/member:translate-x-1 transition-transform duration-300">
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {`${firstName} ${lastName}`}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                  {member.role || 'Member'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Study Sessions Section */}
          <motion.div variants={itemVariants}>
            <Card className="bg-white dark:bg-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border-none overflow-hidden transition-all duration-300 hover:shadow-[0_20px_40px_rgb(249,115,22,0.1)] dark:hover:shadow-[0_20px_40px_rgb(249,115,22,0.2)] hover:-translate-y-1">
              <CardHeader className="border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800 dark:to-gray-800/50 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10">
                      <BookOpen className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold">Study Sessions</CardTitle>
                      <CardDescription className="text-base">Manage your upcoming study sessions</CardDescription>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingSessionId(null);
                      setStudyMeeting({
                        subject: '',
                        description: '',
                        date: '',
                        startTime: '',
                        endTime: '',
                        location: '',
                        meetingType: 'online'
                      });
                      setIsAddMeetingOpen(true);
                    }}
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Session
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4">
                  {studySessions.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">No study sessions scheduled</p>
                      <Button
                        onClick={() => {
                          setEditingSessionId(null);
                          setStudyMeeting({
                            subject: '',
                            description: '',
                            date: '',
                            startTime: '',
                            endTime: '',
                            location: '',
                            meetingType: 'online'
                          });
                          setIsAddMeetingOpen(true);
                        }}
                        className="mt-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Schedule a Session
                      </Button>
                    </div>
                  ) : (
                    studySessions.map((session) => (
                      <Card
                        key={session._id}
                        className="group relative overflow-hidden border border-black/10 dark:border-none bg-gradient-to-br from-white to-gray-50/80 dark:from-gray-800 dark:to-gray-900/50 shadow-[0_4px_20px_rgb(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] hover:shadow-[0_20px_40px_rgb(249,115,22,0.15)] dark:hover:shadow-[0_20px_40px_rgb(249,115,22,0.25)] transition-all duration-500"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-red-500/5 to-purple-500/5 dark:from-orange-500/10 dark:via-red-500/10 dark:to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-sm" />
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-10">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingSessionId(session._id);
                              setStudyMeeting({
                                subject: session.subject,
                                description: session.description,
                                date: session.date,
                                startTime: session.startTime,
                                endTime: session.endTime,
                                location: session.location,
                                meetingType: session.meetingType
                              });
                              setIsAddMeetingOpen(true);
                            }}
                            className="h-8 w-8 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 shadow-lg backdrop-blur-lg rounded-full hover:scale-110 transition-transform duration-300"
                          >
                            <Pencil className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={async () => {
                              try {
                                const token = localStorage.getItem('token');
                                if (!token) throw new Error('No authentication token found');

                                const response = await fetch(`${config.API_URL}/api/studyGroups/${groupId}/meetings/${session._id}`, {
                                  method: 'DELETE',
                                  headers: {
                                    'Authorization': `Bearer ${token}`,
                                  },
                                });

                                if (!response.ok) {
                                  const errorData = await response.json();
                                  throw new Error(errorData.message || 'Failed to delete study session');
                                }

                                toast({
                                  title: 'Success',
                                  description: 'Study session deleted successfully',
                                  variant: 'default',
                                });

                                await fetchGroup();
                              } catch (error) {
                                console.error('Error deleting study session:', error);
                                toast({
                                  title: 'Error',
                                  description: error instanceof Error ? error.message : 'Failed to delete study session',
                                  variant: 'destructive',
                                  duration: 5000,
                                });
                              }
                            }}
                            className="h-8 w-8 bg-white/80 dark:bg-gray-800/80 hover:bg-red-50 dark:hover:bg-red-900/30 shadow-lg backdrop-blur-lg rounded-full hover:scale-110 hover:rotate-12 transition-all duration-300"
                          >
                            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </Button>
                        </div>
                        <CardContent className="p-6 relative z-[1]">
                          <div className="flex flex-col gap-6">
                            <div className="flex items-start gap-4 bg-white dark:bg-transparent p-4 rounded-xl border border-black/5 dark:border-none hover:border-orange-500/20 dark:hover:bg-orange-500/5 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10 group/item">
                              <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 border border-black/5 dark:border-none group-hover/item:scale-110 group-hover/item:rotate-3 transition-transform duration-300">
                                <BookOpen className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                              </div>
                              <div className="flex-1 min-w-0 group-hover/item:translate-x-1 transition-transform duration-300">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{session.subject}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{session.description}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center gap-3 bg-gray-50/80 dark:bg-gray-900/50 p-4 rounded-xl border border-black/5 dark:border-none">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border border-black/5 dark:border-none">
                                  <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Date</p>
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {format(new Date(session.date), 'PPP')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 bg-gray-50/80 dark:bg-gray-900/50 p-4 rounded-xl border border-black/5 dark:border-none">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border border-black/5 dark:border-none">
                                  <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Time</p>
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {`${format(new Date('2000-01-01T' + session.startTime), 'p')} - ${format(new Date('2000-01-01T' + session.endTime), 'p')}`}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 bg-gray-50/80 dark:bg-gray-900/50 p-4 rounded-xl border border-black/5 dark:border-none">
                              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20 border border-black/5 dark:border-none">
                                <MapPin className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Location</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {session.meetingType === 'online' ? 'Online Meeting' : 'In-Person'}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 break-all">{session.location}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* Task Details Dialog */}
      {selectedTask && (
        <TaskDetailsDialog
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
          onTaskUpdate={(updatedTask) => {
            if (updatedTask._id) {
              handleTaskStatusUpdate(updatedTask._id, updatedTask.status);
            }
          }}
        />
      )}

      {/* Add Task Dialog */}
      <AddTaskDialog
        team={group}
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        onAddTask={handleAddTask}
      />

      {/* Add Goal Dialog */}
      <AddGoalDialog
        team={group}
        isOpen={isAddGoalOpen}
        onClose={() => setIsAddGoalOpen(false)}
        onAddGoal={handleAddGoal}
      />

      {/* Add Meeting Dialog */}
      <Dialog open={isAddMeetingOpen} onOpenChange={setIsAddMeetingOpen}>
        <DialogContent className="sm:max-w-[500px] dark:bg-gray-800/95 dark:backdrop-blur-xl dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-400 dark:to-indigo-500">
              {editingSessionId ? 'Edit Study Session' : 'Add Study Session'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <BookOpen className="h-5 w-5" />
                <h3 className="font-semibold">Session Details</h3>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Subject
                </Label>
                <Input
                  id="subject"
                  value={studyMeeting.subject}
                  onChange={(e) => setStudyMeeting({ ...studyMeeting, subject: e.target.value })}
                  placeholder="e.g., Midterm Review, Group Project"
                  className="w-full border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={studyMeeting.description}
                  onChange={(e) => setStudyMeeting({ ...studyMeeting, description: e.target.value })}
                  placeholder="What will be covered in this session?"
                  className="w-full h-24 border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Calendar className="h-5 w-5" />
                <h3 className="font-semibold">Date & Time</h3>
              </div>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={studyMeeting.date}
                    onChange={(e) => setStudyMeeting({ ...studyMeeting, date: e.target.value })}
                    className="w-full border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Start Time
                    </Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={studyMeeting.startTime}
                      onChange={(e) => setStudyMeeting({ ...studyMeeting, startTime: e.target.value })}
                      className="w-full border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      End Time
                    </Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={studyMeeting.endTime}
                      onChange={(e) => setStudyMeeting({ ...studyMeeting, endTime: e.target.value })}
                      className="w-full border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20"
                    />
                  </div>
                </div>
              </div>
            </div>

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
                      ${studyMeeting.meetingType === type.value 
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="meetingType"
                      value={type.value}
                      checked={studyMeeting.meetingType === type.value}
                      onChange={(e) => setStudyMeeting({ ...studyMeeting, meetingType: e.target.value })}
                      className="sr-only"
                    />
                    <span className="text-2xl">{type.icon}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{type.label}</span>
                  </label>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {studyMeeting.meetingType === 'online' ? 'Meeting Link' : 'Location'}
                </Label>
                <Input
                  id="location"
                  value={studyMeeting.location}
                  onChange={(e) => setStudyMeeting({ ...studyMeeting, location: e.target.value })}
                  placeholder={
                    studyMeeting.meetingType === 'online'
                      ? 'Enter meeting link (e.g., Zoom, Teams)'
                      : 'Enter physical location'
                  }
                  className="w-full border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleAddMeeting}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              {editingSessionId ? 'Update Session' : 'Add Session'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Meeting Details Dialog */}
      <Dialog open={!!selectedMeeting} onOpenChange={() => setSelectedMeeting(null)}>
        <DialogContent className="sm:max-w-[500px] dark:bg-gray-800/95 dark:backdrop-blur-xl dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-400 dark:to-indigo-500">
              {selectedMeeting?.type === 'meeting-type' ? 'Meeting Type Details' :
               selectedMeeting?.type === 'location' ? 'Location Details' :
               selectedMeeting?.type === 'meeting-days' ? 'Meeting Schedule' :
               selectedMeeting?.type === 'meeting-time' ? 'Meeting Time Details' :
               selectedMeeting?.type === 'meeting' ? 'Regular Meeting' : 'Study Session'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {selectedMeeting?.type === 'meeting-type' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <Video className="h-5 w-5" />
                  <h3 className="font-semibold">Meeting Format</h3>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 capitalize">{selectedMeeting.meetingType}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{selectedMeeting.description}</p>
                </div>
              </div>
            )}

            {selectedMeeting?.type === 'location' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <MapPin className="h-5 w-5" />
                  <h3 className="font-semibold">{selectedMeeting.meetingType === 'online' ? 'Meeting Link' : 'Location'}</h3>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedMeeting.description}</p>
                  <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-all">{selectedMeeting.location}</p>
                  </div>
                </div>
              </div>
            )}

            {selectedMeeting?.type === 'meeting-days' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Calendar className="h-5 w-5" />
                  <h3 className="font-semibold">Weekly Schedule</h3>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{selectedMeeting.description}</p>
                  <div className="grid gap-2">
                    {DAYS_OF_WEEK.map(day => (
                      <div key={day} className={cn(
                        "flex items-center p-2 rounded-lg transition-colors duration-300",
                        selectedMeeting.meetingDays.includes(day)
                          ? "bg-green-100 dark:bg-green-800/30"
                          : "bg-gray-50 dark:bg-gray-800/10 opacity-50"
                      )}>
                        <div className={cn(
                          "w-3 h-3 rounded-full mr-3",
                          selectedMeeting.meetingDays.includes(day)
                            ? "bg-green-500 dark:bg-green-400"
                            : "bg-gray-300 dark:bg-gray-600"
                        )} />
                        <span className={cn(
                          "text-sm font-medium",
                          selectedMeeting.meetingDays.includes(day)
                            ? "text-green-800 dark:text-green-300"
                            : "text-gray-500 dark:text-gray-400"
                        )}>{day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedMeeting?.type === 'meeting-time' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <Clock className="h-5 w-5" />
                  <h3 className="font-semibold">Time Details</h3>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{selectedMeeting.description}</p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-orange-200 dark:border-orange-800">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Start Time</span>
                      <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{formatTime(selectedMeeting.startTime)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-orange-200 dark:border-orange-800">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">End Time</span>
                      <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{formatTime(selectedMeeting.endTime)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-orange-200 dark:border-orange-800">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Duration</span>
                      <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                        {(() => {
                          if (!selectedMeeting.startTime || !selectedMeeting.endTime) return 'Not set';
                          const [startHours, startMinutes] = selectedMeeting.startTime.split(':');
                          const [endHours, endMinutes] = selectedMeeting.endTime.split(':');
                          const start = new Date(2000, 0, 1, parseInt(startHours), parseInt(startMinutes));
                          const end = new Date(2000, 0, 1, parseInt(endHours), parseInt(endMinutes));
                          const diff = (end.getTime() - start.getTime()) / (1000 * 60);
                          const hours = Math.floor(diff / 60);
                          const minutes = diff % 60;
                          return `${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m` : ''}`;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(selectedMeeting?.type === 'meeting' || selectedMeeting?.type === 'study-session') && (
              <>
                {selectedMeeting?.type === 'study-session' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                      <BookOpen className="h-5 w-5" />
                      <h3 className="font-semibold">Session Details</h3>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{selectedMeeting?.subject}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedMeeting?.description}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <Calendar className="h-5 w-5" />
                    <h3 className="font-semibold">Date & Time</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Date</h4>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {selectedMeeting?.date ? format(new Date(selectedMeeting.date), 'PPP') : 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Time</h4>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {selectedMeeting?.isRegularMeeting ? (
                          `${formatTime(selectedMeeting.startTime)} - ${formatTime(selectedMeeting.endTime)}`
                        ) : selectedMeeting?.startTime && selectedMeeting?.endTime ? (
                          `${format(new Date('2000-01-01T' + selectedMeeting.startTime), 'p')} - ${format(new Date('2000-01-01T' + selectedMeeting.endTime), 'p')}`
                        ) : 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <MapPin className="h-5 w-5" />
                    <h3 className="font-semibold">Meeting Details</h3>
                  </div>
                  <div className="grid gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Meeting Type</h4>
                      <p className="text-sm text-gray-900 dark:text-gray-100 capitalize">{selectedMeeting?.meetingType}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {selectedMeeting?.meetingType === 'online' ? 'Meeting Link' : 'Location'}
                      </h4>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {selectedMeeting?.location || selectedMeeting?.meetingLocation || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}