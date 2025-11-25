'use client';

import { useEffect, useMemo } from 'react';
import { useCourseStore } from '@/store/course-store';
import { useDoc, useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, where } from 'firebase/firestore';
import type { Course, Lesson, UserProgress, Note, Purchase, InstructorProfile } from '@/lib/data-types';

/**
 * Hook that combines Zustand store with Firebase data fetching
 * - Checks store first (cache)
 * - Falls back to Firebase if data is stale or missing
 * - Updates store when Firebase data arrives
 */

interface UseOptimizedCourseProps {
  courseId: string;
  userId?: string;
}

export function useOptimizedCourse({ courseId, userId }: UseOptimizedCourseProps) {
  const { firestore } = useFirebase();
  const store = useCourseStore();
  
  // Check if we have fresh data in store
  const cachedCourse = store.getCourse(courseId);
  const cachedLessons = store.getLessons(courseId);
  const isCourseDataFresh = store.isDataFresh(`course_${courseId}`);
  const isLessonsDataFresh = store.isDataFresh(`lessons_${courseId}`);

  // Only fetch from Firebase if cache is stale or missing
  const shouldFetchCourse = !cachedCourse || !isCourseDataFresh;
  const shouldFetchLessons = !cachedLessons.length || !isLessonsDataFresh;

  // Firestore references (only created when needed)
  const courseRef = useMemoFirebase(
    () => (firestore && courseId && shouldFetchCourse ? doc(firestore, 'courses', courseId) : null),
    [firestore, courseId, shouldFetchCourse]
  );

  const lessonsQuery = useMemoFirebase(
    () => (firestore && courseId && shouldFetchLessons 
      ? query(collection(firestore, 'courses', courseId, 'lessons'), orderBy('order'))
      : null),
    [firestore, courseId, shouldFetchLessons]
  );

  // Firebase hooks (these will be disabled if we have fresh cache)
  const courseResult = useDoc<Course>(courseRef);
  const {
    data: firebaseCourse,
    isLoading: courseLoading = false,
  } = courseResult || { data: null, isLoading: false, error: null };

  const lessonsResult = useCollection<Lesson>(lessonsQuery);
  const {
    data: firebaseLessons,
    isLoading: lessonsLoading = false,
  } = lessonsResult || { data: null, isLoading: false, error: null };

  // Update store when Firebase data arrives
  useEffect(() => {
    if (firebaseCourse && courseId) {
      store.setCourse(courseId, firebaseCourse);
    }
  }, [firebaseCourse, courseId]);

  useEffect(() => {
    if (firebaseLessons && courseId) {
      store.setLessons(courseId, firebaseLessons);
    }
  }, [firebaseLessons, courseId]);

  // Return the freshest data available
  const course = cachedCourse || firebaseCourse;
  const lessons = cachedLessons.length > 0 ? cachedLessons : (firebaseLessons || []);

  return {
    course,
    lessons,
    isLoading: shouldFetchCourse ? courseLoading : false,
    isLessonsLoading: shouldFetchLessons ? lessonsLoading : false,
    isCached: !shouldFetchCourse && !shouldFetchLessons,
  };
}

interface UseOptimizedProgressProps {
  courseId: string;
  userId: string;
}

export function useOptimizedUserProgress({ courseId, userId }: UseOptimizedProgressProps) {
  const { firestore } = useFirebase();
  const store = useCourseStore();
  
  const cachedProgress = store.getUserProgress(courseId);
  const isProgressDataFresh = store.isDataFresh(`progress_${courseId}`);
  const shouldFetchProgress = !cachedProgress || !isProgressDataFresh;

  const progressQuery = useMemoFirebase(
    () => (firestore && userId && courseId && shouldFetchProgress 
      ? query(collection(firestore, 'userProgress'), 
          where('userId', '==', userId), 
          where('courseId', '==', courseId))
      : null),
    [firestore, userId, courseId, shouldFetchProgress]
  );

  const {
    data: firebaseProgress,
    isLoading: progressLoading,
  } = useCollection<UserProgress>(progressQuery);

  useEffect(() => {
    if (firebaseProgress && firebaseProgress.length > 0 && courseId) {
      store.setUserProgress(courseId, firebaseProgress[0]);
    }
  }, [firebaseProgress, courseId]);

  const progress = cachedProgress || (firebaseProgress && firebaseProgress[0]);

  return {
    progress,
    isLoading: shouldFetchProgress ? progressLoading : false,
    isCached: !shouldFetchProgress,
  };
}

