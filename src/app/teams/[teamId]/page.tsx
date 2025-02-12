import { TeamPageClient } from './TeamPageClient';
import { Navbar } from '@/app/(landing)/components/Navbar';
import { Suspense } from 'react';

export default function TeamPage({ params }: { params: { teamId: string } }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900/50 dark:to-gray-900/30">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
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
      </div>
    </div>
  );
} 