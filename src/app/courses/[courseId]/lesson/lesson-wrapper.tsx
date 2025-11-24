'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import LessonContent from './lesson-content';
import type { Lesson } from '@/lib/data-types';

interface LessonWrapperProps {
  onBackToCourse?: () => void;
  initialLessonId?: string;
}

/**
 * LessonWrapper - Manages lesson navigation state without changing URL
 * 
 * The URL stays as: /courses/[courseId]/lesson/[lessonId]
 * But we load lessons dynamically via state instead of URL changes
 * This prevents full page rerenders during lesson navigation
 */
export default function LessonWrapper({ onBackToCourse, initialLessonId: propLessonId }: LessonWrapperProps = {}) {
  const params = useParams<{ courseId: string; lessonId: string }>();
  const { courseId, lessonId: paramLessonId } = params;
  const lessonId = propLessonId || paramLessonId;
  
  // Current lesson state - this is what drives the content, not the URL
  const [currentLessonId, setCurrentLessonId] = useState<string>(lessonId);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Handle lesson navigation without changing URL
  const handleNavigateToLesson = useCallback((newLessonId: string) => {
    if (isTransitioning || newLessonId === currentLessonId) return;
    
    setIsTransitioning(true);
    
    // Simulate smooth transition
    setTimeout(() => {
      setCurrentLessonId(newLessonId);
      setIsTransitioning(false);
    }, 0); // Use 0ms for instant, or 300ms for fade effect
  }, [currentLessonId, isTransitioning]);

  // Update local state when URL param changes (e.g., direct link or browser back/forward)
  useEffect(() => {
    if (lessonId && lessonId !== currentLessonId) {
      setCurrentLessonId(lessonId);
    }
  }, [lessonId]);

  return (
    <LessonContent
      courseId={courseId}
      currentLessonId={currentLessonId}
      onNavigateToLesson={handleNavigateToLesson}
      onBackToCourse={onBackToCourse}
      isTransitioning={isTransitioning}
    />
  );
}
