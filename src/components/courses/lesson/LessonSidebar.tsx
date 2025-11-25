'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    ChevronLeft,
    CheckCircle,
    PlayCircle,
    Lock,
    FileText,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import type { Course, Lesson, UserProgress } from '@/lib/data-types';

interface LessonSidebarProps {
    course: Course | null;
    lessons: Lesson[] | null;
    progress: UserProgress | null;
    isSidebarOpen: boolean;
    onCloseSidebar?: () => void;
}

export default function LessonSidebar({
    course,
    lessons,
    progress,
    isSidebarOpen,
    onCloseSidebar,
}: LessonSidebarProps) {
    const params = useParams<{ courseId: string; lessonId: string }>();
    const { courseId, lessonId: currentLessonId } = params;
    const router = useRouter();

    const [openAccordionSections, setOpenAccordionSections] = useState<string[]>([]);
    const sidebarScrollRef = useRef<HTMLDivElement>(null);
    const currentLessonButtonRef = useRef<HTMLButtonElement>(null);

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

    const currentLessonSection = useMemo(() => {
        if (!lessons) return null;
        const currentLesson = lessons.find((l: Lesson) => l.id === currentLessonId);
        if (!currentLesson) return null;
        return currentLesson.section || 'Other Lessons';
    }, [lessons, currentLessonId]);

    const completedLessons: string[] = progress?.completedLessons || [];
    const displayProgress = progress?.percentage ?? 0;

    // Function to scroll to current lesson intelligently
    const scrollToCurrentLesson = useCallback(() => {
        if (!sidebarScrollRef.current || !currentLessonId) return;

        // Find the current lesson button using data attribute  
        const currentLessonButton = sidebarScrollRef.current.querySelector(`[data-lesson-id="${currentLessonId}"]`) as HTMLElement;
        if (currentLessonButton) {
            // Try to find the ScrollArea viewport first
            const scrollViewport = sidebarScrollRef.current.closest('[data-radix-scroll-area-root]')?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;

            if (scrollViewport) {
                const viewportRect = scrollViewport.getBoundingClientRect();
                const buttonRect = currentLessonButton.getBoundingClientRect();

                const isVisible =
                    buttonRect.top >= viewportRect.top &&
                    buttonRect.bottom <= viewportRect.bottom;

                if (!isVisible) {
                    const viewportHeight = viewportRect.height;
                    const buttonHeight = buttonRect.height;
                    const currentScrollTop = scrollViewport.scrollTop;
                    const buttonTopRelativeToDocument = buttonRect.top + window.scrollY;
                    const viewportTopRelativeToDocument = viewportRect.top + window.scrollY;
                    const buttonTopRelativeToViewport = buttonTopRelativeToDocument - viewportTopRelativeToDocument + currentScrollTop;

                    const idealScrollTop = buttonTopRelativeToViewport - (viewportHeight / 2) + (buttonHeight / 2);

                    scrollViewport.scrollTo({
                        top: Math.max(0, idealScrollTop),
                        behavior: 'smooth'
                    });
                }
            } else {
                currentLessonButton.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'nearest'
                });
            }
        }
    }, [currentLessonId]);

    // Handle accordion changes
    const handleAccordionChange = useCallback((newValue: string[]) => {
        setOpenAccordionSections(newValue);
    }, []);

    // Auto-open accordion section containing current lesson
    useEffect(() => {
        if (currentLessonSection) {
            setOpenAccordionSections(prev => {
                if (!prev.includes(currentLessonSection)) {
                    return [...prev, currentLessonSection];
                }
                return prev;
            });

            // Scroll to lesson after a short delay to allow accordion to open
            setTimeout(() => {
                scrollToCurrentLesson();
            }, 300);
        }
    }, [currentLessonSection, scrollToCurrentLesson]);

    return (
        <div className="flex flex-col h-full bg-gray-50/50 border-r border-gray-200">
            {/* Sidebar Header */}
            <div className="p-5 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <Link
                            href={`/courses/${courseId}`}
                            className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Course Overview
                        </Link>
                    </div>

                    {/* Collapse sidebar button (only visible on mobile or if controlled externally) */}
                    {onCloseSidebar && (
                        <div>
                            <button
                                onClick={onCloseSidebar}
                                aria-label="Collapse sidebar"
                                className="text-sm text-gray-500 hover:text-gray-900 p-1 rounded-md transition-colors md:hidden"
                                title="Collapse sidebar"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {!course ? (
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
                <div className="p-4" ref={sidebarScrollRef}>
                    {!course ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                        </div>
                    ) : (
                        <Accordion
                            type="multiple"
                            value={openAccordionSections}
                            onValueChange={handleAccordionChange}
                            className="w-full space-y-3"
                        >
                            {Object.entries(groupedLessons || {}).map(([sectionName, sectionLessons]) => (
                                <AccordionItem key={sectionName} value={sectionName} className="border-none">
                                    <AccordionTrigger className="py-2 hover:bg-gray-100 rounded-lg text-sm text-gray-900 hover:no-underline text-left px-2">
                                        {sectionName}
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-1 pb-0">
                                        <div className="space-y-1 mt-1">
                                            {sectionLessons.map((l: Lesson) => {
                                                const isCurrent = l.id === currentLessonId;
                                                const isLessonCompleted = completedLessons.includes(l.id);
                                                // const isLocked = !user; // We can check this if we pass user, or just assume access for now
                                                const isLocked = false;

                                                return (
                                                    <Link
                                                        key={l.id}
                                                        href={`/courses/${courseId}/lesson/${l.id}`}
                                                        onClick={() => {
                                                            if (window.innerWidth < 768 && onCloseSidebar) {
                                                                onCloseSidebar();
                                                            }
                                                        }}
                                                        className={cn(
                                                            "w-full flex items-start gap-3 p-3 rounded-lg text-sm transition-all group relative scroll-mt-4",
                                                            isCurrent
                                                                ? "bg-primary/5 text-primary font-medium ring-1 ring-primary/20 shadow-sm"
                                                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm",
                                                            isLocked && "opacity-60 cursor-not-allowed pointer-events-none"
                                                        )}
                                                        data-lesson-id={l.id}
                                                    >
                                                        <div className="mt-0.5 flex-shrink-0">
                                                            {isLessonCompleted ? (
                                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                            ) : isLocked ? (
                                                                <Lock className="w-4 h-4 text-gray-400" />
                                                            ) : (
                                                                <PlayCircle className={cn("w-4 h-4", isCurrent ? "text-primary" : "text-gray-400")} />
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
}
