import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface DeleteTeamDialogProps {
  teamName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteTeamDialog: React.FC<DeleteTeamDialogProps> = ({
  teamName,
  isOpen,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-800/95 dark:backdrop-blur-xl border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle className="text-xl font-bold">Delete Team</DialogTitle>
          </div>
          <DialogDescription className="pt-4 text-gray-600 dark:text-gray-300">
            Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-gray-100">&ldquo;{teamName}&rdquo;</span>? 
            This action cannot be undone and all team data will be permanently lost.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            Delete Team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 