interface UseOptimizedNotesProps {
  lessonId: string;
  userId: string;
}

export function useOptimizedNotes({ lessonId, userId }: UseOptimizedNotesProps) {
  const { firestore } = useFirebase();
  const store = useCourseStore();
  
  const cachedNotes = store.getUserNotes(lessonId);
  const isNotesDataFresh = store.isDataFresh(`notes_${lessonId}`);
  const shouldFetchNotes = !cachedNotes.length || !isNotesDataFresh;

  const notesQuery = useMemoFirebase(
    () => (firestore && userId && lessonId && shouldFetchNotes
      ? query(collection(firestore, 'users', userId, 'notes'), 
          where('lessonId', '==', lessonId))
      : null),
    [firestore, userId, lessonId, shouldFetchNotes]
  );

  const {
    data: firebaseNotes,
    isLoading: notesLoading,
  } = useCollection<Note>(notesQuery);

  useEffect(() => {
    if (firebaseNotes && lessonId) {
      store.setUserNotes(lessonId, firebaseNotes);
    }
  }, [firebaseNotes, lessonId]);

  const notes = cachedNotes.length > 0 ? cachedNotes : (firebaseNotes || []);

  return {
    notes,
    isLoading: shouldFetchNotes ? notesLoading : false,
    isCached: !shouldFetchNotes,
  };
}

interface UseOptimizedInstructorProps {
  instructorId: string;
}

export function useOptimizedInstructor({ instructorId }: UseOptimizedInstructorProps) {
  const { firestore } = useFirebase();
  const store = useCourseStore();
  
  const cachedProfile = store.getInstructorProfile(instructorId);
  const isProfileDataFresh = store.isDataFresh(`instructor_${instructorId}`);
  const shouldFetchProfile = !cachedProfile || !isProfileDataFresh;

  const profileRef = useMemoFirebase(
    () => (firestore && instructorId && shouldFetchProfile 
      ? doc(firestore, 'instructorProfiles', instructorId) 
      : null),
    [firestore, instructorId, shouldFetchProfile]
  );

  const {
    data: firebaseProfile,
    isLoading: profileLoading,
  } = useDoc<InstructorProfile>(profileRef);

  useEffect(() => {
    if (firebaseProfile && instructorId) {
      store.setInstructorProfile(instructorId, firebaseProfile);
    }
  }, [firebaseProfile, instructorId]);

  const profile = cachedProfile || firebaseProfile;

  return {
    profile,
    isLoading: shouldFetchProfile ? profileLoading : false,
    isCached: !shouldFetchProfile,
  };
}

/**
 * Combined hook for lesson page optimization
 * 
 * This replaces multiple separate Firebase calls with optimized cached calls
 */
interface UseOptimizedLessonPageProps {
  courseId: string;
  lessonId: string;
  userId: string;
}

