import Image from 'next/image';
import Link from 'next/link';
import type { Course } from '@/lib/data-types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

type CourseCardProps = {
  course: Course;
};

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="p-0">
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
      </CardHeader>
      <CardContent className="flex-1 p-4">
        <Badge variant="outline" className="mb-2">{course.difficulty}</Badge>
        <CardTitle className="text-lg font-headline mb-1">
          <Link href={`/courses/${course.id}`}>{course.title}</Link>
        </CardTitle>
        <CardDescription className="text-sm line-clamp-2">{course.description}</CardDescription>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={`/courses/${course.id}`}>
            View Course
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
