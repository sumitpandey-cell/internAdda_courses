'use client';

import Link from 'next/link';
import { useFirebase, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import type { Course, UserProfile } from '@/lib/data-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import { CourseManagementTable } from '@/components/instructor/CourseManagementTable';

export default function InstructorDashboardPage() {
  const { firestore, user } = useFirebase();

  const userProfileRef = useMemoFirebase(
    () => (user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const coursesQuery = useMemoFirebase(
    () =>
      user && (userProfile?.role === 'Instructor' || userProfile?.role === 'Admin')
        ? query(collection(firestore, 'courses'), where('instructorId', '==', user.uid))
        : null,
    [firestore, user, userProfile]
  );

  const { data: courses, isLoading } = useCollection<Course>(coursesQuery);

  const isInstructor = userProfile?.role === 'Instructor' || userProfile?.role === 'Admin';

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
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold font-headline">Instructor Dashboard</h1>
            <Button asChild>
                <Link href="/courses/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Course
                </Link>
            </Button>
        </div>
      
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
