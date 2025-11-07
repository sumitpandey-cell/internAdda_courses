import { notFound } from "next/navigation";
import Link from "next/link";
import { courses } from "@/lib/data";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, CheckCircle, FileText, Video, BookText, PanelLeft } from "lucide-react";

type LessonPageProps = {
  params: {
    courseId: string;
    lessonId: string;
  };
};

export default function LessonPage({ params }: LessonPageProps) {
  const course = courses.find((c) => c.id === params.courseId);
  if (!course) notFound();

  const lessonIndex = course.lessons.findIndex((l) => l.id === params.lessonId);
  if (lessonIndex === -1) notFound();

  const lesson = course.lessons[lessonIndex];
  const prevLesson = lessonIndex > 0 ? course.lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < course.lessons.length - 1 ? course.lessons[lessonIndex + 1] : null;

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-2*theme(spacing.6))]">
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        <div className="flex items-center justify-between mb-4">
            <Button variant="outline" asChild>
                <Link href={`/courses/${course.id}`}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Course
                </Link>
            </Button>
            <h1 className="text-3xl font-bold font-headline text-center">{lesson.title}</h1>
            <div></div>
        </div>
          
          {lesson.type === "video" ? (
            <div className="flex-1 flex flex-col overflow-hidden space-y-4">
                <div className="aspect-video rounded-lg overflow-hidden flex-shrink-0">
                  <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${lesson.content}`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                  ></iframe>
                </div>
                {lesson.transcript && (
                    <Card className="flex-1 flex flex-col overflow-hidden">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookText className="h-6 w-6" />
                                Transcript
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto">
                            <p className="prose dark:prose-invert max-w-none">{lesson.transcript}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
          ) : (
             <Card className="flex-1 overflow-hidden">
                <CardContent className="p-6 h-full overflow-y-auto">
                    <p className="prose dark:prose-invert max-w-none">{lesson.content}</p>
                </CardContent>
             </Card>
          )}

        <div className="flex justify-between items-center mt-4 pt-4 border-t flex-shrink-0">
          {prevLesson ? (
            <Button variant="outline" asChild>
              <Link href={`/courses/${course.id}/${prevLesson.id}`}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Link>
            </Button>
          ) : <div></div>}
          <Button>
              <CheckCircle className="mr-2 h-4 w-4" /> Mark as Completed
          </Button>
          {nextLesson ? (
            <Button variant="outline" asChild>
              <Link href={`/courses/${course.id}/${nextLesson.id}`}>
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : <div></div>}
        </div>
      </div>

      {/* Sidebar for notes and lesson list */}
      <div className="w-full md:w-80 lg:w-96 flex flex-col gap-4">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle>My Notes</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <Textarea placeholder="Write your notes here..." className="flex-1" />
            <Button className="mt-2">Save Note</Button>
          </CardContent>
        </Card>
        <Card className="flex flex-col" style={{maxHeight: '35%'}}>
           <CardHeader>
            <CardTitle>Lessons</CardTitle>
          </CardHeader>
          <CardContent className="overflow-y-auto">
             <ul className="space-y-1">
                {course.lessons.map(l => (
                    <li key={l.id}>
                        <Link href={`/courses/${course.id}/${l.id}`}>
                            <div className={`flex items-center gap-3 p-2 rounded-md transition-colors ${l.id === lesson.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'}`}>
                                {l.type === 'video' ? <Video className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                <span className="text-sm truncate">{l.title}</span>
                                {l.id === lesson.id && <CheckCircle className="h-4 w-4 ml-auto text-primary" />}
                            </div>
                        </Link>
                    </li>
                ))}
             </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
