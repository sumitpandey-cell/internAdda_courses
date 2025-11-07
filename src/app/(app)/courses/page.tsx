'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CourseCard } from '@/components/courses/CourseCard';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, PlusCircle } from 'lucide-react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Course, UserProfile } from '@/lib/data-types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function CoursesPage() {
  const { firestore, user } = useFirebase();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');
  const [difficulty, setDifficulty] = useState('All');

  const coursesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'courses')) : null),
    [firestore]
  );
  const { data: courses, isLoading } = useCollection<Course>(coursesQuery);

  // You might want to fetch user profile to check role
  // For now, let's assume a simple check. A real app would use custom claims or a user profile doc.
  const isInstructor = true; // Replace with actual role check, e.g., userProfile?.role === 'Instructor'

  const categories = ['All', ...new Set(courses?.map((c) => c.category) || [])];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const filteredCourses = courses?.filter((course) => {
    return (
      (course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (category === 'All' || course.category === category) &&
      (difficulty === 'All' || course.difficulty === difficulty)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for courses..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 md:gap-4 flex-wrap">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full min-w-[150px] flex-1 md:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-full min-w-[150px] flex-1 md:w-[180px]">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              {difficulties.map((diff) => (
                <SelectItem key={diff} value={diff}>
                  {diff}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isInstructor && (
            <Button asChild className="w-full md:w-auto">
              <Link href="/courses/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Course
              </Link>
            </Button>
          )}
        </div>
      </div>
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCourses?.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
          {filteredCourses?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No courses found. Try adjusting your filters.
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-40 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
