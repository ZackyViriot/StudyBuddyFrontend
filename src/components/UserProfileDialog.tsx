import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from '@/types/team';
import { Mail, User as UserIcon } from 'lucide-react';

interface UserProfileDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileDialog: React.FC<UserProfileDialogProps> = ({
  user,
  isOpen,
  onClose,
}) => {
  if (!user) return null;

  const getInitials = (firstname?: string, lastname?: string) => {
    const firstInitial = firstname ? firstname[0] : '';
    const lastInitial = lastname ? lastname[0] : '';
    return firstInitial + lastInitial || '??';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white dark:bg-gray-800/90 shadow-lg border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm rounded-xl">
        <DialogHeader className="border-b border-gray-100 dark:border-gray-700/50 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl">
              <UserIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                User Profile
              </DialogTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View user details</p>
            </div>
          </div>
          <div className="flex flex-col items-center space-y-4 pt-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur opacity-75"></div>
              <Avatar className="relative h-24 w-24 border-4 border-white dark:border-gray-800 shadow-xl">
                <AvatarImage 
                  src={user.profilePicture} 
                  alt={`${user.firstname || ''} ${user.lastname || ''}`} 
                />
                <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-2xl">
                  {getInitials(user.firstname, user.lastname)}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                {user.firstname || ''} {user.lastname || ''}
              </h2>
              <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                <Mail className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm text-gray-600 dark:text-gray-300">{user.email || 'No email provided'}</span>
              </div>
            </div>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}; 