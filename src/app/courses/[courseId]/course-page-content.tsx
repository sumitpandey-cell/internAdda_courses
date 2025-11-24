'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useFirebase, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  PlayCircle,
  CheckCircle,
  Lock,
  ArrowLeft,
  BookOpen,
  Target,
  UserCircle,
  Star,
  Clock,
  Award,
  ChevronDown,
  Video,
  FileText,
  Users,
  Share2,
  Heart,
  Download,
  Globe,
  TrendingUp,
  MessageCircle,
  ChevronRight,
  Sparkles,
  Trophy,
  Zap,
  BarChart3,
  CreditCard,
  Loader2,
  AlertCircle
} from 'lucide-react';
import type { Course, Lesson, UserProgress, Purchase, InstructorProfile } from '@/lib/data-types';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/layout/Header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InstructorCard } from '@/components/courses/InstructorCard';
import { ReviewForm } from '@/components/courses/ReviewForm';
import { ReviewsDisplay } from '@/components/courses/ReviewsDisplay';
import { FeedbackModal } from '@/components/courses/FeedbackModal';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useState, useEffect } from 'react';
import { useSavedCourses } from '@/hooks/use-saved-courses';
import { useShare } from '@/hooks/use-share';
import { useEnrollment } from '@/hooks/use-enrollment';
import { useCourseFeedback } from '@/hooks/use-course-feedback';

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

export default function CoursePage({ onStartStudying }: { onStartStudying?: (lessonId: string) => void } = {}) {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const { courseId } = params;
  const [isSticky, setIsSticky] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isCourseSaved, setIsCourseSaved] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const { toast } = useToast();
  const { toggleSave, isSaved } = useSavedCourses();
  const { share } = useShare();
  const { enrollCourse, isEnrolled, getEnrollmentCount, getActiveEnrollmentCount } = useEnrollment();
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const { getCourseRatingStats } = useCourseFeedback();
  const [dynamicAverageRating, setDynamicAverageRating] = useState(4.7);
  const [dynamicTotalRatings, setDynamicTotalRatings] = useState(12847);
  const [ratingDistribution, setRatingDistribution] = useState([
    { stars: 5, percentage: 75 },
    { stars: 4, percentage: 18 },
    { stars: 3, percentage: 5 },
    { stars: 2, percentage: 1 },
    { stars: 1, percentage: 1 },
  ]);

  const { firestore, user } = useFirebase();

  const courseRef = useMemoFirebase(
    () => (firestore && courseId ? doc(firestore, 'courses', courseId) : null),
    [firestore, courseId]
  );
  const lessonsQuery = useMemoFirebase(
    () => (firestore && courseId ? query(collection(firestore, 'courses', courseId, 'lessons'), orderBy('order')) : null),
    [firestore, courseId]
  );
  const progressRef = useMemoFirebase(
    () => (firestore && user && courseId ? doc(firestore, 'users', user.uid, 'progress', courseId) : null),
    [firestore, user, courseId]
  );

  // Check if user has purchased the course
  const purchaseQuery = useMemoFirebase(
    () => (firestore && user && courseId ? query(collection(firestore, 'purchases'), where('userId', '==', user.uid), where('courseId', '==', courseId)) : null),
    [firestore, user, courseId]
  );

  const { data: course, isLoading: courseLoading } = useDoc<Course>(courseRef);
  const { data: lessons, isLoading: lessonsLoading } = useCollection<Lesson>(lessonsQuery);
  const { data: progress } = useDoc<UserProgress>(progressRef);
  const { data: purchases, isLoading: purchasesLoading } = useCollection<Purchase>(purchaseQuery);

  // Fetch instructor profile (only after course is loaded)
  const instructorProfileRef = useMemoFirebase(
    () => (firestore && course?.instructorId ? doc(firestore, 'instructorProfiles', course.instructorId) : null),
    [firestore, course?.instructorId]
  );
  const { data: instructorProfile, isLoading: instructorProfileLoading } = useDoc<InstructorProfile>(instructorProfileRef);

  const isPurchased = purchases && purchases.length > 0;
  const hasAccess = course?.isFree || isPurchased;

  const firstLessonId = lessons?.[0]?.id;
  const startDestination = `/courses/${courseId}/lesson/${progress?.lastLessonId || firstLessonId}`;

  // If user has access, link to lesson. If not, link to login (if not logged in) or stay on page (to buy)
  const startLink = user
    ? (hasAccess ? startDestination : '#')
    : `/login?redirect=${startDestination}`;

  const handlePurchase = async () => {
    if (!user || !course || !firestore) return;

    setIsPurchasing(true);
    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      await addDoc(collection(firestore, 'purchases'), {
        userId: user.uid,
        courseId: course.id,
        amount: course.price,
        purchaseDate: serverTimestamp(),
        status: 'completed'
      });

      // Create enrollment after purchase
      await enrollCourse(course.id);

      toast({
        title: "Purchase Successful!",
        description: "You now have full access to this course.",
      });
      setShowPurchaseModal(false);
    } catch (error) {
      console.error("Purchase failed:", error);
      toast({
        variant: "destructive",
        title: "Purchase Failed",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  // Sticky scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if course is saved
  useEffect(() => {
    const checkSaved = async () => {
      if (courseId) {
        const saved = await isSaved(courseId);
        setIsCourseSaved(saved);
      }
    };
    checkSaved();
  }, [courseId, isSaved]);

  // Load enrollment count
  useEffect(() => {
    const loadEnrollmentCount = async () => {
      if (courseId) {
        const count = await getActiveEnrollmentCount(courseId);
        setEnrollmentCount(count);
      }
    };
    loadEnrollmentCount();
  }, [courseId, getActiveEnrollmentCount]);

  // Load rating stats
  useEffect(() => {
    const loadRatingStats = async () => {
      if (courseId) {
        const stats = await getCourseRatingStats(courseId);
        if (stats.totalReviews > 0) {
          setDynamicAverageRating(stats.averageRating);
          setDynamicTotalRatings(stats.totalReviews);
          
          // Calculate distribution percentages
          const distribution = [5, 4, 3, 2, 1].map(star => ({
            stars: star,
            percentage: Math.round((stats.ratingDistribution[star] / stats.totalReviews) * 100)
          }));
          setRatingDistribution(distribution);
        }
      }
    };
    loadRatingStats();
  }, [courseId, getCourseRatingStats]);

  // Group lessons by their actual section field
  const groupedLessons = lessons?.reduce((acc, lesson, index) => {
    const sectionName = lesson.section || 'Other Lessons';

    if (!acc[sectionName]) {
      acc[sectionName] = [];
    }
    acc[sectionName].push(lesson);
    return acc;
  }, {} as Record<string, Lesson[]>);

  const completedCount = progress?.completedLessons?.length || 0;
  const totalLessons = lessons?.length || 0;
  const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const totalDuration = lessons?.reduce((sum, lesson) => sum + (lesson.duration || 0), 0) || 0;
  const totalHours = Math.floor(totalDuration / 60);
  const totalMinutes = totalDuration % 60;

  // Mock data for ratings
  const averageRating = dynamicAverageRating;
  const totalRatings = dynamicTotalRatings;

  // Mock FAQs
  const faqs = [
    {
      question: "How long do I have access to the course?",
      answer: "You have lifetime access to this course, including all future updates and additional content."
    },
    {
      question: "What if I'm not satisfied with the course?",
      answer: "We offer a 30-day money-back guarantee. If you're not satisfied, you can request a full refund within 30 days of purchase."
    },
    {
      question: "Do I need any prior experience?",
      answer: "No prior experience is required. This course is designed for beginners and intermediate learners alike."
    },
    {
      question: "Will I receive a certificate upon completion?",
      answer: "Yes! You'll receive a certificate of completion that you can share on LinkedIn and add to your resume."
    },
    {
      question: "Can I download the course materials?",
      answer: "Yes, all video lectures and supplementary materials are available for download so you can learn offline."
    }
  ];

  // Mark as initialized on first mount
  useEffect(() => {
    setHasInitialized(true);
  }, []);

  // Full page loading screen if main data is loading (first load, no course data yet)
  if (!hasInitialized || (courseLoading && !course && lessonsLoading)) {
    return <FullPageSkeletonLoader />;
  }

  // If course data failed to load after initial load attempt
  if (!courseLoading && !course) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center container mx-auto px-4">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h1>
            <p className="text-gray-600 mb-6">The course you're looking for doesn't exist or has been removed.</p>
            <Button asChild>
              <Link href="/">Back to Courses</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      {/* Mobile Sticky CTA */}
      {isSticky && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50 shadow-2xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-2xl font-bold text-gray-900">{course?.isFree ? 'Free' : `₹${course?.price}`}</p>
              <p className="text-xs text-gray-600">Full lifetime access</p>
            </div>
            {user && !hasAccess ? (
              <Button size="lg" className="flex-1" onClick={() => setShowPurchaseModal(true)}>
                Buy Now
              </Button>
            ) : onStartStudying && firstLessonId ? (
              <Button
                size="lg"
                className="flex-1"
                disabled={lessonsLoading || !firstLessonId}
                onClick={async () => {
                  if (user && course && (course.isFree || isPurchased)) {
                    await enrollCourse(course.id);
                    onStartStudying(firstLessonId);
                  }
                }}
              >
                {user ? 'Start Learning' : (course?.isFree ? 'Enroll Free' : 'Buy Now')}
              </Button>
            ) : (
              <Button
                size="lg"
                asChild
                className="flex-1"
                onClick={async () => {
                  if (user && course && (course.isFree || isPurchased)) {
                    await enrollCourse(course.id);
                  }
                }}
              >
                <Link href={startLink}>
                  {user ? 'Start Learning' : (course?.isFree ? 'Enroll Free' : 'Buy Now')}
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}

      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-grid-pattern"></div>
          </div>

          <div className="container mx-auto max-w-7xl px-4 py-8 pb-12 relative z-10">
            <Button variant="ghost" asChild className="text-white hover:bg-white/10 mb-6">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Courses
              </Link>
            </Button>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Course Info - Left Side */}
              <div className="space-y-6">
                {courseLoading ? (
                  <>
                    <Skeleton className="h-8 w-32 bg-white/20" />
                    <Skeleton className="h-12 w-3/4 bg-white/20" />
                    <Skeleton className="h-6 w-1/2 bg-white/20" />
                  </>
                ) : (
                  <>
                    {/* Category & Badges */}
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className="bg-primary text-white border-0 text-sm px-4 py-1.5 font-semibold">
                        {course?.category}
                      </Badge>
                      <Badge variant="outline" className="border-white/30 text-white bg-white/10 backdrop-blur-sm">
                        <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                        {course?.difficulty}
                      </Badge>
                      <Badge variant="outline" className="border-white/30 text-white bg-white/10 backdrop-blur-sm">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Bestseller
                      </Badge>
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                      {course?.title}
                    </h1>

                    {/* Subtitle */}
                    <p className="text-xl text-gray-300 leading-relaxed">
                      {course?.description}
                    </p>

                    {/* Rating & Students */}
                    <div className="flex flex-wrap items-center gap-6 pt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-2xl font-bold text-yellow-400">{averageRating}</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < Math.floor(averageRating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-400'
                                  }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-gray-300">({totalRatings.toLocaleString()} ratings)</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300">
                        <Users className="w-5 h-5" />
                        <span className="font-semibold">{enrollmentCount.toLocaleString()} students enrolled</span>
                      </div>
                    </div>

                    {/* Instructor & Last Updated */}
                    <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-white/10">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-white/20">
                          <AvatarImage src={instructorProfile?.avatar || `https://i.pravatar.cc/200?u=${course?.instructorId}`} />
                          <AvatarFallback>{course?.instructor?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm text-gray-400">Created by</p>
                          <p className="font-semibold text-lg">{course?.instructor}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-gray-300">
                        <Globe className="w-4 h-4" />
                        <span className="text-sm">English</span>
                      </div>

                      {user && progress && (
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                            <Trophy className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Your Progress</p>
                            <p className="font-semibold text-lg">{progressPercentage}% Complete</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Hero Image - Responsive for all screen sizes */}
              <div className="relative lg:order-2">
                {courseLoading ? (
                  <Skeleton className="aspect-video w-full rounded-2xl bg-white/20" />
                ) : (
                  <div className="relative group">
                    {/* Decorative Background Glow - Hidden on mobile for performance */}
                    <div className="hidden md:block absolute -inset-4 bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>

                    {/* Main Image Container */}
                    <div className="relative aspect-video rounded-xl md:rounded-2xl overflow-hidden border-2 md:border-4 border-white/10 shadow-xl md:shadow-2xl">
                      {isOptimizedImageDomain(course?.thumbnail || '') ? (
                        <Image
                          src={course?.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop'}
                          alt={course?.title || 'Course preview'}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          priority
                        />
                      ) : (
                        <img
                          src={course?.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop'}
                          alt={course?.title || 'Course preview'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      )}

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                      {/* Play Button Overlay - Always visible on mobile, hover on desktop */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-16 h-16 md:w-24 md:h-24 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
                          <PlayCircle className="w-10 h-10 md:w-16 md:h-16 text-primary" />
                        </div>
                      </div>

                      {/* Floating Badges */}
                      <div className="absolute top-3 left-3 md:top-4 md:left-4 flex flex-col gap-2">
                        <Badge className={`${course?.isFree ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'} text-white font-bold px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm shadow-lg border-0 backdrop-blur-sm`}>
                          <Sparkles className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                          {course?.isFree ? '100% FREE' : `₹${course?.price}`}
                        </Badge>
                        {user && progress && progressPercentage > 0 && (
                          <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm shadow-lg border-0 backdrop-blur-sm">
                            <Trophy className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                            {progressPercentage}% Done
                          </Badge>
                        )}
                      </div>

                      {/* Bottom Info Bar - Responsive sizing */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex items-center justify-between text-white">
                          <div className="flex items-center gap-2 md:gap-4">
                            <div className="flex items-center gap-1 md:gap-2">
                              <Video className="w-4 h-4 md:w-5 md:h-5" />
                              <span className="text-xs md:text-base font-semibold">{totalHours}h {totalMinutes}m</span>
                            </div>
                            <div className="flex items-center gap-1 md:gap-2">
                              <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
                              <span className="text-xs md:text-base font-semibold">{totalLessons} lessons</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 md:w-5 md:h-5 fill-yellow-400 text-yellow-400" />
                            <span className="font-bold text-sm md:text-lg">{averageRating}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Decorative Corner Elements - Hidden on mobile */}
                    <div className="hidden lg:block absolute -top-3 -right-3 w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full blur-xl opacity-40"></div>
                    <div className="hidden lg:block absolute -bottom-3 -left-3 w-32 h-32 bg-gradient-to-tr from-accent to-primary rounded-full blur-xl opacity-40"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Container */}
        <div className="container mx-auto max-w-7xl px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-8 relative">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* What You'll Learn */}
              <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">What You'll Learn</h2>
                </div>
                {courseLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {course?.whatYouWillLearn?.map((topic, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 rounded-xl hover:bg-gray-50 transition-colors group">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-green-200 transition-colors">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="text-gray-700 leading-relaxed font-medium">{topic}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Course Description */}
              <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">Course Description</h2>
                </div>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {course?.description}
                  </p>
                  {course?.prerequisites && (
                    <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-600" />
                        Prerequisites
                      </h3>
                      <p className="text-gray-700 leading-relaxed">{course.prerequisites}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Course Curriculum */}
              <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">Course Curriculum</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {totalLessons} lessons • {totalHours}h {totalMinutes}m total length
                        {user && ` • ${completedCount} completed`}
                      </p>
                    </div>
                  </div>
                </div>

                {lessonsLoading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : (
                  <Accordion type="multiple" className="space-y-4">
                    {Object.entries(groupedLessons || {}).map(([sectionName, sectionLessons], sectionIndex) => {
                      const sectionCompleted = sectionLessons.filter(l =>
                        progress?.completedLessons?.includes(l.id)
                      ).length;
                      const sectionDuration = sectionLessons.reduce((sum, l) => sum + (l.duration || 0), 0);

                      return (
                        <AccordionItem
                          key={sectionName}
                          value={sectionName}
                          className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-primary/30 transition-colors"
                        >
                          <AccordionTrigger className="px-6 py-5 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent hover:no-underline group">
                            <div className="flex items-center justify-between w-full pr-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                  <span className="text-white font-bold text-lg">{sectionLessons.length}</span>
                                </div>
                                <div className="text-left">
                                  <h3 className="font-bold text-gray-900 text-lg">{sectionName}</h3>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {sectionLessons.length} lessons • {Math.floor(sectionDuration / 60)}h {sectionDuration % 60}m
                                    {user && ` • ${sectionCompleted}/${sectionLessons.length} completed`}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pb-4 bg-gray-50/50">
                            <div className="space-y-2 pt-3">
                              {sectionLessons.map((lesson, lessonIndex) => {
                                const isCompleted = user && progress?.completedLessons?.includes(lesson.id);
                                const lessonDestination = `/courses/${courseId}/lesson/${lesson.id}`;
                                const lessonLink = user ? lessonDestination : `/login?redirect=${lessonDestination}`;

                                return (
                                  <Link key={lesson.id} href={lessonLink}>
                                    <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-white transition-all group cursor-pointer border-2 border-transparent hover:border-primary/20 hover:shadow-md">
                                      <div className="flex items-center gap-4 flex-1">
                                        <div className="w-10 h-10 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center text-sm font-bold text-gray-600 group-hover:border-primary group-hover:text-primary group-hover:bg-primary/5 transition-all">
                                          {lessonIndex + 1}
                                        </div>

                                        <div className="flex-1">
                                          <p className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                                            {lesson.title}
                                          </p>
                                          <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500">
                                            {lesson.type === 'video' ? (
                                              <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-medium">
                                                <Video className="w-3 h-3" />
                                                Video
                                              </span>
                                            ) : (
                                              <span className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2 py-1 rounded-md font-medium">
                                                <FileText className="w-3 h-3" />
                                                Reading
                                              </span>
                                            )}
                                            {lesson.duration && (
                                              <span className="flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" />
                                                {lesson.duration} min
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        {user ? (
                                          isCompleted ? (
                                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                              <CheckCircle className="h-6 w-6 text-green-600" />
                                            </div>
                                          ) : (
                                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                              <PlayCircle className="h-6 w-6 text-gray-400 group-hover:text-primary transition-colors" />
                                            </div>
                                          )
                                        ) : (
                                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </section>

              {/* Instructor Profile */}
              <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                    <UserCircle className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">Your Instructor</h2>
                </div>
                {courseLoading || instructorProfileLoading ? (
                  <Skeleton className="h-64 w-full rounded-lg" />
                ) : instructorProfile ? (
                  <InstructorCard
                    instructor={instructorProfile}
                    instructorEmail={user?.email || undefined}
                    courseCount={12}
                    studentCount={45000}
                  />
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-start gap-6">
                      <Avatar className="h-24 w-24 border-4 border-gray-100 shadow-lg">
                        <AvatarImage src={`https://i.pravatar.cc/200?u=${course?.instructorId}`} />
                        <AvatarFallback className="text-3xl">{course?.instructor?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{course?.instructor}</h3>
                        <p className="text-primary font-semibold text-lg mb-3">Expert in {course?.category}</p>
                        <p className="text-gray-600 leading-relaxed text-lg">
                          {course?.instructorBio || `${course?.instructor} is a seasoned professional with years of experience in ${course?.category}. They have taught thousands of students and are passionate about sharing their knowledge.`}
                        </p>
                      </div>
                    </div>

                    {/* Instructor Stats */}
                    <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                          <p className="text-2xl font-bold text-gray-900">4.8</p>
                        </div>
                        <p className="text-sm text-gray-600">Instructor Rating</p>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Users className="w-5 h-5 text-green-600" />
                          <p className="text-2xl font-bold text-gray-900">45K+</p>
                        </div>
                        <p className="text-sm text-gray-600">Students</p>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <PlayCircle className="w-5 h-5 text-purple-600" />
                          <p className="text-2xl font-bold text-gray-900">12</p>
                        </div>
                        <p className="text-sm text-gray-600">Courses</p>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Course Enrollment Stats */}
              <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">Course Analytics</h2>
                </div>

                {/* Enrollment Stats Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-600">Total Enrollments</p>
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-4xl font-bold text-gray-900 mb-1">{enrollmentCount.toLocaleString()}</p>
                    <p className="text-xs text-gray-600">Active students in this course</p>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-600">Course Completion Rate</p>
                      <CheckCircle className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-4xl font-bold text-gray-900 mb-1">
                      {enrollmentCount > 0 ? Math.round(Math.random() * 100) : 0}%
                    </p>
                    <p className="text-xs text-gray-600">Students who finished all lessons</p>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-600">Satisfaction Rate</p>
                      <Star className="w-5 h-5 text-green-600 fill-green-600" />
                    </div>
                    <p className="text-4xl font-bold text-gray-900 mb-1">{averageRating}/5.0</p>
                    <p className="text-xs text-gray-600">Average rating from {totalRatings.toLocaleString()} reviews</p>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-600">Time to Complete</p>
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <p className="text-4xl font-bold text-gray-900 mb-1">{totalHours}h {totalMinutes}m</p>
                    <p className="text-xs text-gray-600">Total video and content duration</p>
                  </div>
                </div>

                {/* Enrollment Benefits */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Why Join {enrollmentCount.toLocaleString()}+ Students?
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 font-bold text-sm">✓</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Proven Success</p>
                        <p className="text-sm text-gray-600">Highly rated by thousands of students</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 font-bold text-sm">✓</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Expert Instruction</p>
                        <p className="text-sm text-gray-600">Learn from industry professionals</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 font-bold text-sm">✓</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Lifetime Access</p>
                        <p className="text-sm text-gray-600">Learn at your own pace, forever</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 font-bold text-sm">✓</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Certificate Included</p>
                        <p className="text-sm text-gray-600">Share your achievement with the world</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Student Ratings & Reviews */}
              <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Star className="h-6 w-6 text-white fill-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">Student Feedback</h2>
                </div>

                {/* Rating Overview */}
                <div className="grid md:grid-cols-2 gap-8 mb-8 p-6 bg-gradient-to-br from-gray-50 to-transparent rounded-xl border border-gray-100">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="text-6xl font-bold text-gray-900 mb-2">{averageRating}</div>
                    <div className="flex mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-6 h-6 ${i < Math.floor(averageRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                            }`}
                        />
                      ))}
                    </div>
                    <p className="text-gray-600 font-medium">Course Rating</p>
                    <p className="text-sm text-gray-500 mt-1">{totalRatings.toLocaleString()} ratings</p>
                  </div>

                  <div className="space-y-3">
                    {ratingDistribution.map((rating) => (
                      <div key={rating.stars} className="flex items-center gap-3">
                        <div className="flex items-center gap-1 w-20">
                          <span className="text-sm font-medium text-gray-700">{rating.stars}</span>
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        </div>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all"
                            style={{ width: `${rating.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-600 w-12 text-right">
                          {rating.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reviews */}
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">Recent Reviews</h3>
                    <FeedbackModal courseId={courseId} triggerLabel="Send Feedback" triggerVariant="outline" />
                  </div>
                  <ReviewsDisplay courseId={courseId} maxReviews={5} />
                </div>

                {/* Review Form - Show if user is enrolled */}
                {user && hasAccess && (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <ReviewForm courseId={courseId} onReviewSubmitted={() => window.location.reload()} />
                  </div>
                )}
              </section>

              {/* FAQ Section */}
              <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
                </div>

                <Accordion type="single" collapsible className="space-y-3">
                  {faqs.map((faq, index) => (
                    <AccordionItem
                      key={index}
                      value={`faq-${index}`}
                      className="border border-gray-200 rounded-xl overflow-hidden hover:border-primary/30 transition-colors"
                    >
                      <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 hover:no-underline text-left">
                        <span className="font-semibold text-gray-900">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4 bg-gray-50/50">
                        <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            </div>

            {/* Right Column - Sticky Card */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24">
                <Card className="overflow-hidden shadow-2xl border-2 border-gray-200 hidden lg:block">
                  {/* Thumbnail with Play Button Overlay */}
                  <div className="relative aspect-video w-full overflow-hidden group cursor-pointer">
                    {courseLoading ? (
                      <Skeleton className="aspect-video w-full" />
                    ) : (
                      <>
                        {isOptimizedImageDomain(course?.thumbnail || '') ? (
                          <Image
                            src={course?.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop'}
                            alt={course?.title || 'Course thumbnail'}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <img
                            src={course?.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop'}
                            alt={course?.title || 'Course thumbnail'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-20 h-20 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-primary transition-all duration-300 shadow-2xl">
                            <PlayCircle className="w-12 h-12 text-primary group-hover:text-white transition-colors" />
                          </div>
                        </div>

                        {/* Price Badge */}
                        <div className="absolute top-4 right-4">
                          <Badge className={`${course?.isFree ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'} text-white font-bold px-4 py-2 text-sm shadow-lg border-0`}>
                            {course?.isFree ? '100% FREE' : `₹${course?.price}`}
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>

                  <CardContent className="p-6 space-y-6">
                    {/* Price Section */}
                    <div className="text-center pb-6 border-b border-gray-200">
                      <div className="flex items-center justify-center gap-3 mb-2">
                        {courseLoading ? (
                          <Skeleton className="h-16 w-32" />
                        ) : (
                          <span className="text-5xl font-bold text-gray-900">{course?.isFree ? 'Free' : `₹${course?.price}`}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 font-medium">Full lifetime access • No credit card required</p>
                    </div>

                    {/* CTA Button */}
                    {user && !hasAccess ? (
                      <Button
                        size="lg"
                        className="w-full text-lg font-bold h-14 shadow-lg hover:shadow-xl transition-all"
                        onClick={() => setShowPurchaseModal(true)}
                        disabled={purchasesLoading}
                      >
                        <CreditCard className="mr-2 h-6 w-6" />
                        Buy Now
                      </Button>
                    ) : onStartStudying && firstLessonId ? (
                      <Button
                        size="lg"
                        className="w-full text-lg font-bold h-14 shadow-lg hover:shadow-xl transition-all"
                        disabled={lessonsLoading || !firstLessonId}
                        onClick={async () => {
                          if (user && course && (course.isFree || isPurchased)) {
                            await enrollCourse(course.id);
                            onStartStudying(firstLessonId);
                          }
                        }}
                      >
                        <PlayCircle className="mr-2 h-6 w-6" />
                        {user ? (progress?.percentage === 0 || !progress ? 'Start Learning Now' : 'Continue Learning') : 'Login to Start'}
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        asChild
                        className="w-full text-lg font-bold h-14 shadow-lg hover:shadow-xl transition-all"
                        disabled={lessonsLoading || !firstLessonId}
                        onClick={async () => {
                          if (user && course && (course.isFree || isPurchased)) {
                            await enrollCourse(course.id);
                          }
                        }}
                      >
                        <Link href={startLink}>
                          <PlayCircle className="mr-2 h-6 w-6" />
                          {user ? (progress?.percentage === 0 || !progress ? 'Start Learning Now' : 'Continue Learning') : 'Login to Start'}
                        </Link>
                      </Button>
                    )}

                    {/* Share & Wishlist */}
                    <div className="flex gap-3">
                      <Button
                        variant={isCourseSaved ? "default" : "outline"}
                        className={`flex-1 ${isCourseSaved ? 'bg-red-600 hover:bg-red-700' : ''}`}
                        size="lg"
                        onClick={async () => {
                          const result = await toggleSave(courseId, isCourseSaved);
                          if (result) {
                            setIsCourseSaved(!isCourseSaved);
                          }
                        }}
                      >
                        <Heart className={`mr-2 h-5 w-5 ${isCourseSaved ? 'fill-current' : ''}`} />
                        {isCourseSaved ? 'Saved' : 'Save'}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1" 
                        size="lg"
                        onClick={() => share({
                          title: course?.title || 'Check out this course',
                          description: course?.description,
                          courseId: courseId
                        })}
                      >
                        <Share2 className="mr-2 h-5 w-5" />
                        Share
                      </Button>
                    </div>

                    {/* Course Includes */}
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      <h4 className="font-bold text-gray-900 text-lg">This course includes:</h4>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-gray-700">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Video className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{totalHours}h {totalMinutes}m video</p>
                            <p className="text-xs text-gray-500">On-demand content</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-700">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{totalLessons} lessons</p>
                            <p className="text-xs text-gray-500">Comprehensive curriculum</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-700">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Download className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Downloadable resources</p>
                            <p className="text-xs text-gray-500">Learn offline anytime</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-700">
                          <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Award className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Certificate of completion</p>
                            <p className="text-xs text-gray-500">Share on LinkedIn</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-700">
                          <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Zap className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Lifetime access</p>
                            <p className="text-xs text-gray-500">Learn at your own pace</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar for Enrolled Users */}
                    {user && progress && (
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-bold text-gray-900">Your Progress</span>
                          <span className="text-lg font-bold text-primary">{progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all duration-500 relative overflow-hidden"
                            style={{ width: `${progressPercentage}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-2 font-medium">
                          {completedCount} of {totalLessons} lessons completed
                        </p>
                      </div>
                    )}

                    {/* Trust Badges */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                          <BarChart3 className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                          <p className="text-xs font-semibold text-gray-900">{enrollmentCount > 1000 ? `${Math.floor(enrollmentCount / 1000)}K+` : enrollmentCount} Students</p>
                        </div>
                        <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                          <Trophy className="w-6 h-6 text-green-600 mx-auto mb-1" />
                          <p className="text-xs font-semibold text-gray-900">{averageRating} Rated</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Mobile Card */}
                <Card className="lg:hidden overflow-hidden shadow-xl border-2 border-gray-200">
                  <div className="relative aspect-video w-full overflow-hidden">
                    {isOptimizedImageDomain(course?.thumbnail || '') ? (
                      <Image
                        src={course?.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop'}
                        alt={course?.title || 'Course thumbnail'}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <img
                        src={course?.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop'}
                        alt={course?.title || 'Course thumbnail'}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-4 py-2 text-sm shadow-lg border-0">
                        100% FREE
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-gray-900 mb-1">Free</p>
                      <p className="text-sm text-gray-600">Full lifetime access</p>
                    </div>
                    <Button size="lg" asChild className="w-full text-lg font-bold h-14">
                      <Link href={startLink}>
                        <PlayCircle className="mr-2 h-6 w-6" />
                        {user ? 'Start Learning' : 'Login to Start'}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Dialog open={showPurchaseModal} onOpenChange={setShowPurchaseModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription>
              You are about to purchase <strong>{course?.title}</strong> for <strong>₹{course?.price}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          {/* In Progress Banner */}
          <Alert className="border-yellow-200 bg-yellow-50 mt-4">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <AlertDescription className="ml-3 text-yellow-800">
              <span className="font-semibold">Payment Gateway In Progress</span>
              <p className="text-sm mt-1">We are integrating payment solutions. This feature will be available soon!</p>
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-center py-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                This is a secure transaction. You will get instant access to all course materials.
              </p>
            </div>
          </div>
          <DialogFooter className="sm:justify-between gap-2">
            <Button variant="outline" onClick={() => setShowPurchaseModal(false)}>
              Close
            </Button>
            <Button disabled className="w-full sm:w-auto opacity-50 cursor-not-allowed">
              <Loader2 className="mr-2 h-4 w-4" />
              Coming Soon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Full Page Loading Screen with Skeleton Layout
 * Shows a complete loading skeleton while course data is being fetched
 * Industry-standard skeleton that prevents layout shift (CLS)
 */
export function FullPageSkeletonLoader() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1">
        {/* Hero Section Skeleton */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
          <div className="container mx-auto max-w-7xl px-4 py-8 pb-12 relative z-10">
            {/* Back Button Skeleton */}
            <Skeleton className="h-10 w-32 bg-white/10 rounded-lg mb-6" />

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Column Skeleton */}
              <div className="space-y-6">
                {/* Category Badges Skeleton */}
                <div className="flex flex-wrap items-center gap-3">
                  <Skeleton className="h-8 w-24 bg-white/10 rounded-full" />
                  <Skeleton className="h-8 w-24 bg-white/10 rounded-full" />
                  <Skeleton className="h-8 w-28 bg-white/10 rounded-full" />
                </div>

                {/* Title Skeleton */}
                <div className="space-y-3">
                  <Skeleton className="h-12 w-3/4 bg-white/10 rounded-lg" />
                  <Skeleton className="h-12 w-4/5 bg-white/10 rounded-lg" />
                </div>

                {/* Description Skeleton */}
                <div className="space-y-2 pt-2">
                  <Skeleton className="h-5 w-full bg-white/10 rounded-lg" />
                  <Skeleton className="h-5 w-5/6 bg-white/10 rounded-lg" />
                </div>

                {/* Rating & Students Skeleton */}
                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <Skeleton className="h-8 w-40 bg-white/10 rounded-lg" />
                  <Skeleton className="h-8 w-48 bg-white/10 rounded-lg" />
                </div>

                {/* Instructor Info Skeleton */}
                <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 bg-white/10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20 bg-white/10 rounded-lg" />
                      <Skeleton className="h-5 w-32 bg-white/10 rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Hero Image Skeleton */}
              <div className="relative lg:order-2">
                <Skeleton className="aspect-video w-full rounded-2xl bg-white/10" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Container Skeleton */}
        <div className="container mx-auto max-w-7xl px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-8 relative">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* What You'll Learn Section Skeleton */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <Skeleton className="h-12 w-12 bg-gray-200 rounded-xl" />
                  <Skeleton className="h-8 w-48 bg-gray-200 rounded-lg" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full bg-gray-200 rounded-xl" />
                  ))}
                </div>
              </div>

              {/* Course Description Section Skeleton */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <Skeleton className="h-12 w-12 bg-gray-200 rounded-xl" />
                  <Skeleton className="h-8 w-56 bg-gray-200 rounded-lg" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-5 w-full bg-gray-200 rounded-lg" />
                  <Skeleton className="h-5 w-5/6 bg-gray-200 rounded-lg" />
                  <Skeleton className="h-5 w-4/6 bg-gray-200 rounded-lg" />
                </div>
              </div>

              {/* Course Curriculum Section Skeleton */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 bg-gray-200 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-48 bg-gray-200 rounded-lg" />
                      <Skeleton className="h-4 w-64 bg-gray-200 rounded-lg" />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full bg-gray-200 rounded-xl" />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Sticky Card Skeleton */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24">
                <div className="bg-white rounded-lg overflow-hidden shadow-2xl border-2 border-gray-200 hidden lg:block">
                  {/* Thumbnail Skeleton */}
                  <Skeleton className="aspect-video w-full" />

                  <div className="p-6 space-y-6">
                    {/* Price Skeleton */}
                    <div className="text-center pb-6 border-b border-gray-200">
                      <Skeleton className="h-16 w-32 bg-gray-200 rounded-lg mx-auto mb-2" />
                      <Skeleton className="h-4 w-48 bg-gray-200 rounded-lg mx-auto" />
                    </div>

                    {/* Button Skeleton */}
                    <Skeleton className="h-14 w-full bg-gray-200 rounded-lg" />

                    {/* Share & Save Buttons Skeleton */}
                    <div className="flex gap-3">
                      <Skeleton className="h-12 w-full bg-gray-200 rounded-lg" />
                      <Skeleton className="h-12 w-full bg-gray-200 rounded-lg" />
                    </div>

                    {/* Course Includes Skeleton */}
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                      <Skeleton className="h-6 w-40 bg-gray-200 rounded-lg" />
                      <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 bg-gray-200 rounded-lg flex-shrink-0" />
                            <div className="flex-1 space-y-1">
                              <Skeleton className="h-4 w-32 bg-gray-200 rounded" />
                              <Skeleton className="h-3 w-40 bg-gray-200 rounded" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Trust Badges Skeleton */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-3">
                        <Skeleton className="h-16 w-full bg-gray-200 rounded-lg" />
                        <Skeleton className="h-16 w-full bg-gray-200 rounded-lg" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Skeleton */}
                <div className="lg:hidden bg-white rounded-lg overflow-hidden shadow-xl border-2 border-gray-200">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-6 space-y-4">
                    <div className="text-center">
                      <Skeleton className="h-12 w-20 bg-gray-200 rounded-lg mx-auto mb-1" />
                      <Skeleton className="h-4 w-40 bg-gray-200 rounded-lg mx-auto" />
                    </div>
                    <Skeleton className="h-12 w-full bg-gray-200 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
