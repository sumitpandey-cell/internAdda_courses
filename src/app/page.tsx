
'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CourseCard } from '@/components/courses/CourseCard';
import { Button } from '@/components/ui/button';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Course } from '@/lib/data-types';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function CoursesPage() {
  const { firestore } = useFirebase();
  const [activeCategory, setActiveCategory] = useState('All Domains');
  
  const coursesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'courses')) : null),
    [firestore]
  );
  const { data: courses, isLoading } = useCollection<Course>(coursesQuery);

  const categories = ['All Domains', 'Artificial Intelligence', 'Data Science', 'Web Development', 'Cybersecurity', 'Prompt Engineering', 'Cloud & DevOps'];

  const filteredCourses = activeCategory === 'All Domains' 
    ? courses 
    : courses?.filter(course => course.category === activeCategory);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <section className="text-center py-16 md:py-24 px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">Master In-Demand Skills</h1>
          <p className="max-w-2xl mx-auto mt-4 text-muted-foreground text-lg">
            Access our free, high-quality courses designed to prepare you for immediate placement in paid internships.
          </p>
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-foreground">Ready to Intern?</h2>
            <p className="text-muted-foreground mt-2">
              Complete any free course, pass the final exam, and unlock the path to a high-stipend internship.
            </p>
            <Button asChild size="lg" className="mt-4">
              <Link href="https://www.internadda.com/intern/internship" target="_blank" rel="noopener noreferrer">View Internship Programs</Link>
            </Button>
          </div>
        </section>

        <section className="py-8 px-4">
          <div className="container mx-auto">
            <div className="flex justify-center flex-wrap gap-2 mb-8">
              {categories.map((category) => (
                <Button 
                  key={category} 
                  variant={activeCategory === category ? 'default' : 'secondary'}
                  className="rounded-full"
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>

            {isLoading ? (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {filteredCourses?.map((course) => (
                  <CourseCard 
                    key={course.id} 
                    course={course}
                  />
                ))}
              </div>
            )}
             {filteredCourses?.length === 0 && !isLoading && (
                <div className="text-center py-12 text-muted-foreground">
                  No courses found in this category.
                </div>
              )}
          </div>
        </section>

        <section className="bg-accent text-accent-foreground py-16 md:py-24 px-4 mt-16">
            <div className="container mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold">Ready to Prove Your Skills and Earn?</h2>
                <p className="max-w-2xl mx-auto mt-4 text-lg">
                    Finish a course, take the Final Exam, and step directly into a paid internship.
                </p>
                <Button asChild size="lg" variant="secondary" className="mt-8 bg-white text-accent hover:bg-gray-200">
                    <Link href="#">Start Your Internship Test</Link>
                </Button>
            </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <Skeleton className="h-40 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  );
}
