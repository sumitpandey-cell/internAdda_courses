'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  useFirebase,
  setDocumentNonBlocking,
} from '@/firebase';
import { doc, collection, serverTimestamp } from 'firebase/firestore';
import { useOptimizedLessonPage } from '@/hooks/use-optimized-data';
import { useProgressTracking } from '@/hooks/use-progress-tracking';
import { cn } from '@/lib/utils';
import type { Lesson, UserProgress } from '@/lib/data-types';
import ReactMarkdown from 'react-markdown';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Icons
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Download,
  Save,
  Maximize2,
  Minimize2,
  Check,
  Award,
  BookOpen,
  FileText
} from 'lucide-react';

interface LessonContentProps {
  courseId: string;
  currentLessonId: string;
}

export default function LessonContent({
  courseId,
  currentLessonId,
}: LessonContentProps) {
  const router = useRouter();
  const { firestore, user, isUserLoading } = useFirebase();
  const { markLessonComplete } = useProgressTracking();

  // UI State
  const [theaterMode, setTheaterMode] = useState(false);

  // Note State
  const [noteContent, setNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Navigation State
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
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

  // Use optimized hook for all lesson page data
  const {
    course,
    lessons,
    currentLesson: lesson,
    progress: progressData,
    notes,
    isLoading: dataIsLoading
  } = useOptimizedLessonPage({
    courseId,
    lessonId: currentLessonId,
    userId: user?.uid || ''
  });

  // Reset navigation state when lesson changes
  useEffect(() => {
    setIsNavigating(false);
  }, [currentLessonId]);

  const isLoading = dataIsLoading;

  // Get the actual progress data (either optimistic or from firestore)
  const progress = optimisticProgress || progressData;
  const completedLessons: string[] = optimisticCompletedLessons.size > 0 ? Array.from(optimisticCompletedLessons) : progress?.completedLessons || [];

  // Find current lesson's section for next/prev navigation
  const currentLessonSection = useMemo(() => {
    if (!lessons) return null;
    const currentLesson = lessons.find((l: Lesson) => l.id === currentLessonId);
    if (!currentLesson) return null;
    return currentLesson.section || 'Other Lessons';
  }, [lessons, currentLessonId]);

  // Group lessons by section
  const groupedLessons = useMemo(() => {
    return lessons?.reduce((acc: Record<string, Lesson[]>, lesson: Lesson) => {
      const sectionName = lesson.section || 'Other Lessons';
      if (!acc[sectionName]) {
        acc[sectionName] = [];
      }
      acc[sectionName].push(lesson);
      return acc;
    }, {} as Record<string, Lesson[]>);
  }, [lessons]);

  // Get section order (based on first appearance in lessons array)
  const sectionOrder = useMemo(() => {
    if (!lessons) return [];
    const seen = new Set<string>();
    const order: string[] = [];
    lessons.forEach((lesson: Lesson) => {
      const section = lesson.section || 'Other Lessons';
      if (!seen.has(section)) {
        seen.add(section);
        order.push(section);
      }
    });
    return order;
  }, [lessons]);

  // Get next/prev lessons within section first, then across sections
  const { prevLesson, nextLesson } = useMemo(() => {
    if (!lessons || !currentLessonSection || !groupedLessons) {
      return { prevLesson: null, nextLesson: null };
    }

    const currentSectionLessons = groupedLessons[currentLessonSection] || [];
    const currentIndexInSection = currentSectionLessons.findIndex((l: Lesson) => l.id === currentLessonId);
    const currentSectionIndex = sectionOrder.indexOf(currentLessonSection);

    // Find next lesson
    let nextLesson: Lesson | null = null;
    if (currentIndexInSection < currentSectionLessons.length - 1) {
      // Next sublesson in same section
      nextLesson = currentSectionLessons[currentIndexInSection + 1];
    } else if (currentSectionIndex < sectionOrder.length - 1) {
      // First lesson of next section
      const nextSection = sectionOrder[currentSectionIndex + 1];
      const nextSectionLessons = groupedLessons[nextSection] || [];
      nextLesson = nextSectionLessons[0] || null;
    }

    // Find previous lesson
    let prevLesson: Lesson | null = null;
    if (currentIndexInSection > 0) {
      // Previous sublesson in same section
      prevLesson = currentSectionLessons[currentIndexInSection - 1];
    } else if (currentSectionIndex > 0) {
      // Last lesson of previous section
      const prevSection = sectionOrder[currentSectionIndex - 1];
      const prevSectionLessons = groupedLessons[prevSection] || [];
      prevLesson = prevSectionLessons[prevSectionLessons.length - 1] || null;
    }

    return { prevLesson, nextLesson };
  }, [lessons, currentLessonId, currentLessonSection, groupedLessons, sectionOrder]);

  const isCompleted = completedLessons.includes(currentLessonId);

  // Load existing note into textarea
  useEffect(() => {
    if (!dataIsLoading && notes) {
      if (notes.length > 0) {
        setNoteContent(notes[0].content);
      } else {
        setNoteContent('');
      }
    }
  }, [notes, dataIsLoading, currentLessonId]);

  // Sync optimistic state with firestore progress updates
  useEffect(() => {
    if (progressData && optimisticCompletedLessons.size > 0) {
      // Firestore has updated, clear optimistic state
      setOptimisticCompletedLessons(new Set());
      setOptimisticProgress(null);
    }
  }, [progressData?.userId, progressData?.courseId]);

  // Handle navigation
  const handleNavigate = useCallback((lessonId: string) => {
    setIsNavigating(true);
    router.push(`/courses/${courseId}/lesson/${lessonId}`);
  }, [courseId, router]);

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
          // Navigate to next lesson
          handleNavigate(nextLesson.id);
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
  }, [user?.uid, lessons?.length, courseId, currentLessonId, completedLessons, nextLesson?.id, markLessonComplete, handleNavigate]);

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
  }, [firestore, user?.uid, currentLessonId, notes?.[0]?.id]);

  const handleDownloadNotes = useCallback(() => {
    const element = document.createElement("a");
    const file = new Blob([noteContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `notes-lesson-${currentLessonId}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }, [noteContent, currentLessonId]);

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
    <>
      {/* Scrollable Content Area */}
      <ScrollArea className="flex-1 bg-white h-full">
        <div className={cn(
          "mx-auto p-4 md:p-6 lg:p-8 transition-all duration-300 pb-24", // Added padding bottom for fixed footer
          theaterMode ? "max-w-full" : "max-w-5xl"
        )}>

          {/* Video Player Container - Only show if video ID exists and is not empty */}
          {lesson?.content && lesson.content.trim() !== '' && (
            <div className="relative group mb-8">
              {isLoading ? (
                <Skeleton className="aspect-video w-full rounded-xl" />
              ) : (
                <div className={cn(
                  "relative rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ring-1 ring-black/5",
                  theaterMode ? "aspect-[21/9] md:aspect-video h-[70vh]" : "aspect-video"
                )}>
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${lesson.content}?modestbranding=1&rel=0`}
                    title="Lesson Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />

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
          )}

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

                    {isLoading ? (
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
                    {isLoading ? (
                      <div className="p-4">
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ) : (
                      <Textarea
                        value={noteContent}
                        onChange={handleNoteChange}
                        placeholder="Type your notes here... They autosave!"
                        className="min-h-[400px] border-0 focus-visible:ring-0 resize-none p-4 text-sm leading-relaxed bg-white"
                      />
                    )}
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

          {/* Desktop Tabs - Instructor Notes & My Notes */}
          <div className="hidden lg:block">
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

                    {isLoading ? (
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
                    {isLoading ? (
                      <div className="p-4">
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    ) : (
                      <Textarea
                        value={noteContent}
                        onChange={handleNoteChange}
                        placeholder="Type your notes here... They autosave!"
                        className="min-h-[300px] border-0 focus-visible:ring-0 resize-none p-4 text-sm leading-relaxed bg-white"
                      />
                    )}
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
        </div>
      </ScrollArea>

      {/* Bottom Navigation Bar - Fixed at bottom */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-4 shrink-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <Button
            variant="outline"
            disabled={!prevLesson || isNavigating}
            onClick={() => prevLesson && handleNavigate(prevLesson.id)}
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
                disabled={isMarkingComplete || isNavigating}
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
                ) : isNavigating ? (
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
            disabled={!nextLesson || isNavigating}
            onClick={() => nextLesson && handleNavigate(nextLesson.id)}
            className="w-32 hidden sm:flex"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </>
  );
}