export function useOptimizedLessonPage({
  courseId,
  lessonId,
  userId,
}: UseOptimizedLessonPageProps) {
  const courseData = useOptimizedCourse({ courseId, userId });
  const progressData = useOptimizedUserProgress({ courseId, userId });
  const notesData = useOptimizedNotes({ lessonId, userId });
  
  // Get current lesson from cached lessons
  const currentLesson = useMemo(() => {
    return courseData.lessons.find(lesson => lesson.id === lessonId) || null;
  }, [courseData.lessons, lessonId]);

  // Get instructor data if course is available
  const instructorData = useOptimizedInstructor({
    instructorId: courseData.course?.instructorId || '',
  });

  return {
    course: courseData.course,
    lessons: courseData.lessons,
    currentLesson,
    progress: progressData.progress,
    notes: notesData.notes,
    instructor: instructorData.profile,
    
    isLoading: courseData.isLoading || progressData.isLoading || notesData.isLoading,
    isCached: courseData.isCached && progressData.isCached && notesData.isCached,
    
    // Performance metrics for debugging
    cacheHits: {
      course: courseData.isCached,
      progress: progressData.isCached,
      notes: notesData.isCached,
    }
  };
}

/**
 * Helper to prefetch data for better UX
 */
export function usePrefetchCourseData(courseId: string, userId?: string) {
  const store = useCourseStore();
  
  useEffect(() => {
    if (!courseId) return;
    
    // Prefetch course and lessons if not cached
    if (!store.isDataFresh(`course_${courseId}`)) {
      // This will trigger background fetching
      // The actual implementation would need to be more sophisticated
      console.log(`Prefetching course data for ${courseId}`);
    }
  }, [courseId, userId]);
}

// Dashboard-specific optimized hook
interface UseOptimizedDashboardProps {
  userId: string;
}

export function useOptimizedDashboard({ userId }: UseOptimizedDashboardProps) {
  const { firestore } = useFirebase();
  const store = useCourseStore();
  
  // Get cached dashboard data
  const cachedCourses = Object.values(store.courses);
  const cachedProgress = Object.values(store.userProgress);
  const isDataFresh = store.isDataFresh(`dashboard_${userId}`, 5 * 60 * 1000); // 5 minutes
  
  // Should fetch if no cached data or data is stale
  const shouldFetchData = !cachedProgress.length || !isDataFresh;

  // Fetch progress data
  const progressQuery = useMemoFirebase(
    () => (firestore && userId && shouldFetchData 
      ? query(collection(firestore, 'users', userId, 'progress')) 
      : null),
    [firestore, userId, shouldFetchData]
  );
  
  const { data: progressData, isLoading: isProgressLoading } = useCollection<UserProgress>(progressQuery);

  // Get enrolled course IDs from progress
  const enrolledCourseIds = progressData?.map(p => p.courseId) || 
    cachedProgress.map(p => p.courseId);

  // Fetch enrolled courses
  const coursesQuery = useMemoFirebase(
    () => (firestore && enrolledCourseIds.length > 0 && shouldFetchData
      ? query(collection(firestore, 'courses'), where('id', 'in', enrolledCourseIds))
      : null),
    [firestore, enrolledCourseIds.join(','), shouldFetchData]
  );
  
  const { data: coursesData, isLoading: isCoursesLoading } = useCollection<Course>(coursesQuery);

  // Update cache when new data arrives
  useEffect(() => {
    if (progressData) {
      progressData.forEach(progress => {
        store.setUserProgress(progress.courseId, progress);
      });
      // Update cache timestamp
      const newTimestamps = { ...store.cacheTimestamps, [`dashboard_${userId}`]: Date.now() };
      store.cacheTimestamps = newTimestamps;
    }
  }, [progressData, userId]);

  useEffect(() => {
    if (coursesData) {
      coursesData.forEach(course => {
        if (course) store.setCourse(course.id, course);
      });
    }
  }, [coursesData]);

  // Return current state (cached or fresh)
  const userProgress = progressData || cachedProgress;
  const enrolledCourses = coursesData || enrolledCourseIds.map(id => cachedCourses.find((c: Course) => c.id === id)).filter(Boolean) as Course[];
  
  const isLoading = (shouldFetchData && (isProgressLoading || isCoursesLoading));

  return {
    userProgress,
    enrolledCourses,
    isLoading,
    isCached: !shouldFetchData
  };
}