'use client';

import React from 'react';
import { Team } from '@/types/team';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Users, Bell, Shield } from 'lucide-react';

interface TeamSettingsProps {
  team: Team;
}

export function TeamSettings({ team }: TeamSettingsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Team Settings</h3>
      </div>

      <div className="grid gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-500" />
              <CardTitle className="text-lg">General Settings</CardTitle>
            </div>
            <CardDescription>
              Manage your team's basic information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">Team Name</h4>
                <p className="text-sm text-gray-500">{team.name}</p>
              </div>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">Team Description</h4>
                <p className="text-sm text-gray-500">{team.description}</p>
              </div>
              <Button variant="outline" size="sm">
                Edit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Member Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-500" />
              <CardTitle className="text-lg">Member Settings</CardTitle>
            </div>
            <CardDescription>
              Configure member roles and permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">Member Invitations</h4>
                <p className="text-sm text-gray-500">Allow members to invite others</p>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">Role Management</h4>
                <p className="text-sm text-gray-500">Manage member roles and permissions</p>
              </div>
              <Button variant="outline" size="sm">
                Manage Roles
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-gray-500" />
              <CardTitle className="text-lg">Notification Settings</CardTitle>
            </div>
            <CardDescription>
              Customize how and when you receive team notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">Task Updates</h4>
                <p className="text-sm text-gray-500">Get notified about task changes</p>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">Goal Progress</h4>
                <p className="text-sm text-gray-500">Notifications for goal achievements</p>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              <CardTitle className="text-lg text-red-600 dark:text-red-400">Danger Zone</CardTitle>
            </div>
            <CardDescription className="text-red-600/80 dark:text-red-400/80">
              Irreversible actions that affect your team
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-red-600 dark:text-red-400">Delete Team</h4>
                <p className="text-sm text-red-600/80 dark:text-red-400/80">
                  Permanently delete this team and all its data
                </p>
              </div>
              <Button variant="destructive" size="sm">
                Delete Team
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 