
'use client';

import { CourseProgressCard } from '@/components/dashboard/CourseProgressCard';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Course, UserProgress, SavedCourse } from '@/lib/data-types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Award, BookCopy, CheckCircle, BookOpen, TrendingUp, Clock, Zap, Target, ArrowRight, Heart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Image from 'next/image';

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

  // Fetch saved courses
  const savedCoursesQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'savedCourses'), where('userId', '==', user.uid)) : null),
    [firestore, user]
  );
  const { data: savedCourseRecords, isLoading: savedCoursesLoading } = useCollection<SavedCourse>(savedCoursesQuery);

  const savedCourseIds = savedCourseRecords?.map(sc => sc.courseId) || [];

  // Fetch saved course details
  const savedCoursesDetailsQuery = useMemoFirebase(
    () =>
      firestore && savedCourseIds.length > 0
        ? query(collection(firestore, 'courses'), where('id', 'in', savedCourseIds))
        : null,
    [firestore, savedCourseIds.join(',')] // Use a stable string representation
  );
  const { data: savedCourses, isLoading: savedCoursesDetailsLoading } = useCollection<Course>(savedCoursesDetailsQuery);

  const ongoingCourses = enrolledCourses?.filter(
    (course) => (userProgress?.find((p) => p.courseId === course!.id)?.percentage ?? 0) < 100
  ) || [];
  
  const completedCourses = enrolledCourses?.filter(
    (course) => (userProgress?.find((p) => p.courseId === course!.id)?.percentage ?? 0) === 100
  ) || [];

  const totalCompleted = completedCourses.length;
  const totalInProgress = ongoingCourses.length;
  const totalXP = userProgress?.reduce((acc, p) => acc + (p.percentage * 10), 0) || 0;
  
  // Calculate learning streaks and stats
  const avgProgress = enrolledCourses?.length ? 
    Math.round(enrolledCourses.reduce((sum, course) => sum + (userProgress?.find(p => p.courseId === course!.id)?.percentage ?? 0), 0) / enrolledCourses.length) 
    : 0;
  
  const totalCoursesEnrolled = enrolledCourses?.length || 0;
  
  // Get the next course to focus on (first ongoing course)
  const nextCourse = ongoingCourses.length > 0 ? ongoingCourses[0] : null;
  const nextCourseProgress = nextCourse ? userProgress?.find(p => p.courseId === nextCourse.id) : null;
  
  const isLoading = progressLoading || coursesLoading || isUserLoading || savedCoursesLoading || savedCoursesDetailsLoading;
  
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
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold font-headline bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!
            </h1>
            <p className="text-lg text-muted-foreground">Keep learning and unlock your potential</p>
          </div>
          
          {/* Main Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard 
              title="Total Courses" 
              value={isLoading ? '...' : totalCoursesEnrolled} 
              icon={BookCopy}
              subtitle="enrolled"
            />
            <StatsCard 
              title="In Progress" 
              value={isLoading ? '...' : totalInProgress} 
              icon={Clock}
              subtitle="courses"
            />
            <StatsCard 
              title="Completed" 
              value={isLoading ? '...' : totalCompleted} 
              icon={CheckCircle}
              subtitle="courses"
            />
            <StatsCard 
              title="Total XP" 
              value={isLoading ? '...' : Math.round(totalXP)} 
              icon={Zap}
              subtitle="earned"
            />
          </div>

          {/* Focus Card & Quick Stats */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Focus Card */}
            <div className="lg:col-span-2">
              {nextCourse && nextCourseProgress ? (
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">Continue Learning</CardTitle>
                        <CardDescription>Pick up where you left off</CardDescription>
                      </div>
                      <Target className="h-6 w-6 text-primary/50" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{nextCourse.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4">by {nextCourse.instructor}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">Progress</span>
                        <span className="text-primary font-bold">{Math.round(nextCourseProgress.percentage)}%</span>
                      </div>
                      <Progress value={nextCourseProgress.percentage} className="h-3" />
                      <p className="text-xs text-muted-foreground">
                        {nextCourseProgress.completedLessons?.length || 0} of {nextCourseProgress.totalLessons} lessons completed
                      </p>
                    </div>
                    <Button asChild className="w-full mt-4" size="lg">
                      <Link href={`/courses/${nextCourse.id}/lesson/${nextCourseProgress.lastLessonId || ''}`}>
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Continue Course
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No courses in progress. Start learning today!</p>
                    <Button asChild>
                      <Link href="/">Explore Courses</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Quick Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="font-bold text-primary">{avgProgress}%</span>
                  </div>
                  <Progress value={avgProgress} className="h-2" />
                </div>
                
                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-muted-foreground">Learning Streak</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {totalCoursesEnrolled > 0 ? totalCoursesEnrolled : 'Start'} Courses
                  </p>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Award className="h-4 w-4 text-amber-500" />
                    <span className="text-muted-foreground">Completion Rate</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {totalCoursesEnrolled > 0 ? Math.round((totalCompleted / totalCoursesEnrolled) * 100) : 0}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* In Progress Section */}
          {totalInProgress > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold font-headline">Active Learning</h2>
                <Badge variant="secondary">{totalInProgress} courses</Badge>
              </div>
              {isLoading ? (
                <Card><CardContent className="p-6 text-center"><p>Loading your courses...</p></CardContent></Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {ongoingCourses.map((course) => (
                    <CourseProgressCard key={course!.id} course={course!} progress={userProgress?.find(p => p.courseId === course!.id)!} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Completed Section */}
          {totalCompleted > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold font-headline">Achievements</h2>
                <Badge variant="default" className="bg-green-500/10 text-green-700 dark:text-green-400">{totalCompleted} completed</Badge>
              </div>
              {isLoading ? (
                <Card><CardContent className="p-6 text-center"><p>Loading completed courses...</p></CardContent></Card>
              ) : (
                <Card className="border-green-500/20 bg-green-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-green-500" />
                      Completed Courses
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {completedCourses.map((course) => (
                      <div key={course!.id} className="flex items-center justify-between p-3 rounded-md hover:bg-green-500/10 transition-colors">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <Link href={`/courses/${course!.id}`} className="font-medium hover:text-primary transition-colors">
                            {course!.title}
                          </Link>
                        </div>
                        <Badge variant="secondary" className="bg-green-500/20 text-green-700 dark:text-green-400 border-0">
                          ✓ Completed
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Saved Courses Section */}
          {savedCourses && savedCourses.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold font-headline">Saved for Later</h2>
                <Badge variant="secondary">{savedCourses.length} courses</Badge>
              </div>
              {isLoading ? (
                <Card><CardContent className="p-6 text-center"><p>Loading your saved courses...</p></CardContent></Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {savedCourses.map((course) => (
                    <Link key={course!.id} href={`/courses/${course!.id}`}>
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full cursor-pointer">
                        <div className="relative aspect-video w-full overflow-hidden bg-gray-200">
                          <Image
                            src={course!.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop'}
                            alt={course!.title}
                            fill
                            className="object-cover hover:scale-105 transition-transform"
                          />
                          <Badge className="absolute top-3 left-3 bg-primary">
                            {course!.difficulty}
                          </Badge>
                        </div>
                        <CardContent className="p-4 space-y-3">
                          <div>
                            <h3 className="font-semibold line-clamp-2 text-gray-900">{course!.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{course!.instructor}</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">{course!.category}</Badge>
                            {course!.isFree ? (
                              <span className="text-sm font-bold text-green-600">Free</span>
                            ) : (
                              <span className="text-sm font-bold text-primary">₹{course!.price}</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recommended Courses Section */}
          {totalInProgress < 3 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold font-headline">Continue Growing</h2>
              </div>
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <Zap className="h-12 w-12 text-primary/50 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">Ready for your next challenge?</p>
                  <p className="text-sm text-muted-foreground mb-4">Explore more courses to expand your skills</p>
                  <Button asChild>
                    <Link href="/">Discover Courses</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
