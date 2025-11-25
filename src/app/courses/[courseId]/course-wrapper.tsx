'use client';

import { useCallback, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { FullPageSkeletonLoader } from './course-page-content';

// Dynamic imports to avoid circular dependencies
const CoursePageContent = dynamic(() => import('./course-page-content'), {
  loading: () => <FullPageSkeletonLoader />,
  ssr: true
});

/**
 * CourseWrapper - Manages course overview
 * 
 * Now simplified to just render the overview.
 * Navigation to lessons is handled by routing to /courses/[courseId]/lesson/[lessonId]
 */
export default function CourseWrapper() {
  const params = useParams<{ courseId: string }>();
  const { courseId } = params;
  const router = useRouter();

  // Navigate to study view with a specific lesson
  const handleStartStudying = useCallback((firstLessonId: string) => {
    router.push(`/courses/${courseId}/lesson/${firstLessonId}`);
  }, [courseId, router]);

  return (
    <Suspense fallback={<FullPageSkeletonLoader />}>
      <CoursePageContent onStartStudying={handleStartStudying} />
    </Suspense>
  );
}
