
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  useFirebase,
  useDoc,
  useCollection,
  useMemoFirebase,
  setDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase';
import { doc, collection, query, orderBy, where, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  PlayCircle,
  BookOpen,
  PanelLeft,
  Trash2,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { Course, Lesson, UserProgress, Note } from '@/lib/data-types';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function LessonPage() {
  const router = useRouter();
  const params = useParams<{ courseId: string; lessonId: string }>();
  const { courseId, lessonId } = params;

  const { firestore, user, isUserLoading } = useFirebase();

  useEffect(() => {
    // Redirect if not logged in after checking auth status
    if (!isUserLoading && !user) {
      router.push(`/login?redirect=/courses/${courseId}/lesson/${lessonId}`);
    }
  }, [isUserLoading, user, router, courseId, lessonId]);


  // Memoize Firestore references
  const courseRef = useMemoFirebase(
    () => (firestore && courseId ? doc(firestore, 'courses', courseId) : null),
    [firestore, courseId]
  );
  const lessonsQuery = useMemoFirebase(
    () =>
      firestore && courseId
        ? query(collection(firestore, 'courses', courseId, 'lessons'), orderBy('order'))
        : null,
    [firestore, courseId]
  );
  const lessonRef = useMemoFirebase(
    () => (firestore && courseId && lessonId ? doc(firestore, 'courses', courseId, 'lessons', lessonId) : null),
    [firestore, courseId, lessonId]
  );
  const progressRef = useMemoFirebase(
    () => (firestore && user && courseId ? doc(firestore, 'users', user.uid, 'progress', courseId) : null),
    [firestore, user, courseId]
  );
  const notesQuery = useMemoFirebase(
    () =>
      firestore && user && lessonId
        ? query(collection(firestore, 'users', user.uid, 'notes'), where('lessonId', '==', lessonId))
        : null,
    [firestore, user, lessonId]
  );
  
  // Fetch data using custom hooks
  const { data: course, isLoading: courseLoading } = useDoc<Course>(courseRef);
  const { data: lessons, isLoading: lessonsLoading } = useCollection<Lesson>(lessonsQuery);
  const { data: lesson, isLoading: lessonLoading } = useDoc<Lesson>(lessonRef);
  const { data: progress, isLoading: progressLoading } = useDoc<UserProgress>(progressRef);
  const { data: notes, isLoading: notesLoading } = useCollection<Note>(notesQuery);

  const [noteContent, setNoteContent] = useState('');

  const lessonIndex = lessons?.findIndex((l) => l.id === lessonId) ?? -1;

  const prevLesson = lessonIndex > 0 ? lessons?.[lessonIndex - 1] : null;
  const nextLesson = lessons && lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null;
  
  const isCompleted = progress?.completedLessons?.includes(lessonId);

  const handleMarkComplete = () => {
    if (!progressRef || !user || !lessons || !course || !courseId) return;

    const completedLessons = progress?.completedLessons || [];
    let newCompletedLessons = [...completedLessons];

    if (isCompleted) {
      newCompletedLessons = newCompletedLessons.filter(id => id !== lessonId);
    } else {
      if (!newCompletedLessons.includes(lessonId)) {
        newCompletedLessons.push(lessonId);
      }
    }
    
    const percentage = Math.round((newCompletedLessons.length / lessons.length) * 100);

    const newProgress: UserProgress = {
      courseId: courseId,
      completedLessons: newCompletedLessons,
      totalLessons: lessons.length,
      percentage: percentage,
      lastLessonId: lessonId,
      userId: user.uid,
    };
    
    setDocumentNonBlocking(progressRef, newProgress, { merge: true });
    
    if (nextLesson) {
      router.push(`/courses/${courseId}/lesson/${nextLesson.id}`);
    }
  };

  const handleSaveNote = () => {
    if (!firestore || !user || !lessonId || !noteContent) return;
    
    const noteRef = doc(collection(firestore, `users/${user.uid}/notes`));
    setDocumentNonBlocking(noteRef, {
      id: noteRef.id,
      userId: user.uid,
      lessonId,
      content: noteContent,
      timestamp: serverTimestamp(),
    }, {});
    setNoteContent('');
  };
  
  const handleDeleteNote = (noteId: string) => {
      if (!firestore || !user) return;
      const noteRef = doc(firestore, `users/${user.uid}/notes/${noteId}`);
      deleteDocumentNonBlocking(noteRef);
  }

  const SidebarContent = () => (
    <ScrollArea className="flex-1">
          <div className="p-6 border-b">
            <Button
              variant="ghost"
              onClick={() => router.push(`/courses/${courseId}`)}
              className="mb-4"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Course
            </Button>
            {courseLoading ? (
              <Skeleton className="h-7 w-3/4" />
            ) : (
              <h1 className="text-xl font-bold font-headline">{course?.title}</h1>
            )}
            <div className="mt-4 space-y-2">
              {progressLoading || !user ? (
                <>
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-4 w-1/4" />
                </>
              ) : (
                <>
                  <Progress value={progress?.percentage || 0} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {Math.round(progress?.percentage || 0)}% complete
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Course Content
            </h2>
            {lessonsLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <Accordion
                type="single"
                collapsible
                className="w-full"
                defaultValue={`item-${lessonIndex}`}
              >
                {lessons?.map((l, index) => {
                  const isLessonCompleted = progress?.completedLessons?.includes(l.id);
                  return (
                    <AccordionItem key={l.id} value={`item-${index}`}>
                      <Link href={`/courses/${courseId}/lesson/${l.id}`} className="block w-full">
                        <AccordionTrigger className={cn('w-full hover:no-underline', l.id === lessonId ? 'text-primary' : '')}>
                            <div className="flex items-center gap-3 flex-1">
                                {isLessonCompleted ? (
                                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                                ) : (
                                    <PlayCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                )}
                                <span className="font-medium text-sm text-left">
                                    {l.title}
                                </span>
                            </div>
                        </AccordionTrigger>
                      </Link>
                      <AccordionContent className="text-sm text-muted-foreground pl-10">
                        {l.type === 'video' ? `Video` : `Text`}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </div>
        </ScrollArea>
  );

  // While checking auth state, render loading.
  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <BookOpen className="h-12 w-12 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading Lesson...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'bg-card flex-col h-screen overflow-hidden transition-all duration-300 hidden md:flex w-[350px]'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen relative">
         <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            {/* Mobile Sidebar Trigger */}
             <Sheet>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden bg-background/50 backdrop-blur-sm"
                    >
                        <PanelLeft className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[300px] flex flex-col">
                    <SidebarContent />
                </SheetContent>
            </Sheet>
        </div>
        <ScrollArea className="flex-1">
          <div className="flex-1 p-6 md:p-8 lg:p-12 mt-12 md:mt-0">
            {lessonLoading ? (
                <Skeleton className="aspect-video rounded-lg w-full mb-8" />
            ) : (
                <div className="aspect-video rounded-lg overflow-hidden shadow-2xl bg-black mb-8">
                {lesson?.type === 'video' ? (
                    <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${lesson.content}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    ></iframe>
                ) : (
                    <Card className="h-full w-full flex items-center justify-center">
                    <CardContent className="p-6">
                        <div className="prose dark:prose-invert max-w-none">
                            {lesson?.content}
                        </div>
                    </CardContent>
                    </Card>
                )}
                </div>
            )}

            <Tabs defaultValue="transcript" className="w-full">
              <TabsList>
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
              <TabsContent value="transcript">
                <Card>
                  <CardContent className="p-6">
                    <div className="prose dark:prose-invert max-w-none text-muted-foreground">
                        {lessonLoading ? <Skeleton className="h-24 w-full" /> : <p>{lesson?.transcript || 'No transcript available for this lesson.'}</p>}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="notes">
                <Card>
                  <CardContent className="p-6 space-y-4">
                     <div className="prose dark:prose-invert max-w-none text-muted-foreground space-y-4">
                        {notesLoading && <p>Loading notes...</p>}
                        {notes?.map(note => (
                          <div key={note.id} className="p-2 border rounded-md flex justify-between items-start">
                            <div>
                                <p>{note.content}</p>
                                {note.timestamp && <p className="text-xs text-muted-foreground mt-1">{new Date(note.timestamp.seconds * 1000).toLocaleString()}</p>}
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteNote(note.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                         {(!user || (notes?.length === 0 && !notesLoading)) && <p>You haven't taken any notes for this lesson yet. Log in to save your notes.</p>}
                     </div>
                    <Textarea 
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder={user ? "Take a note..." : "Log in to take notes."}
                      className="mt-4"
                      disabled={!user}
                    />
                    <Button onClick={handleSaveNote} disabled={!noteContent.trim() || !user}>Save Note</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm border-t p-4 flex flex-col items-center">
             {user && (
                <div className="w-full max-w-4xl flex justify-between items-center mb-4">
                {prevLesson ? (
                    <Button variant="outline" asChild>
                    <Link href={`/courses/${courseId}/lesson/${prevLesson.id}`}>
                        <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                    </Link>
                    </Button>
                ) : (
                    <div />
                )}
                {nextLesson ? (
                    <Button variant="default" onClick={handleMarkComplete}>
                    Mark Complete & Next <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <Button
                        variant={isCompleted ? 'secondary' : 'default'}
                        size="lg"
                        className="w-full max-w-sm"
                        onClick={handleMarkComplete}
                        >
                        <CheckCircle className="mr-2 h-5 w-5" />
                        {isCompleted ? 'Completed' : 'Mark as Complete'}
                    </Button>
                )}
                </div>
            )}
           
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
