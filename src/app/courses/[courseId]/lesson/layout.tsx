'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { useOptimizedCourse, useOptimizedUserProgress } from '@/hooks/use-optimized-data';
import LessonSidebar from '@/components/courses/lesson/LessonSidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { PanelLeft, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LessonLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams<{ courseId: string }>();
    const { courseId } = params;
    const { user } = useFirebase();

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Fetch course data for the sidebar
    // We separate this from lesson content to ensure sidebar stability
    const { course, lessons, isLoading: isCourseLoading } = useOptimizedCourse({
        courseId,
        userId: user?.uid
    });

    const { progress, isLoading: isProgressLoading } = useOptimizedUserProgress({
        courseId,
        userId: user?.uid || ''
    });

    return (
        <div className="flex h-screen bg-white overflow-hidden">
            {/* Desktop Sidebar - Persistent */}
            <aside
                className={cn(
                    "hidden md:block h-full border-r border-gray-200 bg-gray-50/50 transition-all duration-300 ease-in-out relative z-20",
                    isSidebarOpen ? "w-80" : "w-0 opacity-0 overflow-hidden"
                )}
            >
                <LessonSidebar
                    course={course || null}
                    lessons={lessons || []}
                    progress={progress || null}
                    isSidebarOpen={isSidebarOpen}
                />
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full relative min-w-0 bg-white">
                {/* Top Navigation Bar */}
                <header className="h-16 border-b border-gray-100 flex items-center justify-between px-4 md:px-6 bg-white shrink-0 z-10">
                    <div className="flex items-center gap-4">
                        {/* Desktop Sidebar Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="hidden md:flex text-gray-500 hover:bg-gray-100"
                            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                        >
                            <PanelLeft className={cn("h-5 w-5 transition-transform", !isSidebarOpen && "rotate-180")} />
                        </Button>

                        {/* Mobile Menu Trigger */}
                        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="md:hidden text-gray-500">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-80">
                                <LessonSidebar
                                    course={course || null}
                                    lessons={lessons || []}
                                    progress={progress || null}
                                    isSidebarOpen={true}
                                    onCloseSidebar={() => setIsMobileOpen(false)}
                                />
                            </SheetContent>
                        </Sheet>

                        {/* Mobile Course Title (Optional) */}
                        <div className="md:hidden font-medium text-sm truncate max-w-[200px]">
                            {course?.title}
                        </div>
                    </div>

                    {/* Right side actions (optional, e.g. user profile) */}
                    <div className="flex items-center gap-2">
                        {/* Add any header actions here */}
                    </div>
                </header>

                {/* Dynamic Content (Page) */}
                <div className="flex-1 overflow-hidden relative">
                    {children}
                </div>
            </main>
        </div>
    );
}
