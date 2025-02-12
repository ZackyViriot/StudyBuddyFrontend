'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function TestAuth() {
  const { data: session, status } = useSession();

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Auth Test Page</h1>
      <pre className="bg-gray-100 p-4 rounded mb-4">
        {JSON.stringify({ session, status }, null, 2)}
      </pre>
      
      {status === 'authenticated' ? (
        <Button onClick={() => signOut()}>Sign Out</Button>
      ) : (
        <Button onClick={() => signIn()}>Sign In</Button>
      )}
    </div>
  );
} 