'use client';

import { useCallback, useMemo } from 'react';
import type { Lesson, UserProgress } from '@/lib/data-types';

/**
 * Query Cache Strategy for Firestore
 * 
 * Instead of making new queries on every component render,
 * we cache the results and only refetch when dependencies actually change.
 */

interface CachedQueryState {
  lessons: Lesson[] | null;
  currentLesson: Lesson | null;
  progress: UserProgress | null;
  notes: any[] | null;
}

/**
 * Hook to manage Firestore query results with caching
 * 
 * Benefits:
 * 1. Reduces redundant Firestore reads
 * 2. Faster component updates (state cache is instant)
 * 3. Better memory management
 * 4. Works seamlessly with optimistic updates
 */
export function useLessonsCache(
  lessons: Lesson[] | null,
  currentLessonId: string | null,
  currentLesson: Lesson | null
) {
  // Memoize lessons list to prevent unnecessary recalculations
  const cachedLessons = useMemo(() => lessons, [lessons]);

  // Memoize current lesson lookup
  const cachedCurrentLesson = useMemo(() => {
    if (!currentLessonId || !lessons) return currentLesson;
    return lessons.find(l => l.id === currentLessonId) || currentLesson;
  }, [currentLessonId, lessons, currentLesson]);

  // Memoize next/previous lesson calculations
  const { nextLesson, prevLesson } = useMemo(() => {
    if (!currentLessonId || !lessons) {
      return { nextLesson: null, prevLesson: null };
    }

    const currentIndex = lessons.findIndex(l => l.id === currentLessonId);
    return {
      nextLesson: currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null,
      prevLesson: currentIndex > 0 ? lessons[currentIndex - 1] : null,
    };
  }, [currentLessonId, lessons]);

  // Memoize section grouping
  const groupedLessons = useMemo(() => {
    if (!lessons) return {};
    return lessons.reduce((acc, lesson) => {
      const section = lesson.section || 'Other Lessons';
      if (!acc[section]) acc[section] = [];
      acc[section].push(lesson);
      return acc;
    }, {} as Record<string, Lesson[]>);
  }, [lessons]);

  return {
    lessons: cachedLessons,
    currentLesson: cachedCurrentLesson,
    nextLesson,
    prevLesson,
    groupedLessons,
  };
}

/**
 * Hook to cache and calculate progress metrics
 * 
 * Prevents recalculating percentages and stats on every render
 */
export function useProgressCache(
  progress: UserProgress | null,
  lessons: Lesson[] | null,
  completedLessons: string[]
) {
  return useMemo(() => {
    if (!lessons) {
      return {
        percentage: 0,
        completedCount: 0,
        totalLessons: 0,
        isCompleted: false,
      };
    }

    const completedCount = completedLessons.length;
    const totalLessons = lessons.length;
    const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    return {
      percentage,
      completedCount,
      totalLessons,
      isCompleted: percentage === 100,
    };
  }, [progress, lessons, completedLessons]);
}

/**
 * Hook to batch Firestore query results for efficient state management
 */
export function useBatchedQueries(
  coursesData: any,
  lessonsData: any[],
  progressData: any[],
  notesData: any[]
) {
  return useMemo(() => {
    return {
      course: coursesData || null,
      lessons: lessonsData || [],
      progress: progressData && progressData.length > 0 ? progressData[0] : null,
      notes: notesData || [],
    };
  }, [coursesData, lessonsData, progressData, notesData]);
}

/**
 * Optimized selector for derived state
 * 
 * Instead of creating new objects on every render,
 * only update when the underlying data changes
 */
export function useCompletionStatus(
  completedLessons: string[],
  totalLessons: number,
  isCurrentLessonCompleted: boolean
) {
  return useMemo(() => ({
    isCompleted: isCurrentLessonCompleted,
    percentageComplete: totalLessons > 0 ? (completedLessons.length / totalLessons) * 100 : 0,
    lessonsRemaining: totalLessons - completedLessons.length,
    isFullyComplete: completedLessons.length === totalLessons,
  }), [completedLessons, totalLessons, isCurrentLessonCompleted]);
}
