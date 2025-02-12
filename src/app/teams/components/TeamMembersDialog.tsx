import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Team } from '@/types/team';
import { User } from '@/types/user';
import { UserProfileDialog } from '@/components/UserProfileDialog';

interface TeamMembersDialogProps {
  team: Team | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TeamMembersDialog: React.FC<TeamMembersDialogProps> = ({
  team,
  isOpen,
  onClose,
}) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);

  if (!team) return null;

  const handleUserClick = (user: User) => {
    const completeUser = {
      _id: user._id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      profilePicture: user.profilePicture,
      role: user.role || 'user'
    };
    setSelectedUser(completeUser);
    setIsUserProfileOpen(true);
  };

  const getInitials = (firstname?: string, lastname?: string) => {
    const firstInitial = firstname ? firstname[0] : '';
    const lastInitial = lastname ? lastname[0] : '';
    return firstInitial + lastInitial || '??';
  };

  // Filter out members that are the creator or have missing data
  const filteredMembers = team.members.filter(member => 
    member.userId && 
    member.userId._id && 
    member.userId._id !== team.createdBy._id &&
    member.userId.firstname && 
    member.userId.lastname
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-800/95 dark:backdrop-blur-xl border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Team Members ({team.name})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Team Creator - Only show if creator data exists */}
            {team.createdBy && team.createdBy._id && (
              <div 
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors duration-200"
                onClick={() => handleUserClick(team.createdBy)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={team.createdBy.profilePicture} 
                      alt={`${team.createdBy.firstname || ''} ${team.createdBy.lastname || ''}`} 
                    />
                    <AvatarFallback>
                      {getInitials(team.createdBy.firstname, team.createdBy.lastname)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {team.createdBy.firstname || ''} {team.createdBy.lastname || ''}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {team.createdBy.email}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                  Admin
                </Badge>
              </div>
            )}

            {/* Team Members */}
            {filteredMembers.map((member) => {
              const user = member.userId;
              if (!user) return null;

              return (
                <div 
                  key={user._id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors duration-200"
                  onClick={() => handleUserClick(user)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={user.profilePicture} 
                        alt={`${user.firstname || ''} ${user.lastname || ''}`} 
                      />
                      <AvatarFallback>
                        {getInitials(user.firstname, user.lastname)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {user.firstname || ''} {user.lastname || ''}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={
                      member.role === 'admin' 
                        ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                        : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    }
                  >
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </Badge>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <UserProfileDialog
        user={selectedUser}
        isOpen={isUserProfileOpen}
        onClose={() => {
          setIsUserProfileOpen(false);
          setSelectedUser(null);
        }}
      />
    </>
  );
}; 