import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Info, Users, LogOut, Trash2 } from 'lucide-react';
import { TeamDetailsDialog } from './TeamDetailsDialog';
import { TeamMembersDialog } from './TeamMembersDialog';
import { DeleteTeamDialog } from './DeleteTeamDialog';
import { Team } from '@/types/team';

interface TeamMember {
  userId?: {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
    profilePicture: string;
  };
  _id?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  profilePicture?: string;
  role: string;
}

interface TeamTableProps {
  teams: Team[];
  currentUserId: string;
  onLeave: (teamId: string) => void;
  onDelete: (teamId: string) => void;
  onJoin?: (teamId: string) => void;
  showJoinButton?: boolean;
}

export const TeamTable: React.FC<TeamTableProps> = ({
  teams,
  currentUserId,
  onLeave,
  onDelete,
  onJoin,
  showJoinButton = false,
}) => {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const getUserRole = (team: Team) => {
    // Check if user is the creator (always admin) or has admin role
    if (team.createdBy._id === currentUserId || 
        team.members.some(m => m.userId?._id === currentUserId && m.role === 'admin')) {
      return 'Admin';
    }

    // Find user's role in team members
    const member = team.members?.find(m => m?.userId?._id === currentUserId);
    if (!member) return 'Member';

    // Capitalize first letter of role
    return member.role.charAt(0).toUpperCase() + member.role.slice(1);
  };

  const isUserInTeam = (team: Team) => {
    return team.createdBy._id === currentUserId || 
           team.members.some(m => m.userId?._id === currentUserId);
  };

  const isUserAdmin = (team: Team) => {
    return team.createdBy._id === currentUserId || 
           team.members.some(m => m.userId?._id === currentUserId && m.role === 'admin');
  };

  const handleViewDetails = (team: Team) => {
    setSelectedTeam(team);
    setIsDetailsOpen(true);
  };

  const handleMembersClick = (team: Team, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTeam(team);
    setIsMembersOpen(true);
  };

  const handleDeleteClick = (team: Team, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTeam(team);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedTeam) {
      onDelete(selectedTeam._id);
      setIsDeleteOpen(false);
      setSelectedTeam(null);
    }
  };

  return (
    <>
      <div className="relative overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
            <TableRow>
              <TableCell className="w-[40%] font-semibold">Team Name</TableCell>
              <TableCell className="w-[20%] font-semibold">Your Role</TableCell>
              <TableCell className="w-[15%] text-center font-semibold">Members</TableCell>
              <TableCell className="w-[15%] text-center font-semibold">Tasks</TableCell>
              <TableCell className="w-[10%] text-right font-semibold">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((team) => {
              const userRole = team.members.find((m: any) => m.userId._id === currentUserId)?.role || 'none';
              const isAdmin = userRole === 'admin' || team.createdBy._id === currentUserId;
              const activeTasks = team.tasks.filter((task: any) => task.status !== 'completed').length;

              return (
                <TableRow key={team._id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {team.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={isAdmin ? 
                        "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" : 
                        "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      }
                    >
                      {isAdmin ? 'Admin' : userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      onClick={(e) => handleMembersClick(team, e)}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{team.members.length}</span>
                      </div>
                    </Button>
                  </TableCell>
                  <TableCell className="text-center">
                    {activeTasks}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        onClick={() => handleViewDetails(team)}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                      {showJoinButton && onJoin && userRole === 'none' ? (
                        <Button
                          variant="default"
                          size="sm"
                          className="h-8 bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={() => onJoin(team._id)}
                        >
                          Join
                        </Button>
                      ) : isAdmin ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          onClick={(e) => handleDeleteClick(team, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          onClick={() => onLeave(team._id)}
                        >
                          <LogOut className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <TeamDetailsDialog
        team={selectedTeam}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedTeam(null);
        }}
        currentUserId={currentUserId}
      />

      <TeamMembersDialog
        team={selectedTeam}
        isOpen={isMembersOpen}
        onClose={() => {
          setIsMembersOpen(false);
          setSelectedTeam(null);
        }}
      />

      <DeleteTeamDialog
        teamName={selectedTeam?.name || ''}
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedTeam(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}; 