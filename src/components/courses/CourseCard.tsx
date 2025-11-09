import Image from 'next/image';
import Link from 'next/link';
import type { Course } from '@/lib/data-types';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, BookOpen } from 'lucide-react';

type CourseCardProps = {
  course: Course & { rating: number; lessonsCount: number, duration: number, domain: string, heroImage: string };
};

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 border-2 border-transparent hover:border-primary">
      <CardHeader className="p-0 relative">
        <Link href={`/courses/${course.id}`}>
            <div className="relative aspect-[16/9] w-full bg-slate-800 rounded-t-lg overflow-hidden">
                <Image
                    src={course.heroImage}
                    alt={course.title}
                    fill
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-4 flex flex-col justify-end">
                    <h3 className="text-white text-lg font-bold">{course.title}</h3>
                </div>
            </div>
        </Link>
      </CardHeader>
      <CardContent className="flex-1 p-4 flex flex-col">
        <p className="text-sm font-semibold mb-2">{course.title}</p>
        <p className="text-xs text-muted-foreground mb-4">{course.domain}</p>
        <div className="flex items-center gap-1 text-yellow-500 mb-4">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-bold text-foreground">{course.rating}</span>
        </div>
        <div className="flex-grow"></div>
        <div className="flex justify-between items-center text-sm text-muted-foreground border-t pt-4 mt-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{course.duration} mins</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>{course.lessonsCount} Lessons</span>
          </div>
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">FREE</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
