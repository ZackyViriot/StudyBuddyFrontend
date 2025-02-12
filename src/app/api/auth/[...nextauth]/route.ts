import NextAuth from 'next-auth';
import { AuthOptions } from 'next-auth';

const authOptions: AuthOptions = {
  providers: [],
  secret: process.env.NEXTAUTH_SECRET || 'your-development-secret-do-not-use-in-prod',
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    newUser: '/auth/signup'
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 