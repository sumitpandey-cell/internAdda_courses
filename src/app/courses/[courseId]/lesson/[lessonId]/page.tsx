'use client';

import { useState, useEffect, useRef } from 'react';
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
import { useProgressTracking } from '@/hooks/use-progress-tracking';
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
  Lock,
  Menu,
  MoreVertical,
  Download,
  Save,
  Maximize2,
  Minimize2,
  FileText,
  Video,
  Check
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { Course, Lesson, UserProgress, Note, Purchase } from '@/lib/data-types';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import ReactMarkdown from 'react-markdown';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function LessonPage() {
  const router = useRouter();
  const params = useParams<{ courseId: string; lessonId: string }>();
  const { courseId, lessonId } = params;

  const { firestore, user, isUserLoading } = useFirebase();
  const { markLessonComplete } = useProgressTracking();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [noteContent, setNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [theaterMode, setTheaterMode] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);

  // Autosave timer ref
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Check if user has purchased the course
  const purchaseQuery = useMemoFirebase(
    () => (firestore && user && courseId ? query(collection(firestore, 'purchases'), where('userId', '==', user.uid), where('courseId', '==', courseId)) : null),
    [firestore, user, courseId]
  );

  const { data: course, isLoading: courseLoading } = useDoc<Course>(courseRef);
  const { data: purchases, isLoading: purchasesLoading } = useCollection<Purchase>(purchaseQuery);

  // Redirect if course is paid and not purchased
  useEffect(() => {
    if (isUserLoading || courseLoading || purchasesLoading || !user) return;

    if (course && !course.isFree) {
      const isPurchased = purchases && purchases.length > 0;
      if (!isPurchased) {
        router.push(`/courses/${courseId}`);
      }
    }
  }, [isUserLoading, courseLoading, purchasesLoading, course, purchases, router, courseId, user]);

  // Fetch data using custom hooks
  const { data: lessons, isLoading: lessonsLoading } = useCollection<Lesson>(lessonsQuery);
  const { data: lesson, isLoading: lessonLoading } = useDoc<Lesson>(lessonRef);
  const { data: progress, isLoading: progressLoading } = useDoc<UserProgress>(progressRef);
  const { data: notes, isLoading: notesLoading } = useCollection<Note>(notesQuery);

  // Load existing note into textarea
  useEffect(() => {
    if (notes && notes.length > 0) {
      setNoteContent(notes[0].content);
    }
  }, [notes]);

  const lessonIndex = lessons?.findIndex((l) => l.id === lessonId) ?? -1;
  const prevLesson = lessonIndex > 0 ? lessons?.[lessonIndex - 1] : null;
  const nextLesson = lessons && lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null;
  const isCompleted = progress?.completedLessons?.includes(lessonId);

  // Group lessons by their section field
  const groupedLessons = lessons?.reduce((acc, lesson, index) => {
    const sectionName = lesson.section || 'Other Lessons';
    if (!acc[sectionName]) {
      acc[sectionName] = [];
    }
    acc[sectionName].push(lesson);
    return acc;
  }, {} as Record<string, Lesson[]>);

  const handleMarkComplete = async () => {
    if (!user || !lessons || !course || !courseId || !lessonId) {
      console.error('Missing required data:', { user: !!user, lessons: !!lessons, course: !!course, courseId, lessonId });
      return;
    }

    setIsMarkingComplete(true);
    try {
      // Use new progress tracking system
      const { success, newPercentage } = await markLessonComplete(
        courseId,
        lessonId,
        lessons.length
      );

      console.log('Mark complete result:', { success, newPercentage, nextLesson: !!nextLesson });

      if (success) {
        // Navigate to next lesson or test
        if (nextLesson) {
          console.log('Navigating to next lesson:', nextLesson.id);
          router.push(`/courses/${courseId}/lesson/${nextLesson.id}`);
        } else if (newPercentage === 100) {
          // Course completed - redirect to test or completion page
          console.log('Course 100% complete! Redirecting to test page');
          router.push(`/courses/${courseId}/test`);
        } else {
          console.log('Not 100% yet:', newPercentage);
        }
      } else {
        console.error('Mark complete failed');
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    } finally {
      setIsMarkingComplete(false);
    }
  };

  // Autosave logic
  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setNoteContent(newContent);
    setIsSavingNote(true);

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      handleSaveNote(newContent);
    }, 1000); // Autosave after 1 second of inactivity
  };

  const handleSaveNote = (content: string) => {
    if (!firestore || !user || !lessonId) return;

    // Check if note exists to update or create new
    // For simplicity in this demo, we'll just create a new one or update if we had a proper ID tracking
    // In a real app, you'd want to update the existing note doc.
    // Here we'll just simulate the save completion

    // Ideally: if (existingNote) update(existingNote.id) else create()
    // For now, let's just assume we are saving to a "current draft" concept or similar.
    // Since we fetch notes, let's try to update the first one if it exists.

    const noteToUpdate = notes && notes.length > 0 ? notes[0] : null;

    if (noteToUpdate) {
      const noteRef = doc(firestore, `users/${user.uid}/notes/${noteToUpdate.id}`);
      setDocumentNonBlocking(noteRef, { content, timestamp: serverTimestamp() }, { merge: true });
    } else {
      const noteRef = doc(collection(firestore, `users/${user.uid}/notes`));
      setDocumentNonBlocking(noteRef, {
        id: noteRef.id,
        userId: user.uid,
        lessonId,
        content,
        timestamp: serverTimestamp(),
      }, {});
    }

    setIsSavingNote(false);
    setLastSaved(new Date());
  };

  const handleDownloadNotes = () => {
    const element = document.createElement("a");
    const file = new Blob([noteContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `notes-lesson-${lessonId}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gray-50/50 border-r border-gray-200">
      {/* Sidebar Header */}
      <div className="p-5 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <Link
            href={`/courses/${courseId}`}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Course Overview
          </Link>
          {/* Mobile close button would go here if needed */}
        </div>

        {courseLoading ? (
          <Skeleton className="h-6 w-3/4 mb-2" />
        ) : (
          <h2 className="font-bold text-gray-900 leading-tight mb-3 line-clamp-2">
            {course?.title}
          </h2>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span className="font-medium text-gray-900">{Math.round(progress?.percentage || 0)}%</span>
          </div>
          <Progress value={progress?.percentage || 0} className="h-1.5 bg-gray-100" />
        </div>
      </div>

      {/* Course Tree */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {lessonsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <Accordion
              type="multiple"
              className="w-full space-y-3"
              defaultValue={Object.keys(groupedLessons || {})}
            >
              {Object.entries(groupedLessons || {}).map(([sectionName, sectionLessons], sectionIndex) => (
                <AccordionItem key={sectionName} value={sectionName} className="border-none">
                  <AccordionTrigger className="py-2 px-2 hover:bg-gray-100 rounded-lg text-sm font-semibold text-gray-900 hover:no-underline">
                    {sectionName}
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-0">
                    <div className="space-y-1 mt-1">
                      {sectionLessons.map((l, idx) => {
                        const isCurrent = l.id === lessonId;
                        const isLessonCompleted = progress?.completedLessons?.includes(l.id);
                        const isLocked = !user; // Simplified lock logic

                        return (
                          <Link
                            key={l.id}
                            href={user ? `/courses/${courseId}/lesson/${l.id}` : '#'}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-lg text-sm transition-all group relative",
                              isCurrent
                                ? "bg-primary/5 text-primary font-medium ring-1 ring-primary/20"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                              isLocked && "opacity-60 cursor-not-allowed"
                            )}
                          >
                            <div className="mt-0.5 flex-shrink-0">
                              {isLessonCompleted ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : isLocked ? (
                                <Lock className="w-4 h-4 text-gray-400" />
                              ) : l.type === 'video' ? (
                                <PlayCircle className={cn("w-4 h-4", isCurrent ? "text-primary" : "text-gray-400")} />
                              ) : (
                                <FileText className={cn("w-4 h-4", isCurrent ? "text-primary" : "text-gray-400")} />
                              )}
                            </div>
                            <div className="flex-1 leading-snug">
                              <span className="line-clamp-2">{l.title}</span>
                              {l.duration && (
                                <span className="text-xs text-gray-400 mt-1 block font-normal">
                                  {l.duration} min
                                </span>
                              )}
                            </div>
                            {isCurrent && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </ScrollArea>
    </div>
  );

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">Loading your lesson...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:block h-full border-r border-gray-200 bg-gray-50/50 transition-all duration-300 ease-in-out relative z-20",
          isSidebarOpen ? "w-80" : "w-0 opacity-0 overflow-hidden"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative min-w-0 bg-white">
        {/* Top Navigation Bar */}
        <header className="h-16 border-b border-gray-100 flex items-center justify-between px-4 md:px-6 bg-white shrink-0 z-10">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:flex text-gray-500 hover:bg-gray-100"
            >
              <PanelLeft className={cn("h-5 w-5 transition-transform", !isSidebarOpen && "rotate-180")} />
            </Button>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-gray-500">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80">
                <SidebarContent />
              </SheetContent>
            </Sheet>

            <div className="flex flex-col">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {course?.title ? `Course: ${course.title}` : 'Loading...'}
              </span>
              <h1 className="text-sm md:text-base font-bold text-gray-900 line-clamp-1">
                {lesson?.title || 'Loading lesson...'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Optional: Add user profile or other top-right actions here */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden sm:flex" asChild>
                    <Link href={`/courses/${courseId}`}>Course Home</Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Back to course overview</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <ScrollArea className="flex-1 bg-white">
          <div className={cn(
            "mx-auto p-4 md:p-6 lg:p-8 transition-all duration-300",
            theaterMode ? "max-w-full" : "max-w-5xl"
          )}>

            {/* Video Player Container */}
            <div className="relative group mb-8">
              {lessonLoading ? (
                <Skeleton className="aspect-video w-full rounded-xl" />
              ) : (
                <div className={cn(
                  "relative rounded-xl overflow-hidden shadow-2xl bg-black transition-all duration-300 ring-1 ring-black/5",
                  theaterMode ? "aspect-[21/9] md:aspect-video h-[70vh]" : "aspect-video"
                )}>
                  {lesson?.type === 'video' ? (
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${lesson.content}?modestbranding=1&rel=0`}
                      title="Lesson Video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                      <div className="text-center p-8 max-w-2xl">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Reading Lesson</h3>
                        <p className="text-gray-500">Please read the content below to complete this lesson.</p>
                      </div>
                    </div>
                  )}

                  {/* Theater Mode Toggle */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheaterMode(!theaterMode)}
                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full backdrop-blur-sm"
                  >
                    {theaterMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Tabs - Instructor Notes & My Notes */}
            <div className="lg:hidden">
              <Tabs defaultValue="instructor" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="instructor" className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Instructor Notes
                  </TabsTrigger>
                  <TabsTrigger value="mynotes" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    My Notes
                  </TabsTrigger>
                </TabsList>

                {/* Instructor Notes Tab */}
                <TabsContent value="instructor" className="mt-0">
                  <Card className="border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://i.pravatar.cc/150?u=${course?.instructorId}`} />
                          <AvatarFallback>IN</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{course?.instructor || 'Instructor'}</p>
                          <p className="text-xs text-gray-500">Lesson Notes</p>
                        </div>
                      </div>

                      {lessonLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-5/6" />
                          <Skeleton className="h-4 w-4/6" />
                        </div>
                      ) : (
                        <div className="prose prose-slate prose-sm max-w-none text-gray-700 leading-relaxed">
                          <ReactMarkdown>
                            {lesson?.transcript || lesson?.content || "No additional notes provided for this lesson."}
                          </ReactMarkdown>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* My Notes Tab */}
                <TabsContent value="mynotes" className="mt-0">
                  <Card className="border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50/50 p-3 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold text-sm text-gray-900">My Notes</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        {isSavingNote ? (
                          <span className="text-xs text-gray-400 flex items-center gap-1 animate-pulse">
                            <Save className="w-3 h-3" /> Saving...
                          </span>
                        ) : lastSaved ? (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Saved
                          </span>
                        ) : null}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownloadNotes}>
                                <Download className="w-3.5 h-3.5 text-gray-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Download notes</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    <CardContent className="p-0">
                      <Textarea
                        value={noteContent}
                        onChange={handleNoteChange}
                        placeholder="Type your notes here... They autosave!"
                        className="min-h-[400px] border-0 focus-visible:ring-0 resize-none p-4 text-sm leading-relaxed bg-white"
                      />
                    </CardContent>
                    <div className="bg-gray-50 p-2 text-center border-t border-gray-100">
                      <p className="text-[10px] text-gray-400">
                        Notes are private and synced to your account
                      </p>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Desktop Split View - Content & Notes Side by Side */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-8">
              {/* Main Lesson Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Instructor Notes / Description */}
                <div className="prose prose-slate max-w-none">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://i.pravatar.cc/150?u=${course?.instructorId}`} />
                      <AvatarFallback>IN</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-bold text-gray-900 m-0">{course?.instructor || 'Instructor'}</p>
                      <p className="text-xs text-gray-500 m-0">Lesson Notes</p>
                    </div>
                  </div>

                  {lessonLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-4/6" />
                    </div>
                  ) : (
                    <div className="text-gray-700 leading-relaxed">
                      <ReactMarkdown>
                        {lesson?.transcript || lesson?.content || "No additional notes provided for this lesson."}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>

              {/* Student Notes Panel */}
              <div className="lg:col-span-1">
                <div className="sticky top-6">
                  <Card className="border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50/50 p-3 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <h3 className="font-semibold text-sm text-gray-900">My Notes</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        {isSavingNote ? (
                          <span className="text-xs text-gray-400 flex items-center gap-1 animate-pulse">
                            <Save className="w-3 h-3" /> Saving...
                          </span>
                        ) : lastSaved ? (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Saved
                          </span>
                        ) : null}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownloadNotes}>
                                <Download className="w-3.5 h-3.5 text-gray-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Download notes</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    <CardContent className="p-0">
                      <Textarea
                        value={noteContent}
                        onChange={handleNoteChange}
                        placeholder="Type your notes here... They autosave!"
                        className="min-h-[300px] border-0 focus-visible:ring-0 resize-none p-4 text-sm leading-relaxed bg-white"
                      />
                    </CardContent>
                    <div className="bg-gray-50 p-2 text-center border-t border-gray-100">
                      <p className="text-[10px] text-gray-400">
                        Notes are private and synced to your account
                      </p>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Bottom Navigation Bar */}
        <div className="border-t border-gray-200 bg-white p-4 shrink-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <Button
              variant="outline"
              disabled={!prevLesson}
              onClick={() => prevLesson && router.push(`/courses/${courseId}/lesson/${prevLesson.id}`)}
              className="w-32 hidden sm:flex"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex-1 flex justify-center">
              <Button
                size="lg"
                onClick={handleMarkComplete}
                disabled={isMarkingComplete}
                className={cn(
                  "w-full sm:w-auto min-w-[240px] font-semibold shadow-lg transition-all hover:scale-105",
                  isMarkingComplete && "opacity-75 cursor-wait",
                  isCompleted && !nextLesson ? "bg-green-600 hover:bg-green-700" : "bg-primary hover:bg-primary/90"
                )}
              >
                {isMarkingComplete ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : nextLesson ? (
                  <>
                    {isCompleted ? 'Continue to Next Lesson' : 'Mark Complete & Continue'}
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Finish Course
                  </>
                )}
              </Button>
            </div>

            <Button
              variant="outline"
              disabled={!nextLesson}
              onClick={() => nextLesson && router.push(`/courses/${courseId}/lesson/${nextLesson.id}`)}
              className="w-32 hidden sm:flex"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
