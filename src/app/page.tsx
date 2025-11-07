'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CourseCard } from '@/components/courses/CourseCard';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import type { Course } from '@/lib/data-types';
import { Skeleton } from '@/components/ui/skeleton';

const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-1');

const testimonials = [
  {
    name: 'Sarah L.',
    role: 'Software Engineer',
    testimonial: 'CourseFlow has been a game-changer for my career. The AI recommendations are spot on, and I\'ve learned so much!',
    avatar: 'https://picsum.photos/seed/avatar1/100/100',
  },
  {
    name: 'Mike P.',
    role: 'Product Manager',
    testimonial: 'The progress tracking and clean UI make learning enjoyable. I can easily pick up where I left off, even on my phone.',
    avatar: 'https://picsum.photos/seed/avatar2/100/100',
  },
    {
    name: 'Jennifer H.',
    role: 'UX Designer',
    testimonial: 'I love the design and interactivity. It’s a beautiful platform that makes you want to learn.',
    avatar: 'https://picsum.photos/seed/avatar3/100/100',
  },
];

export default function Home() {
  const { firestore } = useFirebase();
  const coursesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'courses'), limit(4)) : null),
    [firestore]
  );
  const { data: courses, isLoading } = useCollection<Course>(coursesQuery);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <section className="w-full py-20 md:py-32 lg:py-40">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                    Unlock Your Potential with CourseFlow
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Our AI-powered platform provides a personalized learning journey. Explore courses, track your progress, and achieve your goals.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" asChild>
                    <Link href="/dashboard">
                      Start Learning
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              {heroImage && (
                <Image
                  src={heroImage.imageUrl}
                  alt={heroImage.description}
                  data-ai-hint={heroImage.imageHint}
                  width={600}
                  height={400}
                  className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last shadow-2xl"
                />
              )}
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-card">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">A Better Way to Learn</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  CourseFlow is packed with features designed to enhance your learning experience and help you succeed.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-12 py-12 sm:grid-cols-2 md:grid-cols-3">
              <div className="grid gap-1">
                <h3 className="text-lg font-bold">Personalized Recommendations</h3>
                <p className="text-sm text-muted-foreground">Our AI suggests courses tailored to your interests and career goals.</p>
              </div>
              <div className="grid gap-1">
                <h3 className="text-lg font-bold">Interactive Learning</h3>
                <p className="text-sm text-muted-foreground">Engage with video lessons, text materials, and quizzes.</p>
              </div>
              <div className="grid gap-1">
                <h3 className="text-lg font-bold">Progress Tracking</h3>
                <p className="text-sm text-muted-foreground">Visually track your completion and stay motivated.</p>
              </div>
              <div className="grid gap-1">
                <h3 className="text-lg font-bold">In-Lesson Notes</h3>
                <p className="text-sm text-muted-foreground">Take and save notes directly within your lessons.</p>
              </div>
              <div className="grid gap-1">
                <h3 className="text-lg font-bold">Gamified Experience</h3>
                <p className="text-sm text-muted-foreground">Earn points and badges as you complete courses.</p>
              </div>
              <div className="grid gap-1">
                <h3 className="text-lg font-bold">Admin & Instructor Tools</h3>
                <p className="text-sm text-muted-foreground">Powerful dashboards to manage content and students.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="courses" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-start space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">
                Featured Courses
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Dive into our curated collection of courses designed to help you master new skills and advance your career.
              </p>
            </div>
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-8">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-8">
                {courses?.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
            <div className="mt-12 text-center">
              <Button size="lg" variant="outline" asChild>
                <Link href="/courses">
                  View All Courses
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32 bg-card">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter text-center sm:text-4xl md:text-5xl font-headline">
              Loved by Learners Worldwide
            </h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl text-center mt-4">
              Hear what our students have to say about their journey with CourseFlow.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="flex flex-col items-center text-center">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    width={80}
                    height={80}
                    className="rounded-full"
                  />
                  <p className="mt-4 text-lg italic">"{testimonial.testimonial}"</p>
                  <div className="mt-4">
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
