'use client';

import { StudyGroupPageClient } from './StudyGroupPageClient';

interface StudyGroupPageProps {
  params: {
    groupId: string;
  };
}

export default function StudyGroupPage({ params }: StudyGroupPageProps) {
  return <StudyGroupPageClient groupId={params.groupId} />;
} 