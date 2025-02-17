'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChatContainer } from '@/components/Chat/ChatContainer';

interface TeamChatProps {
  teamId: string;
}

export function TeamChat({ teamId }: TeamChatProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Chat</CardTitle>
        <CardDescription>Chat with your team members in real-time</CardDescription>
      </CardHeader>
      <CardContent>
        <ChatContainer roomId={teamId} roomType="team" />
      </CardContent>
    </Card>
  );
} 