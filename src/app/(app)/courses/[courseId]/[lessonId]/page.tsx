'use client';

import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { courses, mainUser } from '@/lib/data';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
} from 'lucide-react';

type LessonPageProps = {
  params: {
    courseId: string;
    lessonId: string;
  };
};

export default function LessonPage({ params }: LessonPageProps) {
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
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Left Sidebar */}
      <aside className="w-[350px] flex-shrink-0 border-r bg-card p-6 flex flex-col">
        <div className="flex-1">
          <Button
            variant="ghost"
            onClick={() => router.push(`/courses/${course.id}`)}
            className="mb-6"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Button>
          <h1 className="text-2xl font-bold font-headline">{course.title}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {course.description}
          </p>
          <div className="mt-4 space-y-2">
            <Progress value={progress?.percentage || 0} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {Math.round(progress?.percentage || 0)}% complete
            </p>
          </div>
          <div className="mt-8">
            <Accordion
              type="single"
              collapsible
              className="w-full"
              defaultValue={`item-${lessonIndex}`}
            >
              {course.lessons.map((l, index) => (
                <AccordionItem key={l.id} value={`item-${index}`}>
                  <AccordionTrigger>
                    <Link
                      href={`/courses/${course.id}/${l.id}`}
                      className="flex items-center gap-3 w-full"
                    >
                      <PlayCircle className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium text-sm">{l.title}</span>
                    </Link>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pl-10">
                    {l.type === 'video' ? `Video - ${l.duration} min` : `Text - ${l.duration} min`}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-6 md:p-8 lg:p-12 overflow-y-auto">
        <div className="flex-1">
          <div className="aspect-video rounded-lg overflow-hidden shadow-2xl bg-black">
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
                        <div className="prose dark:prose-invert max-w-none">{lesson.content}</div>
                    </CardContent>
                </Card>
            )}
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-bold font-headline">{lesson.title}</h2>
            <div className="mt-4 prose dark:prose-invert max-w-none text-muted-foreground">
                <h3 className="text-lg font-semibold text-foreground">Notes</h3>
                <p>
                    {lesson.transcript || 'This section can contain more detailed notes, code snippets, and links to external resources to supplement the video lesson.'}
                </p>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center">
             <div className="w-full max-w-3xl flex justify-between items-center mb-4">
               {prevLesson ? (
                 <Button variant="outline" asChild>
                   <Link href={`/courses/${course.id}/${prevLesson.id}`}>
                     <ChevronLeft className="mr-2 h-4 w-4" /> Previous Lesson
                   </Link>
                 </Button>
               ) : <div />}
               {nextLesson ? (
                 <Button variant="default" asChild>
                   <Link href={`/courses/${course.id}/${nextLesson.id}`}>
                     Next Lesson <ChevronRight className="ml-2 h-4 w-4" />
                   </Link>
                 </Button>
               ) : <div />}
             </div>
             <Button variant={isCompleted ? "secondary" : "outline"} size="lg" className="w-full max-w-sm">
                 <CheckCircle className="mr-2 h-5 w-5" />
                 {isCompleted ? 'Completed' : 'Mark as Complete'}
             </Button>
        </div>
      </main>
    </div>
  );
}