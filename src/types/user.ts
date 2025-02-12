export enum UserRole {
    USER = 'user',
    ADMIN = 'admin'
}

export interface User {
  _id: string;
  firstname: string;
  lastname: string;
  name?: string;
  email: string;
  username?: string;
  profilePicture?: string;
  bio?: string;
  major?: string;
  school?: string;
  year?: string;
  role: 'user' | 'admin';
  studyPreferences?: string;
  subjects?: string;
  availability?: string;
}

export interface UserPreferences {
  studyPreferences: string[];
  subjects: string[];
  availability: string[];
} 