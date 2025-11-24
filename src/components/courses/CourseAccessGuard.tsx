'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFirebase } from '@/firebase';
import { useEnrollment } from '@/hooks/use-enrollment';
import { Lock, LogIn, GraduationCap, AlertCircle } from 'lucide-react';
import type { Course } from '@/lib/data-types';

type CourseAccessGuardProps = {
  children: React.ReactNode;
  courseId: string;
  course?: Course;
};

export function CourseAccessGuard({ children, courseId, course }: CourseAccessGuardProps) {
  const router = useRouter();
  const { user, isUserLoading } = useFirebase();
  const { isEnrolled, enrollCourse } = useEnrollment();
  
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      // If not logged in, no access to main content
      if (!user) {
        setHasAccess(false);
        return;
      }

      // Check if user is enrolled
      try {
        const enrolled = await isEnrolled(courseId);
        setHasAccess(enrolled);
      } catch (err) {
        console.error('Error checking enrollment:', err);
        setHasAccess(false);
        setError('Failed to verify enrollment. Please try again.');
      }
    };

    if (!isUserLoading) {
      checkAccess();
    }
  }, [user, courseId, isEnrolled, isUserLoading]);

  const handleEnroll = async () => {
    if (!user || !course) return;

    setIsEnrolling(true);
    setError(null);
    try {
      const success = await enrollCourse(courseId);
      if (success) {
        setHasAccess(true);
      } else {
        setError('Failed to enroll in course. Please try again.');
      }
    } catch (err) {
      console.error('Enrollment error:', err);
      setError('Something went wrong during enrollment.');
    } finally {
      setIsEnrolling(false);
    }
  };

  // Loading state
  if (isUserLoading || hasAccess === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <GraduationCap className="w-12 h-12 text-primary mx-auto" />
          </div>
          <p className="text-gray-600">Verifying your access...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full p-8 shadow-lg">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <LogIn className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-center mb-4">Sign In Required</h1>
          <p className="text-gray-600 text-center mb-6">
            You need to be logged in to access this course content.
          </p>

          <Button
            size="lg"
            className="w-full"
            onClick={() => router.push(`/login?redirect=/courses/${courseId}`)}
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Button>

          <p className="text-sm text-gray-500 text-center mt-4">
            Don't have an account?{' '}
            <button
              className="text-primary font-semibold hover:underline"
              onClick={() => router.push(`/signup?redirect=/courses/${courseId}`)}
            >
              Sign up for free
            </button>
          </p>
        </Card>
      </div>
    );
  }

  // Not enrolled
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full p-8 shadow-lg">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-amber-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-center mb-2">Enroll to Access</h1>
          <p className="text-gray-600 text-center mb-6">
            You're not enrolled in this course yet. Enroll now to access all lessons and materials.
          </p>

          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <Button
            size="lg"
            className="w-full mb-3"
            onClick={handleEnroll}
            disabled={isEnrolling}
          >
            {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
          </Button>

          {course?.isFree && (
            <p className="text-xs text-center text-gray-500">
              This course is free - no credit card required
            </p>
          )}

          <button
            className="text-sm text-center text-primary font-semibold hover:underline mt-4 w-full"
            onClick={() => router.back()}
          >
            Go Back
          </button>
        </Card>
      </div>
    );
  }

  // Enrolled - show content
  return <>{children}</>;
}
