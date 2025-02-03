import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User } from '@/types/team';
import { Mail } from 'lucide-react';

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
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-800/95 dark:backdrop-blur-xl border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            User Profile
          </DialogTitle>
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage 
                src={user.profilePicture} 
                alt={`${user.firstname || ''} ${user.lastname || ''}`} 
              />
              <AvatarFallback className="text-2xl">
                {getInitials(user.firstname, user.lastname)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                {user.firstname || ''} {user.lastname || ''}
              </h2>
              <div className="flex items-center justify-center gap-2 mt-2 text-gray-500 dark:text-gray-400">
                <Mail className="h-4 w-4" />
                <span className="text-sm">{user.email || 'No email provided'}</span>
              </div>
            </div>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}; 