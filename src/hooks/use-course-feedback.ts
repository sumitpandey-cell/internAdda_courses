import { useCallback } from 'react';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, doc, orderBy, limit, startAfter } from 'firebase/firestore';
import type { CourseReview, CourseFeedback, CourseStats } from '@/lib/data-types';

export function useCourseFeedback() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  /**
   * Submit a course review
   */
  const submitReview = useCallback(async (courseId: string, rating: number, title: string, comment: string, userName: string, userAvatar: string) => {
    if (!firestore || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to submit a review.",
      });
      return false;
    }

    if (rating < 1 || rating > 5) {
      toast({
        variant: "destructive",
        title: "Invalid Rating",
        description: "Rating must be between 1 and 5.",
      });
      return false;
    }

    try {
      // Check if user already reviewed this course
      const reviewsRef = collection(firestore, 'courseReviews');
      const existingQuery = query(
        reviewsRef,
        where('userId', '==', user.uid),
        where('courseId', '==', courseId)
      );
      const existingSnap = await getDocs(existingQuery);

      if (!existingSnap.empty) {
        toast({
          variant: "destructive",
          title: "Already Reviewed",
          description: "You have already submitted a review for this course.",
        });
        return false;
      }

      // Submit review
      await addDoc(reviewsRef, {
        userId: user.uid,
        courseId: courseId,
        userName: userName,
        userAvatar: userAvatar,
        rating: rating,
        title: title,
        comment: comment,
        helpful: 0,
        unhelpful: 0,
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Review Submitted!",
        description: "Thank you for your feedback. Your review has been published.",
      });
      return true;
    } catch (error) {
      console.error('Review submission error:', error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Could not submit your review. Please try again.",
      });
      return false;
    }
  }, [firestore, user, toast]);

  /**
   * Get all reviews for a course
   */
  const getCourseReviews = useCallback(async (courseId: string, pageSize: number = 10): Promise<CourseReview[]> => {
    if (!firestore) return [];

    try {
      const reviewsRef = collection(firestore, 'courseReviews');
      const reviewsQuery = query(
        reviewsRef,
        where('courseId', '==', courseId),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );
      const reviewsSnap = await getDocs(reviewsQuery);

      return reviewsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CourseReview[];
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  }, [firestore]);

  /**
   * Get average rating and review count for a course
   */
  const getCourseRatingStats = useCallback(async (courseId: string): Promise<{ averageRating: number; totalReviews: number; ratingDistribution: Record<number, number> }> => {
    if (!firestore) return { averageRating: 0, totalReviews: 0, ratingDistribution: {} };

    try {
      const reviewsRef = collection(firestore, 'courseReviews');
      const reviewsQuery = query(
        reviewsRef,
        where('courseId', '==', courseId)
      );
      const reviewsSnap = await getDocs(reviewsQuery);

      if (reviewsSnap.empty) {
        return { averageRating: 0, totalReviews: 0, ratingDistribution: {} };
      }

      const reviews = reviewsSnap.docs.map(doc => doc.data() as CourseReview);
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;

      // Calculate rating distribution
      const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach(review => {
        ratingDistribution[review.rating]++;
      });

      return {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length,
        ratingDistribution
      };
    } catch (error) {
      console.error('Error fetching rating stats:', error);
      return { averageRating: 0, totalReviews: 0, ratingDistribution: {} };
    }
  }, [firestore]);

  /**
   * Mark review as helpful
   */
  const markHelpful = useCallback(async (reviewId: string, isHelpful: boolean) => {
    if (!firestore) return false;

    try {
      const reviewRef = doc(firestore, 'courseReviews', reviewId);
      if (isHelpful) {
        await updateDoc(reviewRef, {
          helpful: (await getDocs(query(collection(firestore, 'courseReviews'), where('id', '==', reviewId)))).docs[0]?.data()?.helpful + 1 || 1
        });
      } else {
        await updateDoc(reviewRef, {
          unhelpful: (await getDocs(query(collection(firestore, 'courseReviews'), where('id', '==', reviewId)))).docs[0]?.data()?.unhelpful + 1 || 1
        });
      }
      return true;
    } catch (error) {
      console.error('Error marking helpful:', error);
      return false;
    }
  }, [firestore]);

  /**
   * Submit course feedback (suggestions, bugs, complaints, praise)
   */
  const submitFeedback = useCallback(async (courseId: string, type: 'suggestion' | 'bug' | 'complaint' | 'praise', subject: string, message: string) => {
    if (!firestore || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to submit feedback.",
      });
      return false;
    }

    try {
      const feedbackRef = collection(firestore, 'courseFeedback');
      await addDoc(feedbackRef, {
        userId: user.uid,
        courseId: courseId,
        type: type,
        subject: subject,
        message: message,
        createdAt: serverTimestamp(),
        status: 'pending'
      });

      toast({
        title: "Feedback Submitted!",
        description: "Thank you for helping us improve. Your feedback has been recorded.",
      });
      return true;
    } catch (error) {
      console.error('Feedback submission error:', error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Could not submit your feedback. Please try again.",
      });
      return false;
    }
  }, [firestore, user, toast]);

  /**
   * Get feedback for a course (instructor/admin only)
   */
  const getCourseFeedback = useCallback(async (courseId: string): Promise<CourseFeedback[]> => {
    if (!firestore || !user) return [];

    try {
      const feedbackRef = collection(firestore, 'courseFeedback');
      const feedbackQuery = query(
        feedbackRef,
        where('courseId', '==', courseId),
        orderBy('createdAt', 'desc')
      );
      const feedbackSnap = await getDocs(feedbackQuery);

      return feedbackSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CourseFeedback[];
    } catch (error) {
      console.error('Error fetching feedback:', error);
      return [];
    }
  }, [firestore, user]);

  /**
   * Update feedback status (instructor/admin only)
   */
  const updateFeedbackStatus = useCallback(async (feedbackId: string, status: 'pending' | 'reviewed' | 'resolved') => {
    if (!firestore) return false;

    try {
      const feedbackRef = doc(firestore, 'courseFeedback', feedbackId);
      await updateDoc(feedbackRef, { status });
      return true;
    } catch (error) {
      console.error('Error updating feedback status:', error);
      return false;
    }
  }, [firestore]);

  /**
   * Update course stats
   */
  const updateCourseStats = useCallback(async (courseId: string, stats: Partial<CourseStats>) => {
    if (!firestore) return false;

    try {
      const statsRef = collection(firestore, 'courseStats');
      const statsQuery = query(statsRef, where('courseId', '==', courseId));
      const statsSnap = await getDocs(statsQuery);

      if (statsSnap.empty) {
        // Create new stats document
        await addDoc(statsRef, {
          courseId,
          totalEnrollments: stats.totalEnrollments || 0,
          totalReviews: stats.totalReviews || 0,
          averageRating: stats.averageRating || 0,
          completionRate: stats.completionRate || 0,
          lastUpdated: serverTimestamp()
        });
      } else {
        // Update existing stats document
        const existingStatsDoc = statsSnap.docs[0];
        await updateDoc(doc(firestore, 'courseStats', existingStatsDoc.id), {
          ...stats,
          lastUpdated: serverTimestamp()
        });
      }
      return true;
    } catch (error) {
      console.error('Error updating course stats:', error);
      return false;
    }
  }, [firestore]);

  /**
   * Get course stats
   */
  const getCourseStats = useCallback(async (courseId: string): Promise<CourseStats | null> => {
    if (!firestore) return null;

    try {
      const statsRef = collection(firestore, 'courseStats');
      const statsQuery = query(statsRef, where('courseId', '==', courseId));
      const statsSnap = await getDocs(statsQuery);

      if (statsSnap.empty) return null;
      return statsSnap.docs[0].data() as CourseStats;
    } catch (error) {
      console.error('Error fetching course stats:', error);
      return null;
    }
  }, [firestore]);

  return {
    submitReview,
    getCourseReviews,
    getCourseRatingStats,
    markHelpful,
    submitFeedback,
    getCourseFeedback,
    updateFeedbackStatus,
    updateCourseStats,
    getCourseStats,
  };
}
