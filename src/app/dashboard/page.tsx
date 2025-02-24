'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle2, Circle, Plus, Calendar as CalendarIcon, Clock, GripHorizontal, ChevronLeft, ChevronRight, CheckCircle, Trash2, X } from 'lucide-react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { config } from '@/config';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Layout } from 'react-grid-layout';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface TeamMeeting {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  createdBy: string;
}

interface StudyGroupMeeting {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  createdBy: string;
}

interface TeamType {
  _id: string;
  name: string;
  meetings?: TeamMeeting[];
}

interface StudyGroupType {
  _id: string;
  name: string;
  meetings?: StudyGroupMeeting[];
}

interface DashboardEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  start: Date;
  end: Date;
  source: 'team' | 'study-group' | 'personal';
  sourceId: string;
  sourceName?: string;
  type: 'homework' | 'study' | 'meeting' | 'other';
  location?: string;
  completed?: boolean;
  cleared?: boolean;
}

interface DashboardTask {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  source: 'team' | 'study-group' | 'personal';
  sourceId: string;
  sourceName?: string;
  status?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  startDate: string;
  endDate: string;
  source: 'team' | 'study-group' | 'personal';
  sourceId: string;
  sourceName?: string;
  type: 'homework' | 'study' | 'meeting' | 'other';
  location?: string;
  completed?: boolean;
  cleared?: boolean;
}

interface DashboardData {
  tasks: DashboardTask[];
  events: DashboardEvent[];
  teams: any[];
  studyGroups: any[];
}

const getEventStart = (event: CalendarEvent) => event.start;
const getEventEnd = (event: CalendarEvent) => event.end;

interface EventProps<T> {
  event: T;
  style?: React.CSSProperties;
}

interface DashboardLayout extends Layout {
  minW: number;
  minH: number;
}

