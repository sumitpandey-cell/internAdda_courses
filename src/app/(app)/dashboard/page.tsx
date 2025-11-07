'use client';

import { CourseProgressCard } from '@/components/dashboard/CourseProgressCard';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Course, UserProgress } from '@/lib/data-types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Award, BookCopy, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { firestore, user } = useFirebase();

  const progressQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'users', user.uid, 'progress')) : null),
    [firestore, user]
  );
  const { data: userProgress, isLoading: progressLoading } = useCollection<UserProgress>(progressQuery);

  const enrolledCourseIds = userProgress?.map(p => p.courseId) || [];

  const coursesQuery = useMemoFirebase(
    () =>
      firestore && enrolledCourseIds.length > 0
        ? query(collection(firestore, 'courses'), where('id', 'in', enrolledCourseIds))
        : null,
    [firestore, enrolledCourseIds.join(',')] // Use a stable string representation
  );
  const { data: enrolledCourses, isLoading: coursesLoading } = useCollection<Course>(coursesQuery);

  const ongoingCourses = enrolledCourses?.filter(
    (course) => (userProgress?.find((p) => p.courseId === course!.id)?.percentage ?? 0) < 100
  ) || [];
  
  const completedCourses = enrolledCourses?.filter(
    (course) => (userProgress?.find((p) => p.courseId === course!.id)?.percentage ?? 0) === 100
  ) || [];

  const totalCompleted = completedCourses.length;
  const totalInProgress = ongoingCourses.length;
  const totalXP = userProgress?.reduce((acc, p) => acc + (p.percentage * 10), 0) || 0;
  
  const isLoading = progressLoading || coursesLoading;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">
        Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!
      </h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard title="Courses in Progress" value={isLoading ? '...' : totalInProgress} icon={BookCopy} />
        <StatsCard title="Courses Completed" value={isLoading ? '...' : totalCompleted} icon={CheckCircle} />
        <StatsCard title="Total XP Earned" value={isLoading ? '...' : Math.round(totalXP)} icon={Award} />
      </div>

      <div>
        <h2 className="text-2xl font-bold font-headline mb-4">In Progress</h2>
        {isLoading ? (
            <Card><CardContent className="p-6 text-center"><p>Loading your courses...</p></CardContent></Card>
        ) : ongoingCourses.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ongoingCourses.map((course) => (
              <CourseProgressCard key={course!.id} course={course!} progress={userProgress?.find(p => p.courseId === course!.id)!} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">You have no courses in progress.</p>
              <Link href="/courses" className="text-primary hover:underline mt-2 inline-block">Explore Courses</Link>
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold font-headline mb-4">Completed</h2>
         {isLoading ? (
            <Card><CardContent className="p-6 text-center"><p>Loading your completed courses...</p></CardContent></Card>
        ) : completedCourses.length > 0 ? (
          <Card>
            <CardContent className="p-4 space-y-2">
              {completedCourses.map((course) => (
                <div key={course!.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                  <p className="font-medium">{course!.title}</p>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">Completed</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
           <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">You haven't completed any courses yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
