import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { courses, mainUser } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlayCircle, CheckCircle, Lock } from "lucide-react";

type CoursePageProps = {
  params: {
    courseId: string;
  };
};

export default function CoursePage({ params }: CoursePageProps) {
  const course = courses.find((c) => c.id === params.courseId);

  if (!course) {
    notFound();
  }

  const isEnrolled = mainUser.enrolledCourses.includes(course.id);
  const progress = mainUser.progress.find(p => p.courseId === course.id);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Badge variant="secondary">{course.category}</Badge>
          <h1 className="text-4xl font-bold font-headline">{course.title}</h1>
          <p className="text-lg text-muted-foreground">{course.description}</p>
          <div className="flex items-center gap-4">
             <p className="text-sm">by {course.instructor}</p>
             <Badge variant="outline">{course.difficulty}</Badge>
          </div>
          <div className="flex gap-2">
            {course.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
          </div>
           {isEnrolled ? (
            <Button size="lg" asChild>
                <Link href={`/courses/${course.id}/${progress?.lastLessonId || course.lessons[0].id}`}>
                    <PlayCircle className="mr-2 h-5 w-5" />
                    {progress?.percentage === 0 ? 'Start Course' : 'Continue Learning'}
                </Link>
            </Button>
           ) : (
            <Button size="lg"><Lock className="mr-2 h-5 w-5" />Enroll Now</Button>
           )}
        </div>
        <div className="md:col-span-1">
          <Image
            src={course.thumbnail}
            alt={course.title}
            width={600}
            height={400}
            className="rounded-lg shadow-lg aspect-video w-full object-cover"
          />
        </div>
      </div>
      
      <div className="mt-12">
        <h2 className="text-2xl font-bold font-headline mb-4">Course Content</h2>
        <Card>
            <CardContent className="p-4 space-y-2">
                {course.lessons.map((lesson, index) => {
                    const isCompleted = progress?.completedLessons.includes(lesson.id);
                    return (
                        <Link key={lesson.id} href={isEnrolled ? `/courses/${course.id}/${lesson.id}`: '#'}>
                            <div className={`flex items-center justify-between p-3 rounded-md transition-colors ${isEnrolled ? 'hover:bg-muted/50 cursor-pointer' : 'opacity-70'}`}>
                                <div className="flex items-center gap-4">
                                    <div className="text-muted-foreground font-mono text-lg">{String(index + 1).padStart(2, '0')}</div>
                                    <p className="font-medium">{lesson.title}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-muted-foreground">{lesson.duration} min</span>
                                    {isEnrolled ? (
                                        isCompleted ? <CheckCircle className="h-5 w-5 text-green-500" /> : <PlayCircle className="h-5 w-5 text-muted-foreground" />
                                    ) : (
                                        <Lock className="h-5 w-5 text-muted-foreground" />
                                    )}
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
