import Link from 'next/link';
import Image from 'next/image';
import type { Course, UserProgress } from '@/lib/data-types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PlayCircle } from 'lucide-react';

type CourseProgressCardProps = {
  course: Course;
  progress: UserProgress;
};

export function CourseProgressCard({ course, progress }: CourseProgressCardProps) {
  // The first lesson needs to be fetched or known. For now, we link to the course.
  const lastLessonId = progress.lastLessonId || 'lesson1'; // Fallback needed

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="p-0 relative">
        <Link href={`/courses/${course.id}`}>
          <Image
            src={course.thumbnail}
            alt={course.title}
            width={600}
            height={400}
            className="aspect-video w-full object-cover"
            data-ai-hint="course thumbnail"
          />
        </Link>
        <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent">
          <Progress value={progress.percentage} className="h-2" />
          <p className="text-xs text-white mt-1">{Math.round(progress.percentage)}% complete</p>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4">
        <CardTitle className="text-lg font-headline mb-1">
          <Link href={`/courses/${course.id}`}>{course.title}</Link>
        </CardTitle>
        <CardDescription className="text-sm">
          by {course.instructor}
        </CardDescription>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full">
          <Link href={`/courses/${course.id}/lesson/${lastLessonId}`}>
            <PlayCircle className="mr-2 h-4 w-4" />
            Resume
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
