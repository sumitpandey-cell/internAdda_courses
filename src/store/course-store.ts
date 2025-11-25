
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Course, Lesson, UserProgress, Note, Purchase, InstructorProfile, CourseStats } from '@/lib/data-types';

interface CourseState {
  // Course Data
  courses: Record<string, Course>;
  lessons: Record<string, Lesson[]>; // courseId -> lessons array
  instructorProfiles: Record<string, InstructorProfile>;
  courseStats: Record<string, CourseStats>; // courseId -> stats (enrollments, ratings, etc.)

  // User-specific Data
  userProgress: Record<string, UserProgress>; // courseId -> progress
  userNotes: Record<string, Note[]>; // lessonId -> notes array
  userPurchases: Record<string, Purchase>;

  // UI State
  lastViewedCourse: string | null;
  lastViewedLesson: Record<string, string>; // courseId -> lessonId

  // Cache metadata
  cacheTimestamps: Record<string, number>;

  // Actions
  setCourse: (courseId: string, course: Course) => void;
  setLessons: (courseId: string, lessons: Lesson[]) => void;
  setUserProgress: (courseId: string, progress: UserProgress) => void;
  setUserNotes: (lessonId: string, notes: Note[]) => void;
  setInstructorProfile: (instructorId: string, profile: InstructorProfile) => void;
  setCourseStats: (courseId: string, stats: CourseStats) => void;

  // Getters (computed values)
  getCourse: (courseId: string) => Course | null;
  getLessons: (courseId: string) => Lesson[];
  getUserProgress: (courseId: string) => UserProgress | null;
  getUserNotes: (lessonId: string) => Note[];
  getInstructorProfile: (instructorId: string) => InstructorProfile | null;
  getCourseStats: (courseId: string) => CourseStats | null;

  // Cache management
  isDataFresh: (key: string, maxAge?: number) => boolean;
  clearCache: () => void;
  clearUserData: () => void;
}

const DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5 minutes

export const useCourseStore = create<CourseState>()(
  persist(
    (set, get) => ({
      // Initial state
      courses: {},
      lessons: {},
      instructorProfiles: {},
      courseStats: {},
      userProgress: {},
      userNotes: {},
      userPurchases: {},
      lastViewedCourse: null,
      lastViewedLesson: {},
      cacheTimestamps: {},

      // Actions
      setCourse: (courseId: string, course: Course) =>
        set((state) => ({
          courses: { ...state.courses, [courseId]: course },
          cacheTimestamps: { ...state.cacheTimestamps, [`course_${courseId}`]: Date.now() },
        })),

      setLessons: (courseId: string, lessons: Lesson[]) =>
        set((state) => ({
          lessons: { ...state.lessons, [courseId]: lessons },
          cacheTimestamps: { ...state.cacheTimestamps, [`lessons_${courseId}`]: Date.now() },
        })),

      setUserProgress: (courseId: string, progress: UserProgress) =>
        set((state) => ({
          userProgress: { ...state.userProgress, [courseId]: progress },
          cacheTimestamps: { ...state.cacheTimestamps, [`progress_${courseId}`]: Date.now() },
        })),

      setUserNotes: (lessonId: string, notes: Note[]) =>
        set((state) => ({
          userNotes: { ...state.userNotes, [lessonId]: notes },
          cacheTimestamps: { ...state.cacheTimestamps, [`notes_${lessonId}`]: Date.now() },
        })),

      setInstructorProfile: (instructorId: string, profile: InstructorProfile) =>
        set((state) => ({
          instructorProfiles: { ...state.instructorProfiles, [instructorId]: profile },
          cacheTimestamps: { ...state.cacheTimestamps, [`instructor_${instructorId}`]: Date.now() },
        })),

      setCourseStats: (courseId: string, stats: CourseStats) =>
        set((state) => ({
          courseStats: { ...state.courseStats, [courseId]: stats },
          cacheTimestamps: { ...state.cacheTimestamps, [`stats_${courseId}`]: Date.now() },
        })),

      // Getters
      getCourse: (courseId: string) => get().courses[courseId] || null,

      getLessons: (courseId: string) => get().lessons[courseId] || [],

      getUserProgress: (courseId: string) => get().userProgress[courseId] || null,

      getUserNotes: (lessonId: string) => get().userNotes[lessonId] || [],

      getInstructorProfile: (instructorId: string) => get().instructorProfiles[instructorId] || null,

      getCourseStats: (courseId: string) => get().courseStats[courseId] || null,

      // Cache management
      isDataFresh: (key: string, maxAge: number = DEFAULT_CACHE_TIME) => {
        const timestamp = get().cacheTimestamps[key];
        if (!timestamp) return false;
        return Date.now() - timestamp < maxAge;
      },

      clearCache: () =>
        set(() => ({
          courses: {},
          lessons: {},
          instructorProfiles: {},
          courseStats: {},
          cacheTimestamps: {},
        })),

      clearUserData: () =>
        set((state) => ({
          userProgress: {},
          userNotes: {},
          userPurchases: {},
          lastViewedCourse: null,
          lastViewedLesson: {},
        })),
    }),
    {
      name: 'course-storage', // unique name
      partialize: (state) => ({
        // Only persist non-user-specific data
        courses: state.courses,
        lessons: state.lessons,
        instructorProfiles: state.instructorProfiles,
        courseStats: state.courseStats,
        cacheTimestamps: state.cacheTimestamps,
        // Don't persist user-specific data (privacy/security)
      }),
    }
  )
);