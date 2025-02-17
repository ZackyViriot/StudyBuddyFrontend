'use client';

import { TeamPageClient } from './TeamPageClient';
import { Navbar } from '@/app/(landing)/components/Navbar';
import { Suspense } from 'react';

export default function TeamPage({ params }: { params: { teamId: string } }) {
  return (
    <>
      <Navbar onLogin={() => {}} onSignup={() => {}} />
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-600/20 border-t-indigo-600 animate-spin" />
            </div>
          </div>
        }
      >
        <TeamPageClient teamId={params.teamId} />
      </Suspense>
    </>
  );
} 