const DashboardPage = () => {
  const router = useRouter();
  const [date, setDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [selectedTab, setSelectedTab] = useState('all');
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [newEvent, setNewEvent] = useState<{
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    type: 'homework' | 'study' | 'meeting' | 'other';
    customType?: string;
  }>({
    title: '',
    description: '',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    type: 'study'
  });
  const [windowWidth, setWindowWidth] = useState(1200);
  const [layout, setLayout] = useState<DashboardLayout[]>([
    { i: 'calendar', x: 0, y: 0, w: 8, h: 4, minW: 6, minH: 3 },
    { i: 'daily', x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 2 },
    { i: 'tasks', x: 0, y: 4, w: 6, h: 2, minW: 3, minH: 2 },
    { i: 'timer', x: 6, y: 4, w: 6, h: 2, minW: 2, minH: 2 }
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [time, setTime] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [timerType, setTimerType] = useState<'work' | 'break'>('work');
  const [isTimerDialogOpen, setIsTimerDialogOpen] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState('25');
  const [shortBreakMinutes, setShortBreakMinutes] = useState('5');
  const [longBreakMinutes, setLongBreakMinutes] = useState('15');
  const [autoStartBreaks, setAutoStartBreaks] = useState(true);
  const [view, setView] = useState<View>('month');
  const [selectedEvent, setSelectedEvent] = useState<DashboardEvent | null>(null);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<DashboardTask | null>(null);
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [cycles, setCycles] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const breakAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio elements for timer completion sounds
    audioRef.current = new Audio('/timer-complete.mp3');
    breakAudioRef.current = new Audio('/break-complete.mp3');
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (breakAudioRef.current) {
        breakAudioRef.current.pause();
        breakAudioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime(prev => {
          if (prev <= 1) {
            // Timer completed
            if (timerType === 'work') {
              if (breakAudioRef.current) {
                breakAudioRef.current.play();
              }
              setCycles(prev => prev + 1);
              setTimerType('break');
              toast({
                title: "Work session complete!",
                description: cycles < 3 ? "Time for a short break." : "Time for a long break!",
                variant: "default",
              });
              const nextTime = cycles < 3 ? parseInt(shortBreakMinutes) * 60 : parseInt(longBreakMinutes) * 60;
              if (autoStartBreaks) {
                return nextTime;
              } else {
                setIsRunning(false);
                return nextTime;
              }
            } else {
              if (audioRef.current) {
                audioRef.current.play();
              }
              setTimerType('work');
              toast({
                title: "Break time's over!",
                description: "Time to get back to work.",
                variant: "default",
              });
              const workTime = parseInt(timerMinutes) * 60;
              if (autoStartBreaks) {
                return workTime;
              } else {
                setIsRunning(false);
                return workTime;
              }
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timerType, cycles, timerMinutes, shortBreakMinutes, longBreakMinutes, autoStartBreaks]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimerReset = () => {
    setIsRunning(false);
    setTimerType('work');
    setTime(parseInt(timerMinutes) * 60);
    setCycles(0);
  };

  // Convert backend event data to DashboardEvent
  const backendEventToDashboardEvent = (data: any): DashboardEvent => {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid event data: not an object');
    }

    if (!data.startDate || !data.endDate || !data.title) {
      throw new Error('Invalid event data: missing required fields');
    }

    // Parse dates and validate them
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    try {
      // Try to parse the dates, handling both string and Date objects
      startDate = data.startDate ? new Date(data.startDate) : null;
      endDate = data.endDate ? new Date(data.endDate) : null;

      // Validate dates
      if (!startDate || isNaN(startDate.getTime())) {
        console.error('Invalid start date received:', data.startDate);
        throw new Error(`Invalid start date: ${data.startDate}`);
      }
      if (!endDate || isNaN(endDate.getTime())) {
        console.error('Invalid end date received:', data.endDate);
        throw new Error(`Invalid end date: ${data.endDate}`);
      }

      return {
        id: data._id || data.id,
        title: data.title,
        description: data.description || '',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        start: startDate,
        end: endDate,
        source: data.source || 'personal',
        sourceId: data.sourceId || data._id || data.id,
        sourceName: data.sourceName || '',
        type: data.type || 'other',
        location: data.location || '',
        completed: Boolean(data.completed),
        cleared: false
      };
    } catch (error: any) {
      console.error('Error parsing event dates:', error);
      console.error('Event data received:', data);
      throw new Error(`Error parsing event dates: ${error.message || 'Unknown error'}`);
    }
  };

  // Convert DashboardEvent to CalendarEvent
  const dashboardToCalendarEvent = (event: DashboardEvent): CalendarEvent => {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      start: startDate,
      end: endDate,
      startDate: event.startDate,
      endDate: event.endDate,
      source: event.source,
      sourceId: event.sourceId,
      sourceName: event.sourceName,
      type: event.type,
      location: event.location,
      completed: event.completed,
      cleared: event.cleared
    };
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch(`${config.API_URL}/api/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Dashboard data:', data);

      // Convert tasks to dashboard events
      const taskEvents: DashboardEvent[] = (data.tasks || []).map((task: DashboardTask) => {
        const dueDate = new Date(task.dueDate);
        return {
          id: `task-${task.id}`,
          title: `📋 ${task.title}`,
          description: task.description,
          startDate: dueDate.toISOString(),
          endDate: dueDate.toISOString(),
          start: dueDate,
          end: dueDate,
          source: task.source,
          sourceId: task.sourceId,
          sourceName: task.sourceName,
          type: 'other'
        };
      });

      // Format team meetings
      const teamEvents: DashboardEvent[] = (data.teams || []).flatMap((team: TeamType) => 
        team.meetings?.map((meeting: TeamMeeting) => {
          const startDate = new Date(meeting.startDate);
          const endDate = new Date(meeting.endDate);
          return {
            id: `team-${meeting._id}`,
            title: `👥 ${meeting.title}`,
            description: meeting.description,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            start: startDate,
            end: endDate,
            source: 'team',
            sourceId: team._id,
            sourceName: team.name,
            type: 'meeting',
            location: meeting.location
          };
        }) || []
      );

      // Format study group meetings
      const studyGroupEvents: DashboardEvent[] = (data.studyGroups || []).flatMap((group: StudyGroupType) => 
        group.meetings?.map((meeting: StudyGroupMeeting) => {
          const startDate = new Date(meeting.startDate);
          const endDate = new Date(meeting.endDate);
          return {
            id: `study-${meeting._id}`,
            title: `📚 ${meeting.title}`,
            description: meeting.description,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            start: startDate,
            end: endDate,
            source: 'study-group',
            sourceId: group._id,
            sourceName: group.name,
            type: 'meeting',
            location: meeting.location
          };
        }) || []
      );

      // Filter out invalid personal events and process the valid ones
      const validPersonalEvents = (data.events || []).filter((event: any) => {
        return event && 
               event.startDate && 
               event.endDate && 
               event.title &&
               !isNaN(new Date(event.startDate).getTime()) &&
               !isNaN(new Date(event.endDate).getTime());
      });

      // Process personal events
      const personalEvents = validPersonalEvents.map((event: any) => {
        try {
          const processedEvent = backendEventToDashboardEvent(event);
          console.log('Processed personal event:', processedEvent);
          return processedEvent;
        } catch (error) {
          console.error('Error processing event:', event, error);
          return null;
        }
      }).filter(Boolean); // Remove any null events

      // Combine all events
      const allEvents = [...taskEvents, ...teamEvents, ...studyGroupEvents, ...personalEvents];
      console.log('All combined events:', allEvents);
      console.log('Personal events count:', personalEvents.length);
      console.log('Team events count:', teamEvents.length);
      console.log('Study group events count:', studyGroupEvents.length);

      setEvents(allEvents);
      const allCalendarEvents = eventsToCalendarEvents(allEvents);
      console.log('Calendar events:', allCalendarEvents);
      setCalendarEvents(allCalendarEvents);
      setTasks(data.tasks || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to fetch dashboard data');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initData = async () => {
      try {
        await fetchData();
      } catch (error) {
        if (mounted) {
          console.error('Error initializing data:', error);
          setError('Failed to initialize dashboard');
        }
      }
    };

    initData();

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    // Load saved layout from localStorage
    const savedLayout = localStorage.getItem('dashboardLayout');
    if (savedLayout) {
      try {
        const parsedLayout = JSON.parse(savedLayout) as DashboardLayout[];
        setLayout(parsedLayout);
      } catch (e) {
        console.error('Error loading saved layout:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Update width on mount
    setWindowWidth(window.innerWidth - 48); // Account for padding

    // Add window resize listener
    const handleResize = () => {
      setWindowWidth(window.innerWidth - 48);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleEventSelect = (event: CalendarEvent) => {
    // Convert CalendarEvent back to DashboardEvent
    const dashboardEvent: DashboardEvent = {
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      start: event.start,
      end: event.end,
      source: event.source,
      sourceId: event.sourceId,
      sourceName: event.sourceName,
      type: event.type || 'other',
      location: event.location,
      completed: event.completed,
      cleared: event.cleared
    };
    setSelectedEvent(dashboardEvent);
    setIsEventDetailsOpen(true);
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setSelectedDate(slotInfo.start);
  };

  const handleAddEvent = async (eventData: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    type: 'homework' | 'study' | 'meeting' | 'other';
    customType?: string;
  }) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      if (!token || !userId) {
        console.error('No token or userId found');
        return;
      }

      // Validate dates before sending to server
      const startDate = new Date(eventData.startDate);
      const endDate = new Date(eventData.endDate);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        toast({
          title: "Error",
          description: "Invalid date format. Please check your dates.",
          variant: "destructive",
        });
        return;
      }

      // Create the event
      const response = await fetch(`${config.API_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: eventData.title,
          description: eventData.description,
          startDate: startDate,
          endDate: endDate,
          type: eventData.type,
          customType: eventData.type === 'other' ? eventData.customType : undefined,
          source: 'personal',
          completed: false
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Server error:', errorData);
        throw new Error('Failed to add event');
      }

      const createdEventData = await response.json();
      
      if (!createdEventData || !createdEventData._id) {
        console.error('Invalid response data:', createdEventData);
        throw new Error('Server returned invalid response format');
      }

      try {
        // Create the event object with the data we sent to the server
        const eventToAdd = {
          _id: createdEventData._id,
          title: eventData.title,
          description: eventData.description,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          start: startDate,
          end: endDate,
          type: eventData.type,
          source: 'personal',
          completed: false
        };

        // Log the event object to see its structure
        console.log('New event object:', eventToAdd);

        // Convert to DashboardEvent
        const newEvent = backendEventToDashboardEvent(eventToAdd);
        console.log('Converted to DashboardEvent:', newEvent);

        // Convert to CalendarEvent
        const newCalendarEvent = dashboardToCalendarEvent(newEvent);
        console.log('Converted to CalendarEvent:', newCalendarEvent);

        // Update states with the event data
        setEvents(prevEvents => {
          const updated = [...prevEvents, newEvent];
          console.log('Updated events array:', updated);
          return updated;
        });
        
        setCalendarEvents(prevEvents => {
          const updated = [...prevEvents, newCalendarEvent];
          console.log('Updated calendar events array:', updated);
          return updated;
        });
        
        // Close the dialog and show success message
        setIsAddEventOpen(false);
        toast({
          title: "Event added",
          description: "Your event has been successfully added to the calendar.",
        });

        // Refresh the data to ensure we have the latest state
        await fetchData();
      } catch (dateError: any) {
        console.error('Error processing event dates:', dateError);
        toast({
          title: "Error",
          description: "Invalid date format. Please try again.",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('Error adding event:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTaskClick = (task: DashboardTask) => {
    setSelectedTask(task);
    setIsTaskDetailsOpen(true);
  };

  const handleTeamClick = (team: TeamType) => {
    router.push(`/teams/${team._id}`);
  };

  const handleStudyGroupClick = (group: StudyGroupType) => {
    router.push(`/studyGroups/${group._id}`);
  };

  const handleEventClick = (event: DashboardEvent) => {
    setSelectedEvent(event);
    setIsEventDetailsOpen(true);
  };

  const navigateToSource = (source: string, sourceId: string) => {
    switch (source) {
      case 'team':
        router.push(`/teams/${sourceId}`);
        break;
      case 'study-group':
        router.push(`/studyGroups/${sourceId}`);
        break;
      default:
        break;
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'completed') return task.completed;
    if (selectedTab === 'pending') return !task.completed;
    return task.source === selectedTab;
  });

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'team':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'study-group':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'personal':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const endpoint = task.source === 'team' 
        ? `/teams/${task.sourceId}/tasks/${taskId}/toggle`
        : `/users/tasks/${taskId}/toggle`;

      const response = await fetch(`${config.API_URL}${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle task completion');
      }

      await fetchData();
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  };

  const handleEventComplete = async (event: DashboardEvent) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      if (!token || !userId) {
        console.error('No token or userId found');
        return;
      }

      // Only handle personal events
      if (event.source !== 'personal') {
        return;
      }

      const response = await fetch(`${config.API_URL}/api/events/${event.id}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to update event status');
      }

      // Update local state
      setEvents(prevEvents =>
        prevEvents.map(e =>
          e.id === event.id ? { ...e, completed: true } : e
        )
      );

      setCalendarEvents(prevEvents =>
        prevEvents.map(e =>
          e.id === event.id ? { ...e, completed: true } : e
        )
      );

      // Show success toast
      toast({
        title: "Event completed",
        description: "The event has been marked as complete.",
      });

    } catch (error) {
      console.error('Error updating event status:', error);
      toast({
        title: "Error",
        description: "Failed to mark event as complete. Please try again.",
        variant: "destructive",
      });
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const getEventColor = () => {
      // If the event is completed, return a muted color
      if (event.completed) {
        return 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 line-through opacity-70';
      }

      switch (event.source) {
        case 'team':
          return 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white dark:from-indigo-600 dark:to-indigo-700';
        case 'study-group':
          return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white dark:from-purple-600 dark:to-purple-700';
        case 'personal':
          switch (event.type) {
            case 'homework':
              return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white dark:from-blue-600 dark:to-blue-700';
            case 'study':
              return 'bg-gradient-to-r from-green-500 to-green-600 text-white dark:from-green-600 dark:to-green-700';
            case 'meeting':
              return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white dark:from-orange-600 dark:to-orange-700';
            default:
              return 'bg-gradient-to-r from-sky-500 to-sky-600 text-white dark:from-sky-600 dark:to-sky-700';
          }
        default:
          return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white dark:from-gray-600 dark:to-gray-700';
      }
    };

    return {
      className: `${getEventColor()} rounded-lg shadow-sm hover:shadow-md transition-all duration-200`,
      style: {
        border: 'none',
        padding: '2px 4px',
        fontSize: '0.75rem',
        lineHeight: '1.25rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        minHeight: view === 'month' ? '20px' : '24px',
        height: '100%'
      }
    };
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      );
    });
  };

  const getEventTimeString = (event: CalendarEvent) => {
    if (event.type === 'homework' || event.type === 'study') {
      return 'Due ' + format(event.start, 'h:mm a');
    }
    return `${format(event.start, 'h:mm a')} - ${format(event.end, 'h:mm a')}`;
  };

  const onDragEnd = (result: any) => {
    // This function is no longer needed since we're using react-grid-layout
    return;
  };

  const CalendarEventComponent = ({ event }: EventProps<CalendarEvent>) => {
    const getEventColor = () => {
      if (event.completed) {
        return 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 dark:from-gray-700 dark:to-gray-800 dark:text-gray-300 line-through opacity-70';
      }

      switch (event.source) {
        case 'team':
          return 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white dark:from-indigo-600 dark:to-indigo-700';
        case 'study-group':
          return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white dark:from-purple-600 dark:to-purple-700';
        case 'personal':
          switch (event.type) {
            case 'homework':
              return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white dark:from-blue-600 dark:to-blue-700';
            case 'study':
              return 'bg-gradient-to-r from-green-500 to-green-600 text-white dark:from-green-600 dark:to-green-700';
            case 'meeting':
              return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white dark:from-orange-600 dark:to-orange-700';
            default:
              return 'bg-gradient-to-r from-sky-500 to-sky-600 text-white dark:from-sky-600 dark:to-sky-700';
          }
        default:
          return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white dark:from-gray-600 dark:to-gray-700';
      }
    };

    const isMonthView = view === 'month';

    return (
      <div 
        className={`${getEventColor()} flex flex-col rounded-md shadow-sm hover:shadow-md transition-all duration-200 w-full h-full`}
        style={{
          minHeight: isMonthView ? '20px' : '24px',
          margin: '1px 0'
        }}
      >
        <div className="flex-1 min-w-0 px-1.5 py-0.5">
          <div className="flex items-center justify-between gap-1">
            <span className={`font-medium truncate ${isMonthView ? 'text-[11px]' : 'text-sm'}`}>
              {event.title}
            </span>
            {!isMonthView && (
              <>
                {event.source === 'personal' && !event.completed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEventComplete(event);
                    }}
                    className="h-6 w-6 p-0 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                  </Button>
                )}
                <span className="text-[10px] opacity-90 truncate flex items-center gap-0.5 shrink-0">
                  <Clock className="w-2.5 h-2.5" />
                  {format(event.start, 'h:mm a')}
                </span>
              </>
            )}
          </div>
          {!isMonthView && event.description && (
            <p className="text-[10px] opacity-80 truncate mt-0.5">
              {event.description}
            </p>
          )}
        </div>
      </div>
    );
  };

  const TaskItem = ({ task }: { task: DashboardTask }) => (
    <div 
      className="mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      onClick={() => handleTaskClick(task)}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium truncate">{task.title}</h4>
          <p className="text-xs text-gray-500 truncate">Due {format(new Date(task.dueDate), 'h:mm a')}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            toggleTaskCompletion(task.id);
          }}
          className="h-8 w-8 p-0"
        >
          {task.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );

  const EventItem = ({ event }: { event: CalendarEvent | DashboardEvent }) => (
    <div 
      className={cn(
        "mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
        event.cleared && "opacity-75"
      )}
      onClick={() => handleEventSelect(event)}
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <h4 className={cn(
            "text-sm font-medium truncate",
            event.cleared && "text-gray-400 italic"
          )}>
            {event.title.replace(/[📋👥📚📝🎯]/g, '').trim()}
            {event.cleared && " (Cleared)"}
          </h4>
        </div>
        <p className={cn(
          "text-xs text-gray-500 truncate",
          event.cleared && "text-gray-400"
        )}>
          {format(new Date(event.startDate), 'h:mm a')} - {format(new Date(event.endDate), 'h:mm a')}
        </p>
      </div>
      <Badge 
        variant="outline" 
        className={cn(
          "text-xs px-2 py-0 h-5 mt-1",
          event.cleared && "opacity-50"
        )}
      >
        {event.source === 'team' ? 'Team' : event.source === 'study-group' ? 'Study Group' : 'Personal'}
      </Badge>
    </div>
  );

  const handleLayoutChange = (newLayout: Layout[]) => {
    const typedLayout: DashboardLayout[] = newLayout.map(item => ({
      ...item,
      minW: layout.find(l => l.i === item.i)?.minW || 3,
      minH: layout.find(l => l.i === item.i)?.minH || 2
    }));
    setLayout(typedLayout);
    localStorage.setItem('dashboardLayout', JSON.stringify(typedLayout));
  };

  // Convert backend events to calendar events
  const eventsToCalendarEvents = (events: DashboardEvent[]): CalendarEvent[] => {
    return events
      .filter(event => {
        // Include all non-cleared events
        if (!event.cleared) return true;
        return false;
      })
      .map(event => {
        // Ensure dates are properly converted
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);
        
        return {
          id: event.id,
          title: event.title,
          description: event.description,
          start: startDate,
          end: endDate,
          startDate: event.startDate,
          endDate: event.endDate,
          source: event.source,
          sourceId: event.sourceId,
          sourceName: event.sourceName,
          type: event.type,
          location: event.location,
          completed: event.completed,
          cleared: event.cleared
        };
      });
  };

  useEffect(() => {
    // Update calendar events whenever events array changes
    const newCalendarEvents = eventsToCalendarEvents(events);
    setCalendarEvents(newCalendarEvents);
  }, [events]);

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      if (!token || !userId) {
        console.error('No token or userId found');
        return;
      }

      const response = await fetch(`${config.API_URL}/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      // Update local state
      setEvents(prevEvents => prevEvents.filter(e => e.id !== eventId));
      setCalendarEvents(prevEvents => prevEvents.filter(e => e.id !== eventId));
      setIsEventDetailsOpen(false);
      toast({
        title: "Event deleted",
        description: "The event has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClearEvent = async (eventId: string) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      if (!token || !userId) {
        console.error('No token or userId found');
        return;
      }

      const response = await fetch(`${config.API_URL}/api/events/${eventId}/clear`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to clear event');
      }

      // Update local state to mark event as cleared
      setEvents(prevEvents =>
        prevEvents.map(e =>
          e.id === eventId ? { ...e, cleared: true } : e
        )
      );
      
      // Remove from calendar events
      setCalendarEvents(prevEvents => prevEvents.filter(e => e.id !== eventId));
      
      setIsEventDetailsOpen(false);
      toast({
        title: "Event cleared",
        description: "The event has been cleared from your calendar but will still appear in daily view.",
      });
    } catch (error) {
      console.error('Error clearing event:', error);
      toast({
        title: "Error",
        description: "Failed to clear event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUnclearEvent = async (eventId: string) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      if (!token || !userId) {
        console.error('No token or userId found');
        return;
      }

      const response = await fetch(`${config.API_URL}/api/events/${eventId}/unclear`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to unclear event');
      }

      // Update local state to mark event as not cleared
      setEvents(prevEvents =>
        prevEvents.map(e =>
          e.id === eventId ? { ...e, cleared: false } : e
        )
      );
      
      // Add back to calendar events
      const eventToAdd = events.find(e => e.id === eventId);
      if (eventToAdd) {
        setCalendarEvents(prevEvents => [...prevEvents, dashboardToCalendarEvent(eventToAdd)]);
      }
      
      setIsEventDetailsOpen(false);
      toast({
        title: "Event restored",
        description: "The event has been restored to your calendar.",
      });
    } catch (error) {
      console.error('Error unclearing event:', error);
      toast({
        title: "Error",
        description: "Failed to restore event. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Add error display
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="p-4 text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 max-w-[1400px] mx-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold text-gray-900 dark:text-gray-100"
          >
            Your Dashboard
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button
              onClick={() => setIsAddEventOpen(true)}
              className="bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </motion.div>
        </div>

        <div className="grid gap-4">
          {/* Top Row: Calendar and Daily View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Calendar Section */}
            <div className="lg:col-span-9">
              <Card className="h-[500px] lg:h-[700px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
                      <CalendarIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold">Calendar</CardTitle>
                      <CardDescription className="text-base">Schedule and deadlines</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 h-[calc(100%-4.5rem)]">
                  <Calendar
                    localizer={localizer}
                    events={calendarEvents}
                    startAccessor={getEventStart}
                    endAccessor={getEventEnd}
                    style={{ height: '100%' }}
                    eventPropGetter={eventStyleGetter}
                    onSelectEvent={handleEventSelect}
                    onSelectSlot={handleSelectSlot}
                    selectable
                    components={{
                      event: CalendarEventComponent
                    }}
                    view={view}
                    onView={setView}
                    date={date}
                    onNavigate={date => setDate(date)}
                    className="calendar-modern"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Daily View Section */}
            <div className="lg:col-span-3">
              <Card className="h-[400px] lg:h-[600px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <CardTitle className="text-lg bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">{format(selectedDate, "MMMM d, yyyy")}</CardTitle>
                    <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                      {format(selectedDate, 'PPPP') === format(new Date(), 'PPPP') ? 'Today' : 'Selected day'}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-4 h-[calc(100%-4rem)]">
                  <ScrollArea className="h-full">
                    <div className="space-y-4">
                      {/* Tasks Section */}
                      <div>
                        <h3 className="font-semibold mb-2 text-sm">Tasks</h3>
                        {tasks
                          .filter(task => format(new Date(task.dueDate), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'))
                          .map((task) => (
                            <TaskItem key={task.id} task={task} />
                          ))}
                      </div>

                      {/* Events Section */}
                      <div>
                        <h3 className="font-semibold mb-2 text-sm">Events</h3>
                        <div className="space-y-2">
                          {events
                            .filter(event => 
                              event.start.getFullYear() === selectedDate.getFullYear() && 
                              event.start.getMonth() === selectedDate.getMonth() && 
                              event.start.getDate() === selectedDate.getDate()
                            )
                            .sort((a, b) => a.start.getTime() - b.start.getTime())
                            .map((event) => (
                              <EventItem key={event.id} event={event} />
                            ))}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Row: Tasks, Timer, and Personal Events */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
            {/* All Tasks Section */}
            <div className="md:col-span-1 lg:col-span-5">
              <Card className="h-[400px] lg:h-[450px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <CardTitle className="text-lg bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">All Tasks</CardTitle>
                    <CardDescription className="text-sm text-gray-500 dark:text-gray-400">Track your progress</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-4 h-[calc(100%-4.5rem)] overflow-hidden">
                  <Tabs defaultValue="all" className="h-full" onValueChange={setSelectedTab}>
                    <TabsList className="grid grid-cols-3 mb-2">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="pending">Pending</TabsTrigger>
                      <TabsTrigger value="completed">Completed</TabsTrigger>
                    </TabsList>

                    <TabsContent value={selectedTab} className="mt-0 h-[calc(100%-3rem)]">
                      <ScrollArea className="h-full pr-4">
                        <div className="space-y-2">
                          {filteredTasks.map((task) => (
                            <TaskItem key={task.id} task={task} />
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Personal Events Section */}
            <div className="md:col-span-1 lg:col-span-4">
              <Card className="h-[400px] lg:h-[450px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <CardTitle className="text-lg bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">Personal Events</CardTitle>
                    <CardDescription className="text-sm text-gray-500 dark:text-gray-400">Manage your events</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-4 h-[calc(100%-4.5rem)] overflow-hidden">
                  <ScrollArea className="h-full pr-4">
                    <div className="space-y-2">
                      {events
                        .filter(event => event.source === 'personal')
                        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                        .map((event) => {
                          const startDate = new Date(event.startDate);
                          const isValidDate = !isNaN(startDate.getTime());
                          
                          return (
                            <div
                              key={event.id}
                              className={cn(
                                "p-3 rounded-lg transition-colors cursor-pointer",
                                event.completed
                                  ? "bg-gray-100 dark:bg-gray-800/50"
                                  : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                              )}
                              onClick={() => {
                                setSelectedEvent(event);
                                setIsEventDetailsOpen(true);
                              }}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <h4 className={cn(
                                    "text-sm font-medium",
                                    event.cleared && "text-gray-400 italic"
                                  )}>{event.title}</h4>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {isValidDate ? format(startDate, 'MMM d, yyyy h:mm a') : 'Invalid date'}
                                  </p>
                                  {event.description && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                      {event.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {!event.completed && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEventComplete(event);
                                      }}
                                      className="h-8 w-8 p-0 text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {event.cleared ? (
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUnclearEvent(event.id);
                                      }}
                                      variant="outline"
                                      size="sm"
                                      className="text-blue-500 hover:text-blue-600"
                                    >
                                      <CalendarIcon className="h-4 w-4 mr-1" />
                                      Restore to Calendar
                                    </Button>
                                  ) : (
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleClearEvent(event.id);
                                      }}
                                      variant="outline"
                                      size="sm"
                                      className="text-orange-500 hover:text-orange-600"
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Clear
                                    </Button>
                                  )}
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteEvent(event.id);
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="text-red-500 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Timer Section */}
            <div className="md:col-span-2 lg:col-span-3">
              <Card className="h-[450px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20">
                      <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                        Focus Timer
                      </CardTitle>
                      <CardDescription>Manage your work sessions</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsTimerDialogOpen(true)}
                    className="border-indigo-200 text-indigo-500 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-950/20"
                  >
                    Settings
                  </Button>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center">
                    {/* Timer Circle */}
                    <div className={cn(
                      "relative w-48 h-48 rounded-full transition-all duration-500",
                      timerType === 'work'
                        ? "bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20"
                        : "bg-gradient-to-br from-blue-500/10 to-violet-500/10 dark:from-blue-500/20 dark:to-violet-500/20",
                      isRunning && "animate-pulse"
                    )}>
                      <div className="absolute inset-0 rounded-full flex items-center justify-center">
                        <div className="text-center">
                          <div className={cn(
                            "text-7xl font-mono font-bold mb-2",
                            timerType === 'work'
                              ? "bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500"
                              : "bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-500"
                          )}>
                            {formatTime(time)}
                          </div>
                          <div className={cn(
                            "text-sm font-medium",
                            timerType === 'work'
                              ? "text-indigo-500 dark:text-indigo-400"
                              : "text-blue-500 dark:text-blue-400"
                          )}>
                            {timerType === 'work' ? 'Focus Time' : cycles < 3 ? 'Short Break' : 'Long Break'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Indicators */}
                    <div className="mt-8 w-full max-w-sm">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant={timerType === 'work' ? 'default' : 'secondary'} className={cn(
                          "bg-gradient-to-r",
                          timerType === 'work'
                            ? "from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                            : "from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600"
                        )}>
                          {timerType === 'work' ? 'Focus Session' : 'Break Time'}
                        </Badge>
                        <Badge variant="outline" className={cn(
                          "transition-colors",
                          cycles === 3 && "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                        )}>
                          Cycle {cycles + 1}/4
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mb-6">
                        {[0, 1, 2, 3].map((cycle) => (
                          <div
                            key={cycle}
                            className={cn(
                              "h-1.5 rounded-full transition-all duration-500",
                              cycle < cycles
                                ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                : cycle === cycles
                                  ? timerType === 'work'
                                    ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                                    : "bg-gradient-to-r from-blue-500 to-violet-500"
                                  : "bg-gray-200 dark:bg-gray-700"
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-3 mt-4">
                      <Button
                        size="lg"
                        onClick={() => setIsRunning(!isRunning)}
                        className={cn(
                          "transition-all duration-300 min-w-[120px] bg-gradient-to-r shadow-lg",
                          timerType === 'work'
                            ? "from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-indigo-500/20"
                            : "from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 shadow-blue-500/20"
                        )}
                      >
                        {isRunning ? 'Pause' : 'Start'}
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={handleTimerReset}
                        className={cn(
                          "transition-colors min-w-[120px]",
                          timerType === 'work'
                            ? "border-indigo-200 text-indigo-500 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-950/20"
                            : "border-blue-200 text-blue-500 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950/20"
                        )}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timer Settings Dialog */}
              <Dialog open={isTimerDialogOpen} onOpenChange={setIsTimerDialogOpen}>
                <DialogContent className="sm:max-w-[425px] bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                      Timer Settings
                    </DialogTitle>
                    <DialogDescription className="text-center text-gray-500 dark:text-gray-400">
                      Customize your focus and break durations
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="workDuration" className="text-gray-700 dark:text-gray-300">Focus Duration (minutes)</Label>
                      <Input
                        id="workDuration"
                        type="number"
                        min="1"
                        max="60"
                        value={timerMinutes}
                        onChange={(e) => setTimerMinutes(e.target.value)}
                        className="col-span-3 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="shortBreak" className="text-gray-700 dark:text-gray-300">Short Break (minutes)</Label>
                      <Input
                        id="shortBreak"
                        type="number"
                        value={shortBreakMinutes}
                        onChange={(e) => setShortBreakMinutes(e.target.value)}
                        min="1"
                        max="30"
                        className="col-span-3 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="longBreak" className="text-gray-700 dark:text-gray-300">Long Break (minutes)</Label>
                      <Input
                        id="longBreak"
                        type="number"
                        value={longBreakMinutes}
                        onChange={(e) => setLongBreakMinutes(e.target.value)}
                        min="5"
                        max="60"
                        className="col-span-3 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                      />
                    </div>
                    <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                      <div className="relative">
                        <input
                          type="checkbox"
                          id="autoStart"
                          checked={autoStartBreaks}
                          onChange={(e) => setAutoStartBreaks(e.target.checked)}
                          className="peer h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-500 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                      </div>
                      <Label 
                        htmlFor="autoStart" 
                        className="text-sm text-gray-700 dark:text-gray-300"
                      >
                        Auto-start next session
                      </Label>
                    </div>
                  </div>
                  <DialogFooter className="sm:justify-center">
                    <div className="flex gap-3 w-full">
                      <Button
                        variant="outline"
                        onClick={() => setIsTimerDialogOpen(false)}
                        className="flex-1 border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          if (timerType === 'work') {
                            setTime(parseInt(timerMinutes) * 60);
                          } else {
                            setTime(cycles < 3 ? parseInt(shortBreakMinutes) * 60 : parseInt(longBreakMinutes) * 60);
                          }
                          setIsTimerDialogOpen(false);
                        }}
                        className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600"
                      >
                        Apply Settings
                      </Button>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Next Session Indicator */}
              <div className={cn(
                "absolute top-4 right-4 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                timerType === 'work'
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                  : "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
              )}>
                Next: {timerType === 'work' 
                  ? cycles < 3 
                    ? `${shortBreakMinutes}m break` 
                    : `${longBreakMinutes}m break`
                  : `${timerMinutes}m focus`
                }
              </div>
            </div>
          </div>
        </div>

        {/* Add Event Dialog */}
        <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
          <DialogContent className="w-[95vw] max-w-[525px] bg-white dark:bg-gray-900">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                Add New Event
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Enter event title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Enter event description"
                />
              </div>
              <div className="grid gap-2">
                <Label>Start Date & Time</Label>
                <div className="relative">
                  <DatePicker
                    selected={newEvent.startDate ? new Date(newEvent.startDate) : null}
                    onChange={(date: Date | null) => date && setNewEvent({
                      ...newEvent,
                      startDate: date.toISOString(),
                      // If end date is not set or is before start date, set it to 1 hour after start
                      endDate: !newEvent.endDate || new Date(newEvent.endDate) <= date
                        ? new Date(date.getTime() + 60 * 60 * 1000).toISOString()
                        : newEvent.endDate
                    })}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    timeCaption="Time"
                    dateFormat="MMMM d, yyyy h:mm aa"
                    customInput={
                      <div className="relative w-full">
                        <Input
                          value={newEvent.startDate ? format(new Date(newEvent.startDate), 'MMM d, yyyy h:mm aa') : ''}
                          readOnly
                          className="cursor-pointer pl-10"
                        />
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      </div>
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>End Date & Time</Label>
                <div className="relative">
                  <DatePicker
                    selected={newEvent.endDate ? new Date(newEvent.endDate) : null}
                    onChange={(date: Date | null) => date && setNewEvent({
                      ...newEvent,
                      endDate: date.toISOString()
                    })}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    timeCaption="Time"
                    dateFormat="MMMM d, yyyy h:mm aa"
                    minDate={newEvent.startDate ? new Date(newEvent.startDate) : undefined}
                    customInput={
                      <div className="relative w-full">
                        <Input
                          value={newEvent.endDate ? format(new Date(newEvent.endDate), 'MMM d, yyyy h:mm aa') : ''}
                          readOnly
                          className="cursor-pointer pl-10"
                        />
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      </div>
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Event Type</Label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as typeof newEvent.type })}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                >
                  <option value="homework">Homework</option>
                  <option value="study">Study Session</option>
                  <option value="meeting">Meeting</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              {newEvent.type === 'other' && (
                <div className="grid gap-2">
                  <Label htmlFor="customType">Custom Event Type</Label>
                  <Input
                    id="customType"
                    value={newEvent.customType || ''}
                    onChange={(e) => setNewEvent({ ...newEvent, customType: e.target.value })}
                    placeholder="Enter custom event type"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => setIsAddEventOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => handleAddEvent(newEvent)}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600"
              >
                Add Event
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Event Details Dialog */}
        <Dialog open={isEventDetailsOpen} onOpenChange={setIsEventDetailsOpen}>
          <DialogContent className="w-[95vw] max-w-[525px] bg-white dark:bg-gray-900">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl font-bold flex items-center gap-3">
                {selectedEvent?.title.replace(/[📋👥📚📝🎯]/g, '').trim()}
              </DialogTitle>
              {selectedEvent?.sourceName && (
                <DialogDescription className="text-base text-gray-600 dark:text-gray-400">
                  {selectedEvent.sourceName}
                </DialogDescription>
              )}
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-900/20">
                      <CalendarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Start</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedEvent && selectedEvent.start && !isNaN(selectedEvent.start.getTime())
                          ? format(selectedEvent.start, 'PPp')
                          : 'Invalid date'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-span-1 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-md bg-purple-50 dark:bg-purple-900/20">
                      <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">End</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedEvent && selectedEvent.end && !isNaN(selectedEvent.end.getTime())
                          ? format(selectedEvent.end, 'PPp')
                          : 'Invalid date'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {selectedEvent?.description && (
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedEvent.description}
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 mt-4">
              {selectedEvent?.source === 'personal' && (
                <>
                  {!selectedEvent.completed && (
                    <Button
                      onClick={() => {
                        handleEventComplete(selectedEvent);
                        setIsEventDetailsOpen(false);
                      }}
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Complete
                    </Button>
                  )}
                  {selectedEvent.cleared ? (
                    <Button
                      onClick={() => handleUnclearEvent(selectedEvent.id)}
                      variant="outline"
                      size="sm"
                      className="text-blue-500 hover:text-blue-600"
                    >
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      Restore to Calendar
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleClearEvent(selectedEvent.id)}
                      variant="outline"
                      size="sm"
                      className="text-orange-500 hover:text-orange-600"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </>
              )}
              {selectedEvent?.source !== 'personal' && (
                <Button
                  onClick={() => {
                    navigateToSource(selectedEvent!.source, selectedEvent!.sourceId);
                    setIsEventDetailsOpen(false);
                  }}
                  size="sm"
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                  View in {selectedEvent?.source === 'team' ? 'Team' : 'Study Group'}
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsEventDetailsOpen(false)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Task Details Dialog */}
        <Dialog open={isTaskDetailsOpen} onOpenChange={setIsTaskDetailsOpen}>
          <DialogContent className="w-[95vw] max-w-[525px] bg-white dark:bg-gray-900">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                {selectedTask?.title}
              </DialogTitle>
              {selectedTask?.sourceName && (
                <DialogDescription className="text-base text-gray-600 dark:text-gray-400">
                  {selectedTask.sourceName}
                </DialogDescription>
              )}
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-blue-50 dark:bg-blue-900/20">
                      <CalendarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedTask && format(new Date(selectedTask.dueDate), 'PPp')}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-span-1 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-green-50 dark:bg-green-900/20">
                      {selectedTask?.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <Circle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedTask?.completed ? 'Completed' : 'Pending'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {selectedTask?.description && (
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedTask.description}
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              {selectedTask?.source === 'team' && (
                <Button
                  onClick={() => {
                    navigateToSource('team', selectedTask.sourceId);
                    setIsTaskDetailsOpen(false);
                  }}
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                  View in Team
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setIsTaskDetailsOpen(false)}
                className="bg-white dark:bg-gray-800"
              >
                Close
              </Button>
              {!selectedTask?.completed && (
                <Button
                  onClick={() => {
                    toggleTaskCompletion(selectedTask!.id);
                    setIsTaskDetailsOpen(false);
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark Complete
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Add responsive styles for calendar */}
        <style jsx global>{`
          /* Calendar Styles */
          .rbc-calendar {
            background-color: transparent !important;
            font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
            border-radius: 0.5rem !important;
            overflow: visible !important;
            height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
          }

          .dark .rbc-calendar {
            color: #fff;
          }

          /* Month View Styles */
          .rbc-month-view {
            flex: 1 1 0 !important;
            height: 100% !important;
            min-height: 0 !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
          }

          .rbc-month-header {
            flex: 0 0 auto !important;
          }

          .rbc-month-row {
            flex: 1 1 0 !important;
            min-height: 0 !important;
            overflow: hidden !important;
            display: flex !important;
          }

          .rbc-row-bg {
            display: flex !important;
            flex: 1 1 0 !important;
            min-height: inherit !important;
          }

          .rbc-row-content {
            margin: 0 !important;
            padding: 2px !important;
            flex: 1 !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden !important;
          }

          .rbc-date-cell {
            padding: 4px !important;
            text-align: center !important;
            flex: 1 !important;
          }

          .rbc-day-bg {
            flex: 1 1 0 !important;
          }

          .rbc-month-view .rbc-header {
            padding: 8px 3px !important;
            font-weight: 500 !important;
            font-size: 0.875rem !important;
          }

          .rbc-month-view .rbc-header + .rbc-header {
            border-left: 1px solid #e5e7eb !important;
          }

          .dark .rbc-month-view .rbc-header + .rbc-header {
            border-left: 1px solid rgba(255, 255, 255, 0.1) !important;
          }

          .rbc-off-range-bg {
            background-color: rgba(0, 0, 0, 0.03) !important;
          }

          .dark .rbc-off-range-bg {
            background-color: rgba(255, 255, 255, 0.03) !important;
          }

          .rbc-date-cell {
            padding: 4px !important;
            text-align: center !important;
            font-size: 0.875rem !important;
          }

          .rbc-date-cell.rbc-now {
            font-weight: bold !important;
            color: #6366f1 !important;
          }

          .rbc-row-segment {
            padding: 2px 4px !important;
          }

          /* Event Styles */
          .rbc-event {
            padding: 0 !important;
            border: none !important;
            margin: 1px 0 !important;
            background: none !important;
          }

          .rbc-event-content {
            height: 100% !important;
            width: 100% !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            background: none !important;
          }

          .rbc-event-label {
            display: none !important;
          }

          .rbc-event.rbc-selected {
            background: none !important;
            box-shadow: 0 0 0 1px rgba(147, 51, 234, 0.5) !important;
          }

          .rbc-event:hover {
            transform: translateY(-1px) !important;
          }

          /* Week/Day View Improvements */
          .rbc-time-view .rbc-time-content {
            min-height: 600px !important;
          }

          .rbc-time-view .rbc-event {
            padding: 2px 4px !important;
          }

          /* Fix event positioning */
          .rbc-event {
            z-index: 1 !important;
          }

          .rbc-event-content {
            z-index: 2 !important;
          }

          /* Responsive Calendar Styles */
          @media (max-width: 768px) {
            .rbc-calendar {
              font-size: 0.875rem !important;
            }

            .rbc-toolbar {
              flex-direction: column !important;
              align-items: stretch !important;
              gap: 0.5rem !important;
            }

            .rbc-toolbar-label {
              text-align: center !important;
              margin: 0.5rem 0 !important;
            }

            .rbc-btn-group {
              justify-content: center !important;
            }

            .rbc-header {
              padding: 4px !important;
              font-size: 0.75rem !important;
            }

            .rbc-date-cell {
              padding: 2px !important;
              font-size: 0.75rem !important;
            }

            .rbc-event {
              margin: 1px 0 !important;
            }

            .rbc-event-content {
              font-size: 0.7rem !important;
            }
          }

          /* Improve touch targets on mobile */
          @media (max-width: 768px) {
            .rbc-button-link {
              padding: 8px !important;
            }

            .rbc-event {
              min-height: 24px !important;
            }
          }

          /* Adjust calendar header for small screens */
          @media (max-width: 480px) {
            .rbc-toolbar {
              font-size: 0.875rem !important;
            }

            .rbc-btn-group button {
              padding: 4px 8px !important;
            }
          }

          /* Ensure proper spacing in month view on mobile */
          @media (max-width: 768px) {
            .rbc-month-view {
              min-height: 400px !important;
            }

            .rbc-month-row {
              min-height: 80px !important;
            }
          }
        `}</style>
      </motion.div>
    </div>
  );
}

export default DashboardPage; 