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
import { PlayCircle, BookOpen, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Helper to determine if URL is safe for next/image optimization
// Allow all hostnames since next.config.js has wildcard patterns configured
const isOptimizedImageDomain = (url: string): boolean => {
  try {
    new URL(url);
    return true; // Allow all valid URLs
  } catch {
    return false;
  }
};

type CourseProgressCardProps = {
  course: Course;
  progress: UserProgress;
};

export function CourseProgressCard({ course, progress }: CourseProgressCardProps) {
  const lastLessonId = progress.lastLessonId || 'lesson1';
  const completionPercentage = Math.round(progress.percentage);
  const isCompleted = completionPercentage === 100;

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 bg-gradient-to-br from-background to-muted/30">
      <CardHeader className="p-0 relative overflow-hidden group">
        <Link href={`/courses/${course.id}`}>
          <div className="relative overflow-hidden">
            {isOptimizedImageDomain(course.thumbnail) ? (
              <Image
                src={course.thumbnail}
                alt={course.title}
                width={600}
                height={400}
                className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
                data-ai-hint="course thumbnail"
              />
            ) : (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            )}
            {isCompleted && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-400" />
              </div>
            )}
          </div>
        </Link>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/80">{completionPercentage}% Complete</span>
              {isCompleted && (
                <Badge className="bg-green-500 text-white border-0">Completed</Badge>
              )}
            </div>
            <Progress value={completionPercentage} className="h-2 bg-white/20" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-4">
        <div className="space-y-2">
          <CardTitle className="text-lg font-headline line-clamp-2">
            <Link href={`/courses/${course.id}`} className="hover:text-primary transition-colors">
              {course.title}
            </Link>
          </CardTitle>
          <CardDescription className="text-sm flex items-center gap-1">
            <span className="truncate">by {course.instructor}</span>
          </CardDescription>
          
          <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            <span>{progress.completedLessons?.length || 0} of {progress.totalLessons} lessons</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 gap-2">
        <Button asChild variant="default" className="w-full flex-1" size="sm">
          <Link href={`/courses/${course.id}/lesson/${lastLessonId}`}>
            <PlayCircle className="mr-2 h-3.5 w-3.5" />
            {isCompleted ? 'Review' : 'Continue'}
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/courses/${course.id}`}>
            View
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
