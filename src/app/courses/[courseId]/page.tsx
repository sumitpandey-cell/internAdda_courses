
'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useFirebase, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayCircle, CheckCircle, Lock, ArrowLeft, BookCheck, Target, UserCircle, Star } from 'lucide-react';
import type { Course, Lesson, UserProgress } from '@/lib/data-types';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <div className="md:col-span-2 space-y-8">
              {courseLoading ? (
                <>
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-10 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                </>
              ) : (
                <>
                  <Badge variant="secondary">{course?.category}</Badge>
                  <h1 className="text-4xl font-bold font-headline">{course?.title}</h1>
                  <div className="flex items-center gap-4 text-muted-foreground">
                     <div className="flex items-center gap-2">
                      <UserCircle className="h-5 w-5" />
                      <span>by {course?.instructor}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        <span>{course?.difficulty}</span>
                    </div>
                  </div>
                </>
              )}

              {/* New Detailed Sections */}
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl font-headline">
                      <BookCheck className="h-6 w-6 text-primary" />
                      Course Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-muted-foreground">
                    {courseLoading ? (
                      <Skeleton className="h-20 w-full" />
                    ) : (
                      <p>{course?.description}</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl font-headline">
                      <Target className="h-6 w-6 text-primary" />
                      What You Will Learn
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                     {courseLoading ? (
                        <Skeleton className="h-16 w-full" />
                     ) : (
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 list-none p-0">
                          {course?.whatYouWillLearn?.map((topic) => (
                            <li key={topic} className="flex items-center gap-3">
                              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                              <span className="text-muted-foreground">{topic}</span>
                            </li>
                          ))}
                        </ul>
                     )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl font-headline">
                      <UserCircle className="h-6 w-6 text-primary" />
                      Your Instructor
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center gap-4">
                     {courseLoading ? <Skeleton className="h-16 w-full" /> : (
                        <>
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={`https://picsum.photos/seed/${course?.instructorId}/100/100`} />
                                <AvatarFallback>{course?.instructor?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-bold text-lg">{course?.instructor}</h3>
                                <p className="text-muted-foreground text-sm">Expert in {course?.category}</p>
                                <p className="text-muted-foreground text-sm mt-1">{course?.instructorBio}</p>
                            </div>
                        </>
                     )}
                  </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-headline">
                            Prerequisites
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{course?.prerequisites}</p>
                    </CardContent>
                </Card>
              </div>
            </div>
            <div className="md:col-span-1 space-y-6 sticky top-24 self-start">
              <Card className="overflow-hidden shadow-lg">
                 {courseLoading ? (
                    <Skeleton className="aspect-video w-full" />
                  ) : (
                    <Image
                      src={course?.thumbnail || 'https://picsum.photos/seed/placeholder/600/400'}
                      alt={course?.title || 'Course thumbnail'}
                      width={600}
                      height={400}
                      className="aspect-video w-full object-cover"
                    />
                  )}
                  <CardContent className="p-6 space-y-4">
                     <Button size="lg" asChild className="w-full" disabled={lessonsLoading || !firstLessonId}>
                        <Link href={startLink}>
                          <PlayCircle className="mr-2 h-5 w-5" />
                          {user ? (progress?.percentage === 0 || !progress ? 'Start Course' : 'Continue Learning') : 'Enroll to Start'}
                        </Link>
                      </Button>
                  </CardContent>
              </Card>
              
               <div>
                <h3 className="text-xl font-bold font-headline mb-4">Course Content</h3>
                <Card>
                  <CardContent className="p-2 max-h-96 overflow-y-auto space-y-1">
                    {lessonsLoading ? (
                      <div className="space-y-2 p-2">
                        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                      </div>
                    ) : (
                      lessons?.map((lesson, index) => {
                        const isCompleted = user && progress?.completedLessons?.includes(lesson.id);
                        const lessonDestination = `/courses/${courseId}/lesson/${lesson.id}`;
                        const lessonLink = user ? lessonDestination : `/login?redirect=${lessonDestination}`;
                        return (
                          <Link key={lesson.id} href={lessonLink}>
                            <div className={`flex items-center p-3 rounded-md transition-colors hover:bg-muted/50 cursor-pointer`}>
                              <div className="flex items-center gap-4 flex-1">
                                <div className="text-muted-foreground font-mono text-sm">{String(index + 1).padStart(2, '0')}</div>
                                <p className="font-medium text-sm flex-1">{lesson.title}</p>
                              </div>
                              <div className="flex items-center gap-2">
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
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
