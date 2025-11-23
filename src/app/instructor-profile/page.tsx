'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useFirebase, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Header } from '@/components/layout/Header';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Plus, X, Award, Briefcase, Users, Star } from 'lucide-react';
import type { InstructorProfile } from '@/lib/data-types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { uploadToCloudinary } from '@/lib/cloudinary-upload';
import { ThumbnailUploader } from '@/components/thumbnail-uploader';

const instructorProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().min(20, 'Bio must be at least 20 characters'),
  qualification: z.string().min(5, 'Qualification is required'),
  specialization: z.string().min(5, 'Specialization is required'),
  yearsOfExperience: z.coerce.number().min(0, 'Years of experience cannot be negative'),
  expertise: z.array(z.string()).min(1, 'Add at least one skill'),
  avatar: z.string().min(1, 'Profile image is required'),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
  website: z.string().optional(),
  github: z.string().optional(),
});

type InstructorProfileFormValues = z.infer<typeof instructorProfileSchema>;

export default function InstructorProfilePage() {
  const router = useRouter();
  const { firestore, user, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<{ blob: Blob; filename: string } | null>(null);
  const [currentExpertise, setCurrentExpertise] = useState('');

  const instructorProfileRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'instructorProfiles', user.uid) : null),
    [firestore, user]
  );
  const { data: existingProfile } = useDoc<InstructorProfile>(instructorProfileRef);

  const form = useForm<InstructorProfileFormValues>({
    resolver: zodResolver(instructorProfileSchema),
    defaultValues: existingProfile || {
      name: user?.displayName || '',
      bio: '',
      qualification: '',
      specialization: '',
      yearsOfExperience: 0,
      expertise: [],
      avatar: '',
      twitter: '',
      linkedin: '',
      website: '',
      github: '',
    },
  });

  const handleAvatarUpload = async (file: Blob, filename: string) => {
    setAvatarFile({ blob: file, filename });
  };

  const onSubmit = async (data: InstructorProfileFormValues) => {
    if (!firestore || !user) return;

    setIsLoading(true);

    try {
      let avatarUrl = data.avatar;

      if (avatarFile) {
        const result = await uploadToCloudinary(avatarFile.blob, avatarFile.filename, {
          folder: `instructor-profiles/${user.uid}`,
        });
        avatarUrl = result.secureUrl;
      }

      const profileData: InstructorProfile = {
        id: user.uid,
        userId: user.uid,
        name: data.name,
        bio: data.bio,
        qualification: data.qualification,
        specialization: data.specialization,
        yearsOfExperience: data.yearsOfExperience,
        expertise: data.expertise,
        avatar: avatarUrl,
        socialLinks: {
          twitter: data.twitter || undefined,
          linkedin: data.linkedin || undefined,
          website: data.website || undefined,
          github: data.github || undefined,
        },
      };

      const profileRef = doc(firestore, 'instructorProfiles', user.uid);
      await setDocumentNonBlocking(profileRef, profileData, { merge: true });

      toast({
        title: 'Success',
        description: 'Your instructor profile has been updated successfully!',
      });

      router.push('/instructor');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const expertise = form.watch('expertise');

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold font-headline mb-2">Instructor Profile</h1>
            <p className="text-muted-foreground">Showcase your expertise and credentials to students</p>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
              <CardTitle>Create Your Instructor Profile</CardTitle>
              <CardDescription>Help students learn more about you and your expertise</CardDescription>
            </CardHeader>

            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Avatar Section */}
                  <FormField
                    control={form.control}
                    name="avatar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profile Picture</FormLabel>
                        <FormControl>
                          <ThumbnailUploader
                            value={field.value}
                            onChange={field.onChange}
                            onFileReady={handleAvatarUpload}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormDescription>Upload a professional profile picture</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Basic Information */}
                  <div className="space-y-4 border-t pt-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Basic Information
                    </h3>

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Write a compelling bio about yourself..."
                              className="min-h-32"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>Introduce yourself to potential students</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Professional Details */}
                  <div className="space-y-4 border-t pt-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Professional Details
                    </h3>

                    <FormField
                      control={form.control}
                      name="qualification"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qualification</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Bachelor's in Computer Science"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specialization"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specialization</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Web Development, Data Science"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="yearsOfExperience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Years of Experience</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="e.g., 5"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Expertise/Skills */}
                  <div className="space-y-4 border-t pt-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Expertise & Skills
                    </h3>

                    <FormField
                      control={form.control}
                      name="expertise"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Skills</FormLabel>
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <Input
                                placeholder="Add a skill (e.g., React, Python, etc.)"
                                value={currentExpertise}
                                onChange={(e) => setCurrentExpertise(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (currentExpertise.trim() && !expertise.includes(currentExpertise.trim())) {
                                      field.onChange([...expertise, currentExpertise.trim()]);
                                      setCurrentExpertise('');
                                    }
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  if (currentExpertise.trim() && !expertise.includes(currentExpertise.trim())) {
                                    field.onChange([...expertise, currentExpertise.trim()]);
                                    setCurrentExpertise('');
                                  }
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>

                            {expertise.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {expertise.map((skill, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="pl-3 py-2"
                                  >
                                    {skill}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        field.onChange(expertise.filter((_, i) => i !== idx))
                                      }
                                      className="ml-2 hover:text-destructive"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <FormDescription>Add your key skills and areas of expertise</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Social Links */}
                  <div className="space-y-4 border-t pt-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Star className="h-5 w-5 text-primary" />
                      Social Links
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="twitter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Twitter</FormLabel>
                            <FormControl>
                              <Input placeholder="https://twitter.com/username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="linkedin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LinkedIn</FormLabel>
                            <FormControl>
                              <Input placeholder="https://linkedin.com/in/username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input placeholder="https://yourwebsite.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="github"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GitHub</FormLabel>
                            <FormControl>
                              <Input placeholder="https://github.com/username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-4 border-t pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Save Profile
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
