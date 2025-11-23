
'use client';

import Link from 'next/link';
import { useFirebase, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import type { Course, UserProfile, InstructorProfile } from '@/lib/data-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, User, Award } from 'lucide-react';
import { CourseManagementTable } from '@/components/instructor/CourseManagementTable';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/badge';

export default function InstructorDashboardPage() {
  const { firestore, user } = useFirebase();

  const userProfileRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const instructorProfileRef = useMemoFirebase(
    () => (user ? doc(firestore, 'instructorProfiles', user.uid) : null),
    [firestore, user]
  );
  const { data: instructorProfile } = useDoc<InstructorProfile>(instructorProfileRef);

  const coursesQuery = useMemoFirebase(
    () =>
      user && (userProfile?.role === 'Instructor' || userProfile?.role === 'Admin')
        ? query(collection(firestore, 'courses'), where('instructorId', '==', user.uid))
        : null,
    [firestore, user, userProfile]
  );

  const { data: courses, isLoading } = useCollection<Course>(coursesQuery);

  const isInstructor = userProfile?.role === 'Instructor' || userProfile?.role === 'Admin';
  
  const Content = () => {
    if (!isInstructor) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle>Access Denied</CardTitle>
                  <CardDescription>This page is for instructors only.</CardDescription>
              </CardHeader>
          </Card>
      )
    }

    return (
      <div className="space-y-6">
          {/* Header with Profile Link */}
          <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold font-headline">Instructor Dashboard</h1>
              <div className="flex gap-3">
                  <Button asChild variant="outline">
                      <Link href="/instructor-profile">
                          <User className="mr-2 h-4 w-4" />
                          {instructorProfile ? 'Edit Profile' : 'Create Profile'}
                      </Link>
                  </Button>
                  <Button asChild>
                      <Link href="/courses/new">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Create New Course
                      </Link>
                  </Button>
              </div>
          </div>

          {/* Instructor Profile Status Card */}
          {instructorProfile ? (
              <Card className="border-green-500/20 bg-green-500/5">
                  <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <div className="p-3 bg-green-500/10 rounded-lg">
                                  <Award className="h-6 w-6 text-green-600" />
                              </div>
                              <div>
                                  <p className="font-semibold text-green-900">Profile Complete</p>
                                  <p className="text-sm text-green-700">Your instructor profile is set up and visible to students</p>
                              </div>
                          </div>
                          <Badge className="bg-green-600">Active</Badge>
                      </div>
                  </CardContent>
              </Card>
          ) : (
              <Card className="border-amber-500/20 bg-amber-500/5">
                  <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                              <div className="p-3 bg-amber-500/10 rounded-lg">
                                  <User className="h-6 w-6 text-amber-600" />
                              </div>
                              <div>
                                  <p className="font-semibold text-amber-900">Complete Your Profile</p>
                                  <p className="text-sm text-amber-700">Add your profile information to help students learn more about you</p>
                              </div>
                          </div>
                          <Button asChild size="sm">
                              <Link href="/instructor-profile">Set Up Now</Link>
                          </Button>
                      </div>
                  </CardContent>
              </Card>
          )}
        
        <Card>
          <CardHeader>
            <CardTitle>My Courses</CardTitle>
            <CardDescription>
              Here you can manage all of the courses you have created.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CourseManagementTable courses={courses || []} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-8">
        <Content />
      </main>
    </div>
  )
}
