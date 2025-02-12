import 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      email: string;
      name: string;
      firstname?: string;
      lastname?: string;
      role?: string;
      profilePicture?: string;
      bio?: string;
      major?: string;
      school?: string;
      year?: string;
      preferences?: {
        studyPreferences?: string[];
        subjects?: string[];
        availability?: string[];
      };
    }
  }

  interface User {
    accessToken?: string;
    id: string;
    email: string;
    name: string;
    firstname?: string;
    lastname?: string;
    role?: string;
    profilePicture?: string;
    bio?: string;
    major?: string;
    school?: string;
    year?: string;
    preferences?: {
      studyPreferences?: string[];
      subjects?: string[];
      availability?: string[];
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    id: string;
    email: string;
    name: string;
    user?: {
      id: string;
      email: string;
      name: string;
      firstname?: string;
      lastname?: string;
      role?: string;
      profilePicture?: string;
      bio?: string;
      major?: string;
      school?: string;
      year?: string;
      preferences?: {
        studyPreferences?: string[];
        subjects?: string[];
        availability?: string[];
      };
    };
  }
} 