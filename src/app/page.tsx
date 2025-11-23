'use client';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LogoSlider } from '@/components/home/LogoSlider';
import { PopularCoursesCarousel } from '@/components/home/PopularCoursesCarousel';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { Button } from '@/components/ui/button';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Course } from '@/lib/data-types';
import Link from 'next/link';
import { ArrowRight, Sparkles, GraduationCap, Briefcase } from 'lucide-react';
import Image from 'next/image';

export default function HomePage() {
  const { firestore } = useFirebase();

  const coursesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'courses')) : null),
    [firestore]
  );
  const { data: courses, isLoading } = useCollection<Course>(coursesQuery);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20 md:py-32 px-4">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />

          {/* Floating Elements */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />

          <div className="container mx-auto relative z-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full mb-6 text-sm font-semibold">
                  <Sparkles className="w-4 h-4" />
                  <span>Premium Courses • Paid Internships</span>
                </div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
                  Master Skills,
                  <br />
                  <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    Launch Career
                  </span>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-xl">
                  Access world-class courses, earn certifications, and unlock paid internship opportunities with leading companies. Your journey to success starts here.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                  <Button asChild size="lg" className="group text-base">
                    <Link href="/courses">
                      Explore Courses
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="text-base">
                    <Link href="https://www.internadda.com/intern/internship" target="_blank">
                      <Briefcase className="mr-2 h-5 w-5" />
                      View Internships
                    </Link>
                  </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-border/50">
                  <div>
                    <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">10K+</div>
                    <div className="text-sm text-muted-foreground">Students</div>
                  </div>
                  <div>
                    <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">50+</div>
                    <div className="text-sm text-muted-foreground">Courses</div>
                  </div>
                  <div>
                    <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">85%</div>
                    <div className="text-sm text-muted-foreground">Placement</div>
                  </div>
                </div>
              </div>

              {/* Right Image */}
              <div className="relative hidden md:block">
                <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl border-4 border-primary/20">
                  <Image
                    src="/images/learning-success.png"
                    alt="Students celebrating success"
                    fill
                    className="object-cover"
                    priority
                  />
                  {/* Overlay Badge */}
                  <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <GraduationCap className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <div className="font-bold text-foreground">500+ Certificates Issued</div>
                        <div className="text-sm text-muted-foreground">This month</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Logo Slider */}
        <LogoSlider />

        {/* Popular Courses Carousel */}
        <PopularCoursesCarousel courses={courses || []} isLoading={isLoading} />

        {/* Features Section */}
        <FeaturesSection />

        {/* Testimonials Section */}
        <TestimonialsSection />

        {/* Final CTA Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-accent text-primary-foreground py-20 md:py-32 px-4">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

          <div className="container mx-auto text-center relative z-10">
            <div className="max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full mb-6 text-sm font-semibold">
                <Sparkles className="w-4 h-4" />
                <span>Start Your Journey Today</span>
              </div>

              <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6">
                Ready to Transform Your Career?
              </h2>

              <p className="text-lg md:text-xl mb-10 text-primary-foreground/90 leading-relaxed">
                Join thousands of students who have already kickstarted their careers with Internadda.
                Complete courses, earn certificates, and land your dream internship.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="bg-white text-primary hover:bg-white/90 shadow-xl text-base group"
                >
                  <Link href="/courses">
                    Browse All Courses
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 text-base"
                >
                  <Link href="https://www.internadda.com/about" target="_blank">
                    Learn More About Us
                  </Link>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="mt-12 pt-8 border-t border-white/20">
                <p className="text-sm text-primary-foreground/80 mb-4">Trusted by students joining</p>
                <div className="flex flex-wrap justify-center gap-6 text-sm font-semibold text-white/90">
                  <span>Google</span>
                  <span>•</span>
                  <span>Microsoft</span>
                  <span>•</span>
                  <span>Amazon</span>
                  <span>•</span>
                  <span>Meta</span>
                  <span>•</span>
                  <span>Apple</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
