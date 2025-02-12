import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface Task {
  _id: string;
  title: string;
  status: string;
  dueDate: string;
}

interface DailyTasksProps {
  tasks: Task[];
  onTaskComplete: (taskId: string) => void;
}

export const DailyTasks: React.FC<DailyTasksProps> = ({ tasks, onTaskComplete }) => {
  const todayTasks = tasks.filter(task => 
    new Date(task.dueDate).toDateString() === new Date().toDateString()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {todayTasks.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">You&apos;re all caught up!</p>
          ) : (
            todayTasks.map((task) => (
              <div key={task._id} className="flex items-center space-x-2">
                <Checkbox
                  id={task._id}
                  checked={task.status === 'completed'}
                  onCheckedChange={() => onTaskComplete(task._id)}
                />
                <label
                  htmlFor={task._id}
                  className={`text-sm ${
                    task.status === 'completed' ? 'line-through text-muted-foreground' : ''
                  }`}
                >
                  {task.title}
                </label>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 