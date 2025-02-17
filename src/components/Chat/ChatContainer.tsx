'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Socket, io } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Send } from 'lucide-react';

interface Message {
  _id: string;
  content: string;
  senderId: {
    _id: string;
    username: string;
    firstname: string;
    lastname: string;
    profilePicture?: string;
  };
  createdAt: string;
  isEdited: boolean;
  isPending?: boolean;
}

interface ChatContainerProps {
  roomId: string;
  roomType: 'team' | 'study-group';
}

export function ChatContainer({ roomId, roomType }: ChatContainerProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sentMessages] = useState(new Set<string>());

  useEffect(() => {
    // Get user data from localStorage
    const userDataStr = localStorage.getItem('user');
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        setCurrentUser(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token available in localStorage');
      return;
    }

    const socketInstance = io(`${process.env.NEXT_PUBLIC_API_URL}`, {
      auth: {
        token: token,
      },
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('Connected to chat server');
      socketInstance.emit('joinRoom', { roomId, roomType });
    });

    socketInstance.on('connected', (data) => {
      console.log('Received connection acknowledgment:', data);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to chat server. Retrying...',
        variant: 'destructive',
      });
    });

    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
      toast({
        title: 'Error',
        description: error.message || 'An error occurred with the chat connection',
        variant: 'destructive',
      });
    });

    socketInstance.on('message', (message: Message) => {
      // Check if we've already added this message (either via optimistic update or previous receipt)
      if (!sentMessages.has(message._id)) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }
    });

    socketInstance.on('userTyping', ({ userId, username, isTyping }) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        if (isTyping) {
          newSet.add(username);
        } else {
          newSet.delete(username);
        }
        return newSet;
      });
    });

    setSocket(socketInstance);

    // Fetch previous messages
    fetchMessages();

    return () => {
      if (socketInstance) {
        socketInstance.emit('leaveRoom', { roomId, roomType });
        socketInstance.disconnect();
      }
    };
  }, [roomId, roomType]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token available for fetching messages');
        return;
      }

      console.log('Fetching messages with token:', token);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.endsWith('/')
        ? process.env.NEXT_PUBLIC_API_URL
        : `${process.env.NEXT_PUBLIC_API_URL}/`;
      
      const response = await fetch(
        `${apiUrl}api/messages?roomId=${roomId}&roomType=${roomType}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        console.error('Failed to fetch messages:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received messages data:', data);
      
      if (!Array.isArray(data)) {
        console.error('Received non-array data from messages API:', data);
        setMessages([]);
        return;
      }

      // Sort messages by date, oldest to newest
      const sortedMessages = data.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setMessages(sortedMessages);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]); // Ensure messages is always an array
      toast({
        title: 'Error',
        description: 'Failed to load messages. Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!socket || !newMessage.trim() || !token) return;

    try {
      const tempId = Date.now().toString();
      const optimisticMessage: Message = {
        _id: tempId,
        content: newMessage.trim(),
        senderId: {
          _id: currentUser._id || '',
          username: currentUser.username || '',
          firstname: currentUser.firstname || '',
          lastname: currentUser.lastname || '',
          profilePicture: currentUser.profilePicture || '',
        },
        createdAt: new Date().toISOString(),
        isEdited: false,
        isPending: true,
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      sentMessages.add(tempId);

      socket.emit('sendMessage', {
        content: newMessage.trim(),
        roomId,
        roomType,
      }, (response: any) => {
        if (response.error) {
          throw new Error(response.error);
        }
        // Update the optimistic message with the real one
        setMessages((prev) => 
          prev.map(msg => 
            msg._id === tempId ? { ...response.message, isPending: false } : msg
          )
        );
        sentMessages.add(response.message._id);
      });

      setNewMessage('');
      setIsTyping(false);
      socket.emit('typing', { roomId, roomType, isTyping: false });
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (!socket) return;

    if (!isTyping && e.target.value) {
      setIsTyping(true);
      socket.emit('typing', { roomId, roomType, isTyping: true });
    } else if (isTyping && !e.target.value) {
      setIsTyping(false);
      socket.emit('typing', { roomId, roomType, isTyping: false });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUserInitials = (firstname: string, lastname: string) => {
    return `${firstname.charAt(0)}${lastname.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="flex flex-col h-full bg-background border rounded-lg shadow-sm overflow-hidden font-outfit">
      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col justify-end min-h-full py-4">
          <div className="flex flex-col space-y-4">
            {messages.map((message, index) => {
              const isCurrentUser = message.senderId._id === currentUser?._id;
              const showAvatar = index === 0 || 
                messages[index - 1].senderId._id !== message.senderId._id;
              const isLastInGroup = index === messages.length - 1 || 
                messages[index + 1]?.senderId._id !== message.senderId._id;

              return (
                <div
                  key={message._id}
                  className={cn(
                    "flex gap-3 group animate-in slide-in-from-bottom-2",
                    isCurrentUser ? "flex-row-reverse" : "flex-row",
                    !isLastInGroup && "mb-2"
                  )}
                >
                  <div
                    className={cn(
                      "flex flex-col max-w-[80%] space-y-1",
                      isCurrentUser ? "items-end" : "items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "relative rounded-2xl px-4 py-2.5 text-sm break-words transition-all duration-300",
                        isCurrentUser
                          ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:shadow-purple-500/25 hover:-translate-y-0.5"
                          : "bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/50 dark:to-indigo-900/50 text-foreground shadow-md hover:shadow-lg hover:shadow-purple-500/20 hover:-translate-y-0.5",
                        message.isPending && "opacity-70"
                      )}
                    >
                      {message.content}
                    </div>
                    <div className={cn(
                      "flex items-center gap-2 px-2 transition-opacity duration-200",
                      isCurrentUser ? "flex-row-reverse" : "flex-row",
                      "opacity-60 group-hover:opacity-100"
                    )}>
                      <span className={cn(
                        "text-xs font-medium",
                        isCurrentUser 
                          ? "text-purple-500 dark:text-purple-400" 
                          : "text-purple-600 dark:text-purple-500"
                      )}>
                        {isCurrentUser ? 'You' : `${message.senderId.firstname} ${message.senderId.lastname}`}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">
                        {formatTime(message.createdAt)}
                        {message.isEdited && " (edited)"}
                        {message.isPending && (
                          <span className="inline-flex items-center ml-1">
                            <span className="animate-pulse">sending</span>
                            <span className="inline-flex gap-0.5">
                              <span className="animate-bounce delay-0">.</span>
                              <span className="animate-bounce delay-100">.</span>
                              <span className="animate-bounce delay-200">.</span>
                            </span>
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {typingUsers.size > 0 && (
              <div className="flex items-start gap-3 animate-in fade-in-0 slide-in-from-bottom-2">
                <div className="flex flex-col max-w-[80%] space-y-1">
                  <div className="bg-purple-100 dark:bg-purple-900/30 text-muted-foreground rounded-2xl px-4 py-2.5 text-sm">
                    <span className="inline-flex items-center gap-1">
                      <span className="animate-pulse">
                        {Array.from(typingUsers).join(", ")} {typingUsers.size === 1 ? "is" : "are"} typing
                      </span>
                      <span className="inline-flex gap-0.5">
                        <span className="animate-bounce delay-0">.</span>
                        <span className="animate-bounce delay-100">.</span>
                        <span className="animate-bounce delay-200">.</span>
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </ScrollArea>

      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 rounded-full bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 focus:border-purple-500 shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-200"
          />
          <Button 
            type="submit" 
            size="icon" 
            className="rounded-full h-10 w-10 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105"
            disabled={!newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
} 