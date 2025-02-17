'use client';

import { TeamPageClient } from './TeamPageClient';

interface TeamPageProps {
  teamId: string;
}

export function TeamPage({ teamId }: TeamPageProps) {
  return <TeamPageClient teamId={teamId} />;
} 