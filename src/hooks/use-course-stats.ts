import { useEffect, useState, useCallback } from 'react';
import { useCourseFeedback } from './use-course-feedback';
import { useEnrollment } from './use-enrollment';
import { useCourseStore } from '@/store/course-store';
import type { CourseStats } from '@/lib/data-types';

/**
 * Hook to easily access course statistics with automatic caching
 * 
 * @param courseId - The ID of the course
 * @returns Object containing stats, loading state, and refresh function
 */
export function useCourseStats(courseId: string) {
    const { getCourseStats, getCourseRatingStats, updateCourseStats: updateStoreStats } = useCourseFeedback();
    const { getActiveEnrollmentCount } = useEnrollment();
    console.log("8978798798", getActiveEnrollmentCount(courseId))
    const getCachedStats = useCourseStore((state) => state.getCourseStats);
    const isDataFresh = useCourseStore((state) => state.isDataFresh);

    const [stats, setStats] = useState<CourseStats | null>(() => {
        // Initialize from cache if available
        if (!courseId) return null;
        return getCachedStats(courseId);
    });

    const [isLoading, setIsLoading] = useState(() => {
        // If we have fresh cached data, we're not loading
        if (!courseId) return false;
        const cached = getCachedStats(courseId);
        return !(cached && isDataFresh(`stats_${courseId}`, 5 * 60 * 1000));
    });
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async (force = false) => {
        if (!courseId) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Check cache first unless forced refresh
            if (!force) {
                const cachedStats = getCachedStats(courseId);
                if (cachedStats && isDataFresh(`stats_${courseId}`, 5 * 60 * 1000)) {
                    setStats(cachedStats);
                    setIsLoading(false);
                    return;
                }
            }

            // Fetch from Firestore (will update cache automatically)
            const fetchedStats = await getCourseStats(courseId);
            setStats(fetchedStats);
        } catch (err) {
            console.error('Error fetching course stats:', err);
            setError('Failed to load course statistics');
        } finally {
            setIsLoading(false);
        }
    }, [courseId, getCachedStats, isDataFresh, getCourseStats]);

    // Sync stats from various sources (enrollments, reviews) and update the main stats doc
    // This is a heavier operation that should be called when viewing the course page
    const syncStats = useCallback(async () => {
        if (!courseId) return;

        try {
            // 1. Get fresh enrollment count
            const enrollmentCount = await getActiveEnrollmentCount(courseId);

            // 2. Get fresh rating stats
            const ratingStats = await getCourseRatingStats(courseId);

            // 3. Update Firestore and Store
            await updateStoreStats(courseId, {
                totalEnrollments: enrollmentCount,
                averageRating: ratingStats.averageRating,
                totalReviews: ratingStats.totalReviews,
            });

            // 4. Update local state to reflect changes immediately
            const updatedStats = getCachedStats(courseId);
            if (updatedStats) {
                setStats(updatedStats);
            }

        } catch (err) {
            console.error('Error syncing course stats:', err);
        }
    }, [courseId, getActiveEnrollmentCount, getCourseRatingStats, updateStoreStats, getCachedStats]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return {
        stats,
        isLoading,
        error,
        refresh: () => fetchStats(true), // Force refresh
        syncStats, // Call this to aggregate and update stats
    };
}
