'use client';

import { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { motion } from 'framer-motion';
import { User2, Mail, School, BookOpen, Clock, Camera, Upload, Loader2 } from 'lucide-react';
import axios from 'axios';
import Image from 'next/image';
import { Card, CardHeader, CardContent } from './ui/card';

const API_URL = 'http://localhost:8000';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  university: string;
  major: string;
  year: string;
  bio: string;
  studyPreferences: {
    environment: string;
    groupSize: string;
    studyStyle: string;
    noiseLevel: string;
  };
  availability: {
    days: string[];
    timeSlots: string[];
  };
  profilePicture?: string;
}

interface UpdateUserData {
  firstName: string;
  lastName: string;
  school: string;
  major: string;
  year: string;
  bio: string;
  studyPreferences: string;
  availability: string;
  profilePicture?: string;
}

const MAX_IMAGE_SIZE = 1 * 1024 * 1024; // 1MB

const compressImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > 800) {
            height = Math.round((height * 800) / width);
            width = 800;
          }
        } else {
          if (height > 800) {
            width = Math.round((width * 800) / height);
            height = 800;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to base64 with reduced quality
        const base64String = canvas.toDataURL('image/jpeg', 0.7);
        resolve(base64String);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export function ProfileForm() {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    university: '',
    major: '',
    year: '',
    bio: '',
    studyPreferences: {
      environment: '',
      groupSize: '',
      studyStyle: '',
      noiseLevel: '',
    },
    availability: {
      days: [],
      timeSlots: [],
    },
    profilePicture: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changedFields, setChangedFields] = useState<Record<string, string>>({});

  // Study preferences options
  const studyPreferencesOptions = {
    environment: ['Library', 'Coffee Shop', 'Study Room', 'Online', 'Outdoors'],
    groupSize: ['Solo', 'Pair', 'Small Group (3-5)', 'Large Group (6+)'],
    studyStyle: ['Visual Learning', 'Audio Learning', 'Reading/Writing', 'Hands-on Learning'],
    noiseLevel: ['Silent', 'Quiet', 'Moderate', 'Any'],
  };

  // Availability options
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = ['Morning', 'Afternoon', 'Evening'];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) {
          window.location.href = '/';
          return;
        }

        const userData = JSON.parse(storedUser);
        if (!userData.id) {
          window.location.href = '/';
          return;
        }

        const response = await axios.get(`${API_URL}/users/${userData.id}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const user = response.data;
        console.log('Fetched user data:', user); // Debug log

        // Parse study preferences from string
        let parsedStudyPreferences = {
          environment: '',
          groupSize: '',
          studyStyle: '',
          noiseLevel: '',
        };

        if (user.studyPreferences) {
          const prefPairs = user.studyPreferences.split(', ');
          prefPairs.forEach((pair: string) => {
            const [key, value] = pair.split(': ');
            if (key && value && key in parsedStudyPreferences) {
              (parsedStudyPreferences as any)[key] = value;
            }
          });
        }

        // Parse availability from string
        let parsedAvailability = {
          days: [] as string[],
          timeSlots: [] as string[]
        };

        if (user.availability) {
          const daysMatch = user.availability.match(/Days: (.*?)(?:\s*\||$)/);
          const timesMatch = user.availability.match(/Times: (.*?)(?:\s*\||$)/);
          
          if (daysMatch && daysMatch[1]) {
            parsedAvailability.days = daysMatch[1].split(', ').filter(Boolean);
          }
          if (timesMatch && timesMatch[1]) {
            parsedAvailability.timeSlots = timesMatch[1].split(', ').filter(Boolean);
          }
        }

        setProfile({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          university: user.school || '',
          major: user.major || '',
          year: user.year || '',
          bio: user.bio || '',
          studyPreferences: parsedStudyPreferences,
          availability: parsedAvailability,
          profilePicture: user.profilePicture || ''
        });

        console.log('Parsed profile:', {
          studyPreferences: parsedStudyPreferences,
          availability: parsedAvailability
        }); // Debug log
      } catch (error: any) {
        console.error('Failed to fetch user data:', error);
        if (error.response?.status === 401) {
          handleLogout();
          return;
        }
        setError('Failed to load user data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [mounted]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle study preferences
    if (name.startsWith('studyPreferences_')) {
      const preference = name.split('_')[1];
      setProfile(prev => ({
        ...prev,
        studyPreferences: {
          ...prev.studyPreferences,
          [preference]: value
        }
      }));
      setChangedFields(prev => ({ ...prev, [name]: value }));
      setHasChanges(true);
      return;
    }

    // Handle availability checkboxes
    if (name.startsWith('availability_')) {
      const [type, value] = name.split('_').slice(1);
      const isChecked = (e.target as HTMLInputElement).checked;
      
      setProfile(prev => ({
        ...prev,
        availability: {
          ...prev.availability,
          [type === 'day' ? 'days' : 'timeSlots']: isChecked
            ? [...prev.availability[type === 'day' ? 'days' : 'timeSlots'], value]
            : prev.availability[type === 'day' ? 'days' : 'timeSlots'].filter(item => item !== value)
        }
      }));
      setHasChanges(true);
      return;
    }

    // Handle regular fields
    setProfile(prev => ({ ...prev, [name]: value }));
    setChangedFields(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > MAX_IMAGE_SIZE) {
      setError('Image size must be less than 1MB');
      return;
    }

    try {
      setIsSaving(true);
      const compressedImage = await compressImage(file);
      setImageFile(file);
      setProfile(prev => ({ ...prev, profilePicture: compressedImage }));
      setError(null);
    } catch (err) {
      console.error('Failed to process image:', err);
      setError('Failed to process image. Please try a different one.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveChanges = () => {
    setShowConfirm(true);
  };

  const confirmSave = async () => {
    setShowConfirm(false);
    const event = new Event('submit');
    await handleSubmit(event as any);
    setChangedFields({});
    setHasChanges(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    
    try {
      const checkAuth = () => {
        const token = localStorage.getItem('token');
        if (!token) {
          handleLogout();
          return false;
        }
        return true;
      };

      if (!checkAuth()) return;

      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (!userData.id) {
        handleLogout();
        return;
      }

      const token = localStorage.getItem('token');

      // Convert studyPreferences object to string
      const studyPreferencesString = Object.entries(profile.studyPreferences)
        .map(([key, value]) => `${key}: ${value}`)
        .filter(pref => pref.split(': ')[1] !== '')
        .join(', ');

      // Convert availability object to string
      const availabilityString = [
        profile.availability.days.length > 0 ? `Days: ${profile.availability.days.join(', ')}` : '',
        profile.availability.timeSlots.length > 0 ? `Times: ${profile.availability.timeSlots.join(', ')}` : ''
      ].filter(Boolean).join(' | ');

      let updateData: UpdateUserData = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        school: profile.university,
        major: profile.major,
        year: profile.year,
        bio: profile.bio,
        studyPreferences: studyPreferencesString,
        availability: availabilityString
      };

      // If there's a new image, use the already compressed version
      if (profile.profilePicture && profile.profilePicture.startsWith('data:image')) {
        updateData = { ...updateData, profilePicture: profile.profilePicture };
      }

      // Update the profile data
      const response = await axios.put(
        `${API_URL}/users/${userData.id}`, 
        updateData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // If successful, update localStorage with new data
      if (response.data) {
        const updatedUser = { ...userData, ...response.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Parse the strings back into objects for the frontend
        const parsedStudyPreferences = response.data.studyPreferences
          ? response.data.studyPreferences.split(', ').reduce((acc: any, pref: string) => {
              const [key, value] = pref.split(': ');
              if (key && value) acc[key] = value;
              return acc;
            }, {
              environment: '',
              groupSize: '',
              studyStyle: '',
              noiseLevel: '',
            })
          : {
              environment: '',
              groupSize: '',
              studyStyle: '',
              noiseLevel: '',
            };

        const parsedAvailability = {
          days: response.data.availability
            ? (response.data.availability.match(/Days: (.*?)(?:\s*\||$)/)?.[1] || '').split(', ').filter(Boolean)
            : [],
          timeSlots: response.data.availability
            ? (response.data.availability.match(/Times: (.*?)(?:\s*\||$)/)?.[1] || '').split(', ').filter(Boolean)
            : []
        };
        
        // Refresh the profile data with the response
        setProfile(prev => ({
          ...prev,
          ...response.data,
          university: response.data.school || '',
          studyPreferences: parsedStudyPreferences,
          availability: parsedAvailability,
          profilePicture: response.data.profilePicture || ''
        }));

        setImageFile(null);
        setError(null);
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      if (error.response?.status === 401) {
        handleLogout();
        return;
      }
      if (error.response?.status === 413) {
        setError('Image size is too large. Please try a smaller image or compress it further.');
        return;
      }
      setError(error.response?.data?.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Update the study preferences select elements to show current values
  const renderStudyPreferencesSelect = (category: string, options: string[]) => (
    <div key={category} className="mt-2">
      <Label className="text-sm text-gray-600 dark:text-gray-400">
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </Label>
      <select
        name={`studyPreferences_${category}`}
        value={profile.studyPreferences[category as keyof typeof profile.studyPreferences]}
        onChange={handleChange}
        className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm hover:border-indigo-500 focus:border-indigo-500 transition-colors"
      >
        <option value="">Select {category}</option>
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8">
          {error && (
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-8">
            {/* Profile Header Card */}
            <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800/50">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  {/* Profile Picture */}
                  <div className="relative mb-6 group">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-lg group-hover:border-indigo-500 dark:group-hover:border-indigo-400 transition-all">
                      {profile.profilePicture ? (
                        <Image
                          src={profile.profilePicture}
                          alt="Profile"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-indigo-500/40 to-purple-500/40 dark:from-indigo-500/20 dark:to-purple-500/20 flex items-center justify-center">
                          <User2 className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                        </div>
                      )}
                    </div>
                    <label
                      htmlFor="profile-picture"
                      className="absolute bottom-2 right-2 p-2 bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 rounded-full text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                    >
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        id="profile-picture"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Profile Info */}
                  <div className="text-center space-y-3">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {profile.firstName} {profile.lastName}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300">{profile.email}</p>
                    {profile.university && (
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 text-indigo-600 dark:text-indigo-400">
                        <School className="w-4 h-4 mr-2" />
                        <span>{profile.university}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <form className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Personal Information Card */}
              <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <User2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-xl font-semibold">Personal Information</h2>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={profile.firstName}
                      onChange={handleChange}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={profile.lastName}
                      onChange={handleChange}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      value={profile.email}
                      disabled
                      className="mt-1.5 bg-gray-50 dark:bg-gray-700/50"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Academic Information Card */}
              <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-xl font-semibold">Academic Information</h2>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="university">University</Label>
                    <Input
                      id="university"
                      name="university"
                      value={profile.university}
                      onChange={handleChange}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="major">Major</Label>
                    <Input
                      id="major"
                      name="major"
                      value={profile.major}
                      onChange={handleChange}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="year">Year</Label>
                    <select
                      id="year"
                      name="year"
                      value={profile.year}
                      onChange={handleChange}
                      className="mt-1.5 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm"
                    >
                      <option value="">Select Year</option>
                      <option value="Freshman">Freshman</option>
                      <option value="Sophomore">Sophomore</option>
                      <option value="Junior">Junior</option>
                      <option value="Senior">Senior</option>
                      <option value="Graduate">Graduate</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Bio Card */}
              <Card className="md:col-span-2 hover:shadow-lg transition-shadow bg-white dark:bg-gray-800/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <User2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-xl font-semibold">Bio</h2>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={profile.bio}
                    onChange={handleChange}
                    className="h-40"
                    placeholder="Share a bit about yourself, your interests, and what you're looking to achieve..."
                  />
                </CardContent>
              </Card>

              {/* Study Preferences Card */}
              <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-xl font-semibold">Study Preferences</h2>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Let others know how you prefer to study
                  </p>
                  {Object.entries(studyPreferencesOptions).map(([category, options]) => 
                    renderStudyPreferencesSelect(category, options)
                  )}
                </CardContent>
              </Card>

              {/* Availability Card */}
              <Card className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800/50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-xl font-semibold">Availability</h2>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    Select your available times
                  </p>
                  
                  {/* Days Available */}
                  <div className="space-y-4">
                    <Label className="block text-center">Days Available</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {daysOfWeek.map(day => (
                        <label key={day} className="flex items-center gap-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                          <input
                            type="checkbox"
                            name={`availability_day_${day}`}
                            checked={profile.availability.days.includes(day)}
                            onChange={handleChange}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm">{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div className="space-y-4">
                    <Label className="block text-center">Time Slots</Label>
                    <div className="flex flex-col gap-2">
                      {timeSlots.map(slot => (
                        <label key={slot} className="flex items-center gap-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                          <input
                            type="checkbox"
                            name={`availability_timeSlot_${slot}`}
                            checked={profile.availability.timeSlots.includes(slot)}
                            onChange={handleChange}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm">{slot}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </form>

            {/* Save Changes Button */}
            {hasChanges && (
              <div className="fixed bottom-8 right-8 flex gap-4 bg-white dark:bg-gray-800/50 p-4 rounded-xl shadow-xl">
                <Button
                  type="button"
                  onClick={() => {
                    setChangedFields({});
                    setHasChanges(false);
                    window.location.reload();
                  }}
                  variant="outline"
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveChanges}
                  className="bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 dark:from-indigo-500 dark:to-purple-500 dark:hover:from-indigo-400 dark:hover:to-purple-400 text-white shadow-md hover:shadow-lg transition-all"
                >
                  Save Changes
                </Button>
              </div>
            )}

            {/* Confirmation Dialog */}
            {showConfirm && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 max-w-md w-full shadow-2xl">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Confirm Changes</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Are you sure you want to save these changes to your profile?
                  </p>
                  <div className="flex justify-end gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowConfirm(false)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={confirmSave}
                      className="bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 dark:from-indigo-500 dark:to-purple-500 dark:hover:from-indigo-400 dark:hover:to-purple-400 text-white shadow-md hover:shadow-lg transition-all"
                    >
                      Confirm
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 