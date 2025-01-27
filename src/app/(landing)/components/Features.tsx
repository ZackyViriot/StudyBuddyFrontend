'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, BookOpen, Calendar, X, Check, Clock, ChevronRight } from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const getContainerHeight = (title: string): string => {
  switch (title) {
    case "Track Progress":
      return "h-[600px]";
    case "Share Resources":
      return "h-[400px]";
    case "Create Study Groups":
      return "h-[320px]";
    default:
      return "h-[400px]";
  }
};

const DemoModal = ({ isOpen, onClose, title, children }: DemoModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const containerHeight = getContainerHeight(title);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && isMounted) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isMounted]);

  if (!isOpen) return null;
  if (!isMounted) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-6xl overflow-hidden flex"
        >
          {/* Description Sidebar - Now on the left */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="w-80 border-r border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900/50"
          >
            <div className="space-y-6">
              {title === "Create Study Groups" && (
                <>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Create Your Group</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Start by naming your study group and selecting your subject area. You can create groups for any course or topic.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Set Schedule</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Choose when and how often your group meets. Set regular sessions or flexible meeting times.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Invite Members</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Add fellow students to your group. They'll receive invitations and can join with one click.
                    </p>
                  </div>
                </>
              )}

              {title === "Share Resources" && (
                <>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Upload Materials</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Share notes, documents, and study guides with your group. Support for PDFs, images, and more.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Real-time Chat</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Discuss topics, ask questions, and collaborate in real-time with group chat.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Resource Library</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      All shared resources are organized and easily accessible in your group's library.
                    </p>
                  </div>
                </>
              )}

              {title === "Track Progress" && (
                <>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Study Calendar</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Keep track of study sessions, deadlines, and important dates in one place.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Progress Tracking</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Monitor your progress in different topics. Set goals and track your improvement over time.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Analytics</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Get insights into your study habits and performance with detailed analytics.
                    </p>
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This is a preview of how the feature will work. The actual interface may vary slightly.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`bg-white dark:bg-gray-800 rounded-lg overflow-hidden ${containerHeight}`}
              >
                {isLoading ? (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    {title === "Track Progress" ? (
                      <div className="w-full h-full flex flex-col gap-8 p-6">
                        <div className="flex-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg animate-pulse" />
                        <div className="space-y-4">
                          <div className="h-2 w-full bg-gray-100 dark:bg-gray-700/50 rounded-full animate-pulse" />
                          <div className="h-2 w-3/4 bg-gray-100 dark:bg-gray-700/50 rounded-full animate-pulse" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <motion.div
                          animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 180, 360],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear"
                          }}
                          className="w-12 h-12 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full"
                        />
                        <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">Loading preview...</p>
                      </>
                    )}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="h-full"
                  >
                    {children}
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const StudyGroupDemo = () => {
  const [step, setStep] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (isMounted) {
      const timer = setInterval(() => {
        setStep((prev) => (prev + 1) % 3);
      }, 2000);
      return () => clearInterval(timer);
    }
  }, [isMounted]);

  if (!isMounted) return null;

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white">
            <Users size={18} />
          </div>
          <h4 className="font-medium">Advanced Algorithms Study Group</h4>
        </div>
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
          >
            <Check size={16} className="text-green-500" />
            <span>Computer Science - Algorithm Analysis</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
          >
            <Clock size={16} className="text-indigo-500" />
            <span>Weekly sessions on Thursdays at 4:00 PM</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
          >
            <Users size={16} className="text-indigo-500" />
            <span>8 members</span>
          </motion.div>
        </div>
      </div>
      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
        <h4 className="font-medium mb-3">Active Members</h4>
        <div className="flex -space-x-2">
          {["A", "B", "C", "D", "E"].map((initial, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 border-2 border-white dark:border-gray-800 flex items-center justify-center text-sm font-medium text-indigo-600 dark:text-indigo-400"
            >
              {initial}
            </motion.div>
          ))}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-medium text-indigo-600 dark:text-indigo-400"
          >
            +3
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const ResourcesDemo = () => {
  const [activeMessage, setActiveMessage] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (isMounted) {
      const timer = setInterval(() => {
        setActiveMessage((prev) => (prev + 1) % 3);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [isMounted]);

  if (!isMounted) return null;

  const messages = [
    {
      user: "Alice Chen",
      message: "Here are my notes from today's session on Dynamic Programming",
      time: "2:30 PM",
      attachment: "dp_notes.pdf"
    },
    {
      user: "Bob Smith",
      message: "Found this great video explaining the knapsack problem",
      time: "2:45 PM",
      link: "https://example.com/video"
    },
    {
      user: "Carol Johnson",
      message: "I created a practice problem set for next week",
      time: "3:15 PM",
      attachment: "practice_problems.pdf"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-4">
        {messages.map((chat, i) => (
          <motion.div
            key={i}
            initial={false}
            animate={{
              scale: activeMessage === i ? 1 : 0.95,
              opacity: activeMessage === i ? 1 : 0.5,
            }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              {chat.user[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{chat.user}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{chat.time}</span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">{chat.message}</p>
              {chat.attachment && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400"
                >
                  <BookOpen size={16} />
                  {chat.attachment}
                </motion.div>
              )}
              {chat.link && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400"
                >
                  <BookOpen size={16} />
                  View Video
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

interface CalendarTask {
  title: string;
  time: string;
  type: string;
}

const ProgressDemo = () => {
  const [activeProgress, setActiveProgress] = useState(0);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (isMounted) {
      const timer = setInterval(() => {
        setActiveProgress((prev) => (prev + 1) % 2);
      }, 2000);
      return () => clearInterval(timer);
    }
  }, [isMounted]);

  if (!isMounted) return null;

  // Update progress data based on selected day
  const getProgressData = (day: number | null) => {
    switch (day) {
      case 4:
        return [
          { topic: "Dynamic Programming", progress: 80 },
          { topic: "Recursion", progress: 90 }
        ];
      case 8:
        return [
          { topic: "Graph Theory", progress: 65 },
          { topic: "BFS/DFS", progress: 75 }
        ];
      case 12:
        return [
          { topic: "Project Planning", progress: 40 },
          { topic: "Team Collaboration", progress: 85 }
        ];
      default:
        return [
          { topic: "Overall Progress", progress: 70 },
          { topic: "Weekly Goals", progress: 60 }
        ];
    }
  };

  // Update goals based on selected day
  const getGoals = (day: number | null) => {
    switch (day) {
      case 4:
        return [
          { title: "Complete DP Exercises", deadline: "2 days left", color: "green" },
          { title: "Review Recursion Notes", deadline: "Today", color: "yellow" }
        ];
      case 8:
        return [
          { title: "Graph Theory Quiz", deadline: "5 days left", color: "red" },
          { title: "Practice Problems", deadline: "3 days left", color: "yellow" }
        ];
      case 12:
        return [
          { title: "Group Project Meeting", deadline: "Today", color: "green" },
          { title: "Submit Progress Report", deadline: "Tomorrow", color: "indigo" }
        ];
      default:
        return [
          { title: "Complete DP Course", deadline: "2 days left", color: "green" },
          { title: "Graph Theory Quiz", deadline: "5 days left", color: "yellow" },
          { title: "Group Project", deadline: "Next week", color: "indigo" }
        ];
    }
  };

  const calendarData: Record<number, CalendarTask> = {
    4: { title: "Dynamic Programming Study", time: "2:00 PM", type: "study" },
    8: { title: "Graph Theory Quiz", time: "3:30 PM", type: "quiz" },
    12: { title: "Group Project Meeting", time: "4:00 PM", type: "meeting" },
    15: { title: "Algorithm Practice", time: "2:30 PM", type: "practice" },
    20: { title: "Mock Interview", time: "5:00 PM", type: "interview" }
  };

  const getTaskColor = (type: string) => {
    switch (type) {
      case 'study': return 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200';
      case 'quiz': return 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200';
      case 'meeting': return 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200';
      case 'practice': return 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200';
      case 'interview': return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200';
      default: return 'bg-white dark:bg-gray-800';
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Left Column: Calendar */}
      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <h4 className="font-medium mb-4">Study Calendar</h4>
          <div className="grid grid-cols-7 gap-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-sm font-medium py-1">
                {day}
              </div>
            ))}
            {Array.from({ length: 28 }).map((_, i) => {
              const day = i + 1;
              const hasTask = calendarData[day];
              return (
                <motion.div
                  key={i}
                  initial={false}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setSelectedDay(hasTask ? day : null)}
                  className={`
                    aspect-square rounded-lg flex flex-col items-center justify-center text-sm cursor-pointer
                    ${hasTask ? getTaskColor(hasTask.type) : 'bg-white dark:bg-gray-800'}
                    ${selectedDay === day ? 'ring-2 ring-indigo-500' : ''}
                  `}
                >
                  <span>{day}</span>
                  {hasTask && (
                    <div className="w-1.5 h-1.5 rounded-full bg-current mt-1" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details */}
        {selectedDay && calendarData[selectedDay] && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm"
          >
            <h5 className="font-medium mb-2">
              {calendarData[selectedDay].title}
            </h5>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Clock size={14} />
              <span>{calendarData[selectedDay].time}</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Right Column: Progress and Goals */}
      <div className="space-y-4">
        {/* Progress Section */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
          <h4 className="font-medium mb-3">Progress Tracking</h4>
          <div className="space-y-3">
            {getProgressData(selectedDay).map((item, i) => (
              <motion.div
                key={i}
                initial={false}
                animate={{
                  scale: activeProgress === i ? 1 : 0.98,
                  opacity: activeProgress === i ? 1 : 0.7,
                }}
              >
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.topic}</span>
                  <span>{item.progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${item.progress}%` }}
                    transition={{ duration: 1, delay: i * 0.2 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Goals Section */}
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <h4 className="font-medium mb-3">Study Goals</h4>
          <div className="space-y-3">
            {getGoals(selectedDay).map((goal, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full bg-${goal.color}-500`} />
                  <span className="text-sm">{goal.title}</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{goal.deadline}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export function Features() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  const features = [
    {
      id: "study-groups",
      title: "Create Study Groups",
      description: "Form or join study groups based on your courses and interests.",
      icon: Users,
      demo: <StudyGroupDemo />
    },
    {
      id: "resources",
      title: "Share Resources",
      description: "Exchange notes, materials, and helpful resources with your group.",
      icon: BookOpen,
      demo: <ResourcesDemo />
    },
    {
      id: "progress",
      title: "Track Progress",
      description: "Monitor your study progress and schedule with our tools.",
      icon: Calendar,
      demo: <ProgressDemo />
    }
  ];

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Everything you need to study effectively
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Our platform provides all the tools you need to succeed in your studies.
          </p>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <motion.div
              key={feature.id}
              whileHover={{ scale: 1.02 }}
              className="relative bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setActiveDemo(feature.id)}
            >
              <div className="w-12 h-12 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white mb-4">
                <feature.icon size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              <div className="mt-4">
                <button
                  className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300"
                >
                  View Demo →
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {features.map((feature) => (
          <DemoModal
            key={feature.id}
            isOpen={activeDemo === feature.id}
            onClose={() => setActiveDemo(null)}
            title={feature.title}
          >
            {feature.demo}
          </DemoModal>
        ))}
      </div>
    </section>
  );
} 
