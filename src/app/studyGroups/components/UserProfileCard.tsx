import React from 'react';
import { Card, CardContent, CardHeader } from '@/app/userProfile/components/ui/card';
import { User2, School, BookOpen, Clock } from 'lucide-react';
import Image from 'next/image';
import { UserRole } from '@/types/user';

interface UserProfileCardProps {
    user: {
        _id: string;
        email: string;
        firstname: string;
        lastname: string;
        username?: string;
        profilePicture?: string;
        bio?: string;
        major?: string;
        school?: string;
        year?: string;
        role: UserRole;
        preferences?: {
            studyPreferences: string[];
            subjects: string[];
            availability: string[];
        };
    };
}

export function UserProfileCard({ user }: UserProfileCardProps) {
    return (
        <Card className="w-full max-w-sm mx-auto overflow-hidden hover:shadow-lg transition-shadow bg-white dark:bg-gray-800/50">
            <CardHeader className="relative h-32 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20">
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg">
                        {user.profilePicture ? (
                            <Image
                                src={user.profilePicture}
                                alt="Profile"
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-tr from-indigo-500/40 to-purple-500/40 dark:from-indigo-500/20 dark:to-purple-500/20 flex items-center justify-center">
                                <User2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-16 pb-6 px-6">
                {/* Basic Info */}
                <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {user.firstname} {user.lastname}
                    </h2>
                    {user.username && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            @{user.username}
                        </p>
                    )}
                </div>

                {/* Bio */}
                {user.bio && (
                    <div className="mb-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                            {user.bio}
                        </p>
                    </div>
                )}

                {/* Academic Info */}
                {(user.school || user.major || user.year) && (
                    <div className="space-y-3 mb-6">
                        {user.school && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <School className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <span className="text-sm">{user.school}</span>
                            </div>
                        )}
                        {user.major && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <span className="text-sm">{user.major}</span>
                            </div>
                        )}
                        {user.year && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <span className="text-sm">{user.year} Year</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Study Preferences */}
                {user.preferences && (
                    <div className="space-y-4">
                        {user.preferences.studyPreferences.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                    Study Preferences
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {user.preferences.studyPreferences.map((pref) => (
                                        <span
                                            key={pref}
                                            className="px-2 py-1 text-xs rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                                        >
                                            {pref}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {user.preferences.subjects.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                    Subjects
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {user.preferences.subjects.map((subject) => (
                                        <span
                                            key={subject}
                                            className="px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                                        >
                                            {subject}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {user.preferences.availability.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                    Availability
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {user.preferences.availability.map((time) => (
                                        <span
                                            key={time}
                                            className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                        >
                                            {time}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
} 