
'use client';

import { CourseProgressCard } from '@/components/dashboard/CourseProgressCard';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Course, UserProgress } from '@/lib/data-types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, BookCopy, CheckCircle, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';

export default function DashboardPage() {
  const { firestore, user, isUserLoading } = useFirebase();
  const router = useRouter();

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
  
  const isLoading = progressLoading || coursesLoading || isUserLoading;
  
  if (isLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <BookOpen className="h-12 w-12 text-primary animate-pulse" />
                <p className="text-muted-foreground">Loading Your Dashboard...</p>
            </div>
        </div>
    );
  }

  if (!user) {
    router.push('/login?redirect=/dashboard');
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold font-headline">
              Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!
            </h1>
            <p className="text-muted-foreground">Here's a summary of your learning journey.</p>
          </div>
          
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
                  <Link href="/" className="text-primary hover:underline mt-2 inline-block">Explore Courses</Link>
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
                <CardHeader>
                    <CardTitle>Completed Courses</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {completedCourses.map((course) => (
                    <div key={course!.id} className="flex items-center justify-between p-3 rounded-md hover:bg-muted/50">
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
      </main>
    </div>
  );
}
