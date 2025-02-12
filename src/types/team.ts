import { User } from './user';

export interface TeamMember {
  userId: User;
  role: 'admin' | 'moderator' | 'member';
  joinedAt?: Date;
}

export interface TeamGoal {
  _id?: string;
  title: string;
  description?: string;
  targetDate: Date;
  status: 'active' | 'achieved';
  progress?: number;
}

export interface TeamTask {
  _id?: string;
  title: string;
  description?: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo: User | User[];
  progress?: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Team {
  _id: string;
  name: string;
  description?: string;
  createdBy: User;
  members: TeamMember[];
  goals: TeamGoal[];
  tasks: TeamTask[];
  chatId?: string;
  joinCode: string;
  createdAt: Date;
  updatedAt?: Date;
} 