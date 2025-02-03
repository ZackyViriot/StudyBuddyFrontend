export interface User {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
  profilePicture: string;
}

export interface TeamMember {
  userId: User;
  role: string;
}

export interface TeamGoal {
  title: string;
  description?: string;
  targetDate: Date;
  status: 'active' | 'achieved';
}

export interface TeamTask {
  _id: string;
  title: string;
  status: string;
  dueDate: string;
  assignedTo?: User;
}

export interface Team {
  _id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  goals?: TeamGoal[];
  tasks: TeamTask[];
  createdBy: User;
} 