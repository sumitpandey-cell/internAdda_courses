'use client';

import { useState, use } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { courses, mainUser } from '@/lib/data';
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
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type LessonPageProps = {
  params: {
    courseId: string;
    lessonId: string;
  };
};

export default function LessonPage({ params }: LessonPageProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const router = useRouter();
  const course = courses.find((c) => c.id === params.courseId);
  if (!course) notFound();

  const lessonIndex = course.lessons.findIndex((l) => l.id === params.lessonId);
  if (lessonIndex === -1) notFound();

  const lesson = course.lessons[lessonIndex];
  const prevLesson = lessonIndex > 0 ? course.lessons[lessonIndex - 1] : null;
  const nextLesson =
    lessonIndex < course.lessons.length - 1
      ? course.lessons[lessonIndex + 1]
      : null;

  const progress = mainUser.progress.find((p) => p.courseId === course.id);
  const isCompleted = progress?.completedLessons.includes(lesson.id);

  return (
    <div
      className={cn(
        "grid min-h-screen bg-background text-foreground transition-all duration-300",
        isSidebarOpen ? "md:grid-cols-[350px_1fr]" : "md:grid-cols-[0px_1fr]"
      )}
    >
      {/* Left Sidebar */}
      <aside className={cn("bg-card flex flex-col h-screen overflow-hidden transition-all duration-300", isSidebarOpen ? "w-[350px]" : "w-0")}>
        <ScrollArea className="flex-1">
            <div className="p-6 border-b">
                <Button
                    variant="ghost"
                    onClick={() => router.push(`/courses/${course.id}`)}
                    className="mb-4"
                >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Course
                </Button>
                <h1 className="text-xl font-bold font-headline">{course.title}</h1>
                <div className="mt-4 space-y-2">
                    <Progress value={progress?.percentage || 0} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                    {Math.round(progress?.percentage || 0)}% complete
                    </p>
                </div>
            </div>
            <div className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Course Content
                </h2>
                <Accordion
                type="single"
                collapsible
                className="w-full"
                defaultValue={`item-${lessonIndex}`}
                >
                {course.lessons.map((l, index) => {
                    const isLessonCompleted = progress?.completedLessons.includes(
                    l.id
                    );
                    return (
                    <AccordionItem key={l.id} value={`item-${index}`}>
                        <AccordionTrigger
                        className={l.id === lesson.id ? 'text-primary' : ''}
                        >
                        <Link
                            href={`/courses/${course.id}/${l.id}`}
                            className="flex items-center gap-3 w-full"
                        >
                            {isLessonCompleted ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                            <PlayCircle className="h-5 w-5 text-muted-foreground" />
                            )}
                            <span className="font-medium text-sm text-left">
                            {l.title}
                            </span>
                        </Link>
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground pl-10">
                        {l.type === 'video'
                            ? `Video - ${l.duration} min`
                            : `Text - ${l.duration} min`}
                        </AccordionContent>
                    </AccordionItem>
                    );
                })}
                </Accordion>
            </div>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen relative">
         <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute top-4 left-4 z-10 bg-background/50 backdrop-blur-sm"
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        <ScrollArea className="flex-1">
            <div className="flex-1 p-6 md:p-8 lg:p-12">
            <div className="aspect-video rounded-lg overflow-hidden shadow-2xl bg-black mb-8">
                {lesson.type === 'video' ? (
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
                        {lesson.content}
                    </div>
                    </CardContent>
                </Card>
                )}
            </div>

            <Tabs defaultValue="transcript" className="w-full">
                <TabsList>
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>
                <TabsContent value="transcript">
                <Card>
                    <CardContent className="p-6">
                    <div className="prose dark:prose-invert max-w-none text-muted-foreground">
                        <p>
                        {lesson.transcript ||
                            'No transcript available for this lesson.'}
                        </p>
                    </div>
                    </CardContent>
                </Card>
                </TabsContent>
                <TabsContent value="notes">
                <Card>
                    <CardContent className="p-6">
                    <div className="prose dark:prose-invert max-w-none text-muted-foreground">
                        <p>
                        This section can contain your personal notes, code
                        snippets, and links to external resources to supplement
                        the lesson.
                        </p>
                    </div>
                    </CardContent>
                </Card>
                </TabsContent>
            </Tabs>
            </div>

            <div className="sticky bottom-0 bg-background/80 backdrop-blur-sm border-t p-4 flex flex-col items-center">
            <div className="w-full max-w-4xl flex justify-between items-center mb-4">
                {prevLesson ? (
                <Button variant="outline" asChild>
                    <Link href={`/courses/${course.id}/${prevLesson.id}`}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                    </Link>
                </Button>
                ) : (
                <div />
                )}
                {nextLesson ? (
                <Button variant="default" asChild>
                    <Link href={`/courses/${course.id}/${nextLesson.id}`}>
                    Next Lesson <ChevronRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
                ) : (
                <div />
                )}
            </div>
            <Button
                variant={isCompleted ? 'secondary' : 'outline'}
                size="lg"
                className="w-full max-w-sm"
            >
                <CheckCircle className="mr-2 h-5 w-5" />
                {isCompleted ? 'Completed' : 'Mark as Complete'}
            </Button>
            </div>
        </ScrollArea>
      </main>
    </div>
  );
}
