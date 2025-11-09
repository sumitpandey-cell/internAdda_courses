'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useFirebase, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlayCircle, CheckCircle, Lock, ArrowLeft } from 'lucide-react';
import type { Course, Lesson, UserProgress } from '@/lib/data-types';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function CoursePage() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const { courseId } = params;

  const { firestore, user } = useFirebase();

  const courseRef = useMemoFirebase(
    () => (firestore && courseId ? doc(firestore, 'courses', courseId) : null),
    [firestore, courseId]
  );
  const lessonsQuery = useMemoFirebase(
    () => (firestore && courseId ? query(collection(firestore, 'courses', courseId, 'lessons'), orderBy('order')) : null),
    [firestore, courseId]
  );
  const progressRef = useMemoFirebase(
    () => (firestore && user && courseId ? doc(firestore, 'users', user.uid, 'progress', courseId) : null),
    [firestore, user, courseId]
  );

  const { data: course, isLoading: courseLoading } = useDoc<Course>(courseRef);
  const { data: lessons, isLoading: lessonsLoading } = useCollection<Lesson>(lessonsQuery);
  const { data: progress } = useDoc<UserProgress>(progressRef);

  const firstLessonId = lessons?.[0]?.id;
  const startDestination = `/courses/${courseId}/lesson/${progress?.lastLessonId || firstLessonId}`;
  const startLink = user && firstLessonId ? startDestination : `/login?redirect=${startDestination}`;


  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto py-8 px-4 md:px-6">
          <div className="mb-6">
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Courses
              </Link>
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              {courseLoading ? (
                <>
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-10 w-3/4" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-6 w-1/2" />
                </>
              ) : (
                <>
                  <Badge variant="secondary">{course?.category}</Badge>
                  <h1 className="text-4xl font-bold font-headline">{course?.title}</h1>
                  <p className="text-lg text-muted-foreground">{course?.description}</p>
                  <div className="flex items-center gap-4">
                    <p className="text-sm">by {course?.instructor}</p>
                    <Badge variant="outline">{course?.difficulty}</Badge>
                  </div>
                  <div className="flex gap-2">
                    {course?.tags?.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                  </div>
                </>
              )}

              <Button size="lg" asChild disabled={lessonsLoading || !firstLessonId}>
                <Link href={startLink}>
                  <PlayCircle className="mr-2 h-5 w-5" />
                  {user ? (progress?.percentage === 0 || !progress ? 'Start Course' : 'Continue Learning') : 'Enroll to Start'}
                </Link>
              </Button>
            </div>
            <div className="md:col-span-1">
              {courseLoading ? (
                <Skeleton className="rounded-lg shadow-lg aspect-video w-full" />
              ) : (
                <Image
                  src={course?.thumbnail || 'https://picsum.photos/seed/placeholder/600/400'}
                  alt={course?.title || 'Course thumbnail'}
                  width={600}
                  height={400}
                  className="rounded-lg shadow-lg aspect-video w-full object-cover"
                />
              )}
            </div>
          </div>
          
          <div className="mt-12">
            <h2 className="text-2xl font-bold font-headline mb-4">Course Content</h2>
            <Card>
              <CardContent className="p-4 space-y-2">
                {lessonsLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : (
                  lessons?.map((lesson, index) => {
                    const isCompleted = user && progress?.completedLessons?.includes(lesson.id);
                    const lessonDestination = `/courses/${courseId}/lesson/${lesson.id}`;
                    const lessonLink = user ? lessonDestination : `/login?redirect=${lessonDestination}`;
                    return (
                      <Link key={lesson.id} href={lessonLink}>
                        <div className={`flex items-center justify-between p-3 rounded-md transition-colors hover:bg-muted/50 cursor-pointer`}>
                          <div className="flex items-center gap-4">
                            <div className="text-muted-foreground font-mono text-lg">{String(index + 1).padStart(2, '0')}</div>
                            <p className="font-medium">{lesson.title}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">{lesson.duration} min</span>
                            {user ? (
                              isCompleted ? <CheckCircle className="h-5 w-5 text-green-500" /> : <PlayCircle className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <Lock className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
