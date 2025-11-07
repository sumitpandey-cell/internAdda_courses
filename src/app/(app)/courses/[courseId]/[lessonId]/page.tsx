import { notFound } from "next/navigation";
import Link from "next/link";
import { courses } from "@/lib/data";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  FileText,
  Video,
  BookText,
  Notebook,
  Menu,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

type LessonPageProps = {
  params: {
    courseId: string;
    lessonId: string;
  };
};

function LessonSidebar({ course, currentLessonId }: { course: any, currentLessonId: string }) {
    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <CardTitle>Lessons</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1">
                <ScrollArea className="h-full">
                    <ul className="space-y-1 p-4">
                        {course.lessons.map((l: any) => (
                            <li key={l.id}>
                                <Link href={`/courses/${course.id}/${l.id}`}>
                                    <div className={`flex items-center gap-3 p-3 rounded-md transition-colors ${l.id === currentLessonId ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'}`}>
                                        {l.type === 'video' ? <Video className="h-4 w-4 flex-shrink-0" /> : <FileText className="h-4 w-4 flex-shrink-0" />}
                                        <span className="text-sm truncate flex-1">{l.title}</span>
                                        {l.id === currentLessonId && <CheckCircle className="h-4 w-4 ml-auto text-primary flex-shrink-0" />}
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

export default function LessonPage({ params }: LessonPageProps) {
  const course = courses.find((c) => c.id === params.courseId);
  if (!course) notFound();

  const lessonIndex = course.lessons.findIndex((l) => l.id === params.lessonId);
  if (lessonIndex === -1) notFound();

  const lesson = course.lessons[lessonIndex];
  const prevLesson = lessonIndex > 0 ? course.lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < course.lessons.length - 1 ? course.lessons[lessonIndex + 1] : null;

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Lessons (Desktop) */}
      <aside className="hidden lg:block w-80 xl:w-96 flex-shrink-0 border-r p-4">
          <LessonSidebar course={course} currentLessonId={lesson.id} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
              <Sheet>
                  <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="lg:hidden">
                          <Menu className="h-6 w-6" />
                          <span className="sr-only">Open lesson menu</span>
                      </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-4 w-full max-w-sm">
                      <LessonSidebar course={course} currentLessonId={lesson.id} />
                  </SheetContent>
              </Sheet>
              <Button variant="outline" size="sm" asChild>
                  <Link href={`/courses/${course.id}`}>
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back to Course
                  </Link>
              </Button>
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-headline text-center truncate px-4">{lesson.title}</h1>
          <Button size="sm">
              <CheckCircle className="mr-2 h-4 w-4" />
              <span className="hidden md:inline">Mark as Completed</span>
          </Button>
        </div>

        <div className="flex-1 mb-4">
            {lesson.type === "video" ? (
                <div className="aspect-video rounded-lg overflow-hidden shadow-lg bg-black">
                    <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${lesson.content}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
            ) : (
                <Card className="h-full">
                    <CardContent className="p-6 h-full overflow-y-auto">
                        <div className="prose dark:prose-invert max-w-none">{lesson.content}</div>
                    </CardContent>
                </Card>
            )}
        </div>

        <div className="flex justify-between items-center mt-auto pt-4 border-t">
          {prevLesson ? (
            <Button variant="outline" asChild>
              <Link href={`/courses/${course.id}/${prevLesson.id}`}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Link>
            </Button>
          ) : <div />}
          {nextLesson ? (
            <Button variant="outline" asChild>
              <Link href={`/courses/${course.id}/${nextLesson.id}`}>
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : <div />}
        </div>
      </main>

      {/* Right Sidebar - Notes & Transcript */}
      <aside className="hidden md:block w-80 xl:w-96 flex-shrink-0 border-l p-4">
        <div className="flex flex-col gap-4 h-full">
            <Card className="flex-1 flex flex-col h-1/2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Notebook className="h-5 w-5" /> My Notes</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-2">
                <Textarea placeholder="Write your notes here..." className="flex-1 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
                <Button className="mt-2 w-full">Save Note</Button>
              </CardContent>
            </Card>

            {lesson.transcript && (
                <Card className="flex-1 flex flex-col h-1/2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookText className="h-5 w-5" /> Transcript
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex-1">
                        <ScrollArea className="h-full">
                           <p className="prose dark:prose-invert max-w-none text-sm p-4">{lesson.transcript}</p>
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}
        </div>
      </aside>
    </div>
  );
}
