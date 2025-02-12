import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Info, Users, LogOut, Trash2, ExternalLink, CheckCircle2, Copy, Check } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { TeamDetailsDialog } from './TeamDetailsDialog';
import { TeamMembersDialog } from './TeamMembersDialog';
import { DeleteTeamDialog } from './DeleteTeamDialog';
import { Team } from '@/types/team';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [copiedTeamId, setCopiedTeamId] = useState<string | null>(null);

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

  const handleCopyCode = async (teamId: string, joinCode: string) => {
    await navigator.clipboard.writeText(joinCode);
    setCopiedTeamId(teamId);
    setTimeout(() => setCopiedTeamId(null), 2000);
  };

  return (
    <>
      <div className="relative overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
            <TableRow>
              <TableCell className="w-[35%] font-semibold">Team Name</TableCell>
              <TableCell className="w-[15%] font-semibold">Your Role</TableCell>
              <TableCell className="w-[15%] text-center font-semibold">Tasks</TableCell>
              <TableCell className="w-[15%] text-center font-semibold">Members</TableCell>
              <TableCell className="w-[20%] text-right font-semibold">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((team) => {
              const userRole = team.members.find((m) => m.userId?._id === currentUserId)?.role || 'none';
              const isAdmin = userRole === 'admin' || team.createdBy._id === currentUserId;
              const activeTasks = team.tasks.filter((task) => task.status !== 'completed').length;
              const isUserInTeam = team.createdBy._id === currentUserId || 
                               team.members.some(m => m.userId._id === currentUserId);
              const isUserAdmin = team.createdBy._id === currentUserId || 
                                team.members.some(m => m.userId._id === currentUserId && m.role === 'admin');

              return (
                <TableRow 
                  key={team._id} 
                  className="group"
                >
                  <TableCell className="p-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border-2 border-white dark:border-gray-800 shadow-sm">
                          <AvatarImage src={team.createdBy.profilePicture} />
                          <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                            {team.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">
                            {team.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Users className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Join Code:</span>
                          <code className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono">
                            {team.joinCode}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleCopyCode(team._id, team.joinCode)}
                          >
                            {copiedTeamId === team._id ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      )}
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
                    <div className="flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span>{team.tasks.length}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span>{team.members.length}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right p-4">
                    <div className="flex items-center justify-end gap-2">
                      {showJoinButton && !isUserInTeam && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => onJoin?.(team._id)}
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          Join Team
                        </Button>
                      )}
                      {isUserInTeam && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/teams/${team._id}`)}
                            className="border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center gap-1"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTeam(team);
                              setIsDetailsOpen(true);
                            }}
                            className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                          >
                            Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onLeave(team._id)}
                            className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                          >
                            Leave
                          </Button>
                          {isUserAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedTeam(team);
                                setIsDeleteOpen(true);
                              }}
                              className="border-red-200 hover:bg-red-50 text-red-600 dark:border-red-800 dark:hover:bg-red-900/50 dark:text-red-400"
                            >
                              Delete
                            </Button>
                          )}
                        </>
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