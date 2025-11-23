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
import { Star, Clock, BookOpen, Award, TrendingUp, User } from 'lucide-react';

type CourseCardProps = {
  course: Course;
};

export function CourseCard({ course }: CourseCardProps) {
  const difficultyColors = {
    'Beginner': 'bg-green-100 text-green-800 border-green-200',
    'Intermediate': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Advanced': 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <Link href={`/courses/${course.id}`} className="group block h-full">
      <Card className="flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border-2 border-border hover:border-primary/50 bg-card group-hover:bg-accent/5">
        <CardHeader className="p-0 relative overflow-hidden">
          <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
            <Image
              src={course.thumbnail}
              alt={course.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-90 group-hover:opacity-95 transition-opacity duration-300" />

            {/* Difficulty Badge */}
            <div className="absolute top-3 right-3">
              <Badge
                variant="secondary"
                className={`${difficultyColors[course.difficulty]} backdrop-blur-sm border font-semibold shadow-lg`}
              >
                {course.difficulty}
              </Badge>
            </div>

            {/* Price Badge */}
            <div className="absolute top-3 left-3">
              <Badge className={`${course.isFree ? 'bg-green-500/90 hover:bg-green-600 border-green-400' : 'bg-blue-600/90 hover:bg-blue-700 border-blue-500'} text-white backdrop-blur-sm shadow-lg font-semibold`}>
                {course.isFree ? 'FREE' : `₹${course.price}`}
              </Badge>
            </div>

            {/* Title Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white text-lg font-bold line-clamp-2 drop-shadow-lg group-hover:text-primary-foreground transition-colors">
                {course.title}
              </h3>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-5 flex flex-col gap-3">
          {/* Category */}
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-muted-foreground">{course.category}</p>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {course.description}
          </p>

          {/* Tags */}
          {course.tags && course.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {course.tags.slice(0, 3).map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs px-2 py-0.5 bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
                >
                  {tag}
                </Badge>
              ))}
              {course.tags.length > 3 && (
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-0.5 bg-muted"
                >
                  +{course.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="flex-grow"></div>

          {/* Instructor Info */}
          <div className="flex items-center gap-2 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground truncate">
                {course.instructor}
              </span>
            </div>
            <Award className="h-4 w-4 text-primary flex-shrink-0" />
          </div>
        </CardContent>

        {/* Hover Effect Indicator */}
        <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      </Card>
    </Link>
  );
}
