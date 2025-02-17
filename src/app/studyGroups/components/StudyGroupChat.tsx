'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChatContainer } from '@/components/Chat/ChatContainer';

interface StudyGroupChatProps {
  groupId: string;
}

export function StudyGroupChat({ groupId }: StudyGroupChatProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Study Group Chat</CardTitle>
        <CardDescription>Chat with your study group members in real-time</CardDescription>
      </CardHeader>
      <CardContent>
        <ChatContainer roomId={groupId} roomType="study-group" />
      </CardContent>
    </Card>
  );
} 