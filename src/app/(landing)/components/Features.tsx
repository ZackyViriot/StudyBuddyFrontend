'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, BookOpen, Calendar, X } from 'lucide-react';

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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Left Column: Group List */}
      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <h4 className="font-medium mb-4">Your Study Groups</h4>
          <div className="space-y-2">
            {[
              { name: "Algorithm Masters", members: 4, lastActive: "2 hours ago" },
              { name: "Database Design", members: 3, lastActive: "1 day ago" },
              { name: "Web Development", members: 5, lastActive: "Just now" }
            ].map((group) => (
              <div
                key={group.name}
                className="p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">{group.name}</h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {group.members} members &bull; {group.lastActive}
                    </p>
                  </div>
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Group Details */}
      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <h4 className="font-medium mb-4">Group Details</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select a group to view details
          </p>
        </div>
      </div>
    </div>
  );
};

const ResourcesDemo = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Left Column: Resources */}
      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <h4 className="font-medium mb-4">Shared Resources</h4>
          <div className="space-y-2">
            {[
              { name: "Data Structures Notes", type: "PDF", shared: "Yesterday" },
              { name: "Algorithm Cheat Sheet", type: "Document", shared: "2 days ago" },
              { name: "Study Guide", type: "Spreadsheet", shared: "1 week ago" }
            ].map((resource) => (
              <div
                key={resource.name}
                className="p-3 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">{resource.name}</h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {resource.type} &bull; Shared {resource.shared}
                    </p>
                  </div>
                  <BookOpen className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Resource Preview */}
      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <h4 className="font-medium mb-4">Resource Preview</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select a resource to preview
          </p>
        </div>
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
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, [isMounted]);

  if (!isMounted) return null;

  const calendarData: Record<number, CalendarTask> = {
    4: { title: "Dynamic Programming Study", time: "2:00 PM", type: "study" },
    8: { title: "Graph Theory Quiz", time: "3:30 PM", type: "quiz" },
    12: { title: "Group Project Meeting", time: "4:00 PM", type: "meeting" },
    15: { title: "Algorithm Practice", time: "2:30 PM", type: "practice" },
    20: { title: "Mock Interview", time: "5:00 PM", type: "interview" }
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
                    ${hasTask ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200' : 'bg-white dark:bg-gray-800'}
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
      </div>

      {/* Right Column: Details */}
      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
          <h4 className="font-medium mb-4">Selected Day</h4>
          {selectedDay && calendarData[selectedDay] ? (
            <div className="space-y-2">
              <h5 className="font-medium">{calendarData[selectedDay].title}</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {calendarData[selectedDay].time}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select a day to view details
            </p>
          )}
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
