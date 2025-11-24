'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useFirebase,
  useDoc,
  useCollection,
  useMemoFirebase,
  setDocumentNonBlocking,
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
  Lock,
  Menu,
  Download,
  Save,
  Maximize2,
  Minimize2,
  FileText,
  Check,
  Award
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import type { Course, Lesson, UserProgress, Note, Purchase } from '@/lib/data-types';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import ReactMarkdown from 'react-markdown';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LessonContentProps {
  courseId: string;
  currentLessonId: string;
  onNavigateToLesson: (lessonId: string) => void;
  onBackToCourse?: () => void;
  isTransitioning: boolean;
}

export default function LessonContent({
  courseId,
  currentLessonId,
  onNavigateToLesson,
  onBackToCourse,
  isTransitioning,
}: LessonContentProps) {
  const router = useRouter();
  const { firestore, user, isUserLoading } = useFirebase();
  const { markLessonComplete } = useProgressTracking();
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theaterMode, setTheaterMode] = useState(false);
  
  // Note State
  const [noteContent, setNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Lesson Navigation State - smooth transitions
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [isCourseCompleted, setIsCourseCompleted] = useState(false);
  
  // Local optimistic state for progress
  const [optimisticProgress, setOptimisticProgress] = useState<Partial<UserProgress> | null>(null);
  const [optimisticCompletedLessons, setOptimisticCompletedLessons] = useState<Set<string>>(new Set());

  // Refs
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const navigationPendingRef = useRef(false);

  useEffect(() => {
    // Redirect if not logged in after checking auth status
    if (!isUserLoading && !user) {
      router.push(`/login?redirect=/courses/${courseId}/lesson/${currentLessonId}`);
    }
  }, [isUserLoading, user, router, courseId, currentLessonId]);

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
  
  // KEY CHANGE: Uses currentLessonId state instead of URL params
  // When state changes, Firestore listener automatically updates without URL change
  const lessonRef = useMemoFirebase(
    () => (firestore && courseId && currentLessonId ? doc(firestore, 'courses', courseId, 'lessons', currentLessonId) : null),
    [firestore, courseId, currentLessonId]
  );
  
  const progressRef = useMemoFirebase(
    () => (firestore && user && courseId ? query(collection(firestore, 'userProgress'), where('userId', '==', user.uid), where('courseId', '==', courseId)) : null),
    [firestore, user, courseId]
  );
  
  const notesQuery = useMemoFirebase(
    () =>
      firestore && user && currentLessonId
        ? query(collection(firestore, 'users', user.uid, 'notes'), where('lessonId', '==', currentLessonId))
        : null,
    [firestore, user, currentLessonId]
  );

  const purchaseQuery = useMemoFirebase(
    () => (firestore && user && courseId ? query(collection(firestore, 'purchases'), where('userId', '==', user.uid), where('courseId', '==', courseId)) : null),
    [firestore, user, courseId]
  );

  const { data: course, isLoading: courseLoading } = useDoc<Course>(courseRef);
  const { data: purchases, isLoading: purchasesLoading } = useCollection<Purchase>(purchaseQuery);
  const { data: lessons, isLoading: lessonsLoading } = useCollection<Lesson>(lessonsQuery);
  const { data: lesson, isLoading: lessonLoading } = useDoc<Lesson>(lessonRef);
  const { data: progressData, isLoading: progressLoading } = useCollection<UserProgress>(progressRef);
  const { data: notes, isLoading: notesLoading } = useCollection<Note>(notesQuery);

  // Get the actual progress data (either optimistic or from firestore)
  const progress = optimisticProgress || (progressData && progressData.length > 0 ? progressData[0] : null);
  const completedLessons = optimisticCompletedLessons.size > 0 ? Array.from(optimisticCompletedLessons) : progress?.completedLessons || [];

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

  // Load existing note into textarea
  useEffect(() => {
    if (notes && notes.length > 0) {
      setNoteContent(notes[0].content);
    } else {
      setNoteContent('');
    }
  }, [notes]);

  // Sync optimistic state with firestore progress updates
  useEffect(() => {
    if (progressData && progressData.length > 0 && optimisticCompletedLessons.size > 0) {
      // Firestore has updated, clear optimistic state
      setOptimisticCompletedLessons(new Set());
      setOptimisticProgress(null);
    }
  }, [progressData]);

  const lessonIndex = lessons?.findIndex((l) => l.id === currentLessonId) ?? -1;
  const prevLesson = lessonIndex > 0 ? lessons?.[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < (lessons?.length ?? 0) - 1 ? lessons?.[lessonIndex + 1] : null;
  const isCompleted = completedLessons.includes(currentLessonId);

  // Group lessons by their section field
  const groupedLessons = useMemo(() => {
    return lessons?.reduce((acc, lesson, index) => {
      const sectionName = lesson.section || 'Other Lessons';
      if (!acc[sectionName]) {
        acc[sectionName] = [];
      }
      acc[sectionName].push(lesson);
      return acc;
    }, {} as Record<string, Lesson[]>);
  }, [lessons]);

  // Handle mark complete with optimistic updates
  const handleMarkComplete = useCallback(async () => {
    if (!user || !lessons || !course || !courseId || !currentLessonId || navigationPendingRef.current) {
      return;
    }

    setIsMarkingComplete(true);

    try {
      // Optimistic update: update local state immediately
      const newCompletedLessons = new Set(completedLessons);
      newCompletedLessons.add(currentLessonId);
      
      const newPercentage = Math.round((newCompletedLessons.size / lessons.length) * 100);
      
      setOptimisticCompletedLessons(newCompletedLessons);
      setOptimisticProgress({
        userId: user.uid,
        courseId,
        completedLessons: Array.from(newCompletedLessons),
        totalLessons: lessons.length,
        percentage: newPercentage,
        lastLessonId: currentLessonId,
      });

      // Call the actual progress tracking function
      const { success, newPercentage: actualPercentage } = await markLessonComplete(
        courseId,
        currentLessonId,
        lessons.length
      );

      if (success) {
        // Determine next action
        const courseComplete = (actualPercentage ?? newPercentage) === 100;
        
        if (nextLesson) {
          // Navigate to next lesson smoothly (via state, not URL)
          onNavigateToLesson(nextLesson.id);
        } else if (courseComplete) {
          // Course completed - set state to show "Give Test" button
          setIsCourseCompleted(true);
        }
      } else {
        // Revert optimistic update on failure
        setOptimisticCompletedLessons(new Set(completedLessons));
        setOptimisticProgress(null);
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      // Revert optimistic update on error
      setOptimisticCompletedLessons(new Set(completedLessons));
      setOptimisticProgress(null);
    } finally {
      setIsMarkingComplete(false);
    }
  }, [user, lessons, course, courseId, currentLessonId, completedLessons, nextLesson, markLessonComplete, onNavigateToLesson, router]);

  // Autosave logic for notes
  const handleNoteChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setNoteContent(newContent);
    setIsSavingNote(true);

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(() => {
      handleSaveNote(newContent);
    }, 1000);
  }, []);

  const handleSaveNote = useCallback((content: string) => {
    if (!firestore || !user || !currentLessonId) return;

    const noteToUpdate = notes && notes.length > 0 ? notes[0] : null;

    if (noteToUpdate) {
      const noteRef = doc(firestore, `users/${user.uid}/notes/${noteToUpdate.id}`);
      setDocumentNonBlocking(noteRef, { content, timestamp: serverTimestamp() }, { merge: true });
    } else {
      const noteRef = doc(collection(firestore, `users/${user.uid}/notes`));
      setDocumentNonBlocking(noteRef, {
        id: noteRef.id,
        userId: user.uid,
        lessonId: currentLessonId,
        content,
        timestamp: serverTimestamp(),
      }, {});
    }

    setIsSavingNote(false);
    setLastSaved(new Date());
  }, [firestore, user, currentLessonId, notes]);

  const handleDownloadNotes = useCallback(() => {
    const element = document.createElement("a");
    const file = new Blob([noteContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `notes-lesson-${currentLessonId}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }, [noteContent, currentLessonId]);

  const SidebarContent = () => {
    const displayProgress = progress?.percentage ?? 0;
    
    return (
      <div className="flex flex-col h-full bg-gray-50/50 border-r border-gray-200">
        {/* Sidebar Header */}
        <div className="p-5 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onBackToCourse}
              disabled={!onBackToCourse}
              className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Course Overview
            </button>
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
              <span className="font-medium text-gray-900">{Math.round(displayProgress)}%</span>
            </div>
            <Progress value={displayProgress} className="h-1.5 bg-gray-100" />
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
                defaultValue={[]}
              >
                {Object.entries(groupedLessons || {}).map(([sectionName, sectionLessons]) => (
                  <AccordionItem key={sectionName} value={sectionName} className="border-none">
                    <AccordionTrigger className="py-2 hover:bg-gray-100 rounded-lg text-sm text-gray-900 hover:no-underline text-left">
                      {sectionName}
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pb-0">
                      <div className="space-y-1 mt-1">
                        {sectionLessons.map((l) => {
                          const isCurrent = l.id === currentLessonId;
                          const isLessonCompleted = completedLessons.includes(l.id);
                          const isLocked = !user;

                          return (
                            <button
                              key={l.id}
                              onClick={() => !isLocked && onNavigateToLesson(l.id)}
                              disabled={isLocked || isTransitioning}
                              className={cn(
                                "w-full flex items-start gap-3 p-3 rounded-lg text-sm transition-all group relative",
                                isCurrent
                                  ? "bg-primary/5 text-primary font-medium ring-1 ring-primary/20"
                                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                                isLocked && "opacity-60 cursor-not-allowed",
                                isTransitioning && "opacity-75"
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
                              <div className="flex-1 leading-snug text-left">
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
                            </button>
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
  };

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
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="hidden sm:flex"
                    onClick={onBackToCourse}
                    disabled={!onBackToCourse}
                  >
                    Course Home
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
                  "relative rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ring-1 ring-black/5",
                  theaterMode ? "aspect-[21/9] md:aspect-video h-[70vh]" : "aspect-video"
                )}>
                  {lesson?.type === 'video' ? (
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${lesson.content}?modestbranding=1&rel=0`}
                      title="Lesson Video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
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
              disabled={!prevLesson || isTransitioning}
              onClick={() => prevLesson && onNavigateToLesson(prevLesson.id)}
              className="w-32 hidden sm:flex"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex-1 flex justify-center">
              {isCourseCompleted ? (
                <Button
                  size="lg"
                  onClick={() => {
                    navigationPendingRef.current = true;
                    router.push(`/courses/${courseId}/test`);
                  }}
                  className="w-full sm:w-auto min-w-[240px] font-semibold shadow-lg transition-all hover:scale-105 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Award className="mr-2 h-5 w-5" />
                  Give Test for Certificate
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={handleMarkComplete}
                  disabled={isMarkingComplete || isTransitioning}
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
                  ) : isTransitioning ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Loading...
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
              )}
            </div>

            <Button
              variant="outline"
              disabled={!nextLesson || isTransitioning}
              onClick={() => nextLesson && onNavigateToLesson(nextLesson.id)}
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
