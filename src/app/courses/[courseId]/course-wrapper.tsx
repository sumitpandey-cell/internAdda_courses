'use client';

import { useState, useCallback, Suspense } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { FullPageSkeletonLoader } from './course-page-content';

// Import the components with their own naming
import type { ComponentType } from 'react';

// Dynamic imports to avoid circular dependencies
const CoursePageContent = dynamic(() => import('./course-page-content'), { 
  loading: () => <FullPageSkeletonLoader />,
  ssr: true
});
const LessonWrapper = dynamic(() => import('./lesson/lesson-wrapper'), {
  loading: () => <FullPageSkeletonLoader />,
  ssr: true
});

type ViewType = 'overview' | 'study';

/**
 * CourseWrapper - Manages navigation between course overview and study without changing URL
 * 
 * Allows smooth transitions between:
 * - Course Overview (info, instructor, reviews)
 * - Study Dashboard (lessons, progress tracking)
 * 
 * Without full page rerenders
 */
export default function CourseWrapper() {
  const params = useParams<{ courseId: string; lessonId?: string }>();
  const { courseId, lessonId } = params;
  
  // Determine initial view based on whether lessonId is present
  const [currentView, setCurrentView] = useState<ViewType>(lessonId ? 'study' : 'overview');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(lessonId || null);

  // Navigate to study view with a specific lesson
  const handleStartStudying = useCallback((firstLessonId: string) => {
    setSelectedLessonId(firstLessonId);
    setCurrentView('study');
  }, []);

  // Navigate back to overview
  const handleBackToOverview = useCallback(() => {
    setCurrentView('overview');
  }, []);

  return (
    <>
      {currentView === 'overview' ? (
        <Suspense fallback={<FullPageSkeletonLoader />}>
          <CoursePageContent onStartStudying={handleStartStudying} />
        </Suspense>
      ) : selectedLessonId ? (
        <Suspense fallback={<FullPageSkeletonLoader />}>
          <LessonWrapper 
            initialLessonId={selectedLessonId}
            onBackToCourse={handleBackToOverview}
          />
        </Suspense>
      ) : null}
    </>
  );
}
