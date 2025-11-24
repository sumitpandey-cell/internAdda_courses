import { useFirebase } from '@/firebase';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import type { UserProgress } from '@/lib/data-types';

export function useProgressTracking() {
  const { firestore, user } = useFirebase();

  /**
   * Get user's progress in a course
   */
  const getProgress = async (courseId: string): Promise<UserProgress | null> => {
    if (!firestore || !user) return null;

    try {
      const progressRef = collection(firestore, 'userProgress');
      const progressQuery = query(
        progressRef,
        where('userId', '==', user.uid),
        where('courseId', '==', courseId)
      );
      const progressSnap = await getDocs(progressQuery);

      if (!progressSnap.empty) {
        const doc = progressSnap.docs[0];
        return { ...doc.data(), id: doc.id } as UserProgress & { id: string };
      }
      return null;
    } catch (error) {
      console.error('Error fetching progress:', error);
      return null;
    }
  };

  /**
   * Mark a lesson as completed and update progress percentage
   */
  const markLessonComplete = async (
    courseId: string,
    lessonId: string,
    totalLessons: number
  ): Promise<{ success: boolean; newPercentage?: number }> => {
    if (!firestore || !user) {
      return { success: false };
    }

    try {
      // Get current progress
      const progress = await getProgress(courseId);

      if (!progress) {
        // Create new progress record
        const completedLessons = [lessonId];
        const percentage = Math.round((completedLessons.length / totalLessons) * 100);

        await addDoc(collection(firestore, 'userProgress'), {
          userId: user.uid,
          courseId: courseId,
          completedLessons,
          totalLessons,
          percentage,
          lastLessonId: lessonId,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        });

        return { success: true, newPercentage: percentage };
      }

      // Check if lesson is already completed
      if (progress.completedLessons?.includes(lessonId)) {
        return { success: true, newPercentage: progress.percentage };
      }

      // Update existing progress
      const updatedLessons = [...(progress.completedLessons || []), lessonId];
      const newPercentage = Math.round((updatedLessons.length / totalLessons) * 100);

      const progressRef = collection(firestore, 'userProgress');
      const progressQuery = query(
        progressRef,
        where('userId', '==', user.uid),
        where('courseId', '==', courseId)
      );
      const progressSnap = await getDocs(progressQuery);

      if (!progressSnap.empty) {
        const progressDoc = progressSnap.docs[0];
        await updateDoc(doc(firestore, 'userProgress', progressDoc.id), {
          completedLessons: updatedLessons,
          percentage: newPercentage,
          lastLessonId: lessonId,
          updatedAt: serverTimestamp(),
        });
      }

      return { success: true, newPercentage };
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      return { success: false };
    }
  };

  /**
   * Mark a lesson as incomplete
   */
  const markLessonIncomplete = async (
    courseId: string,
    lessonId: string,
    totalLessons: number
  ): Promise<{ success: boolean; newPercentage?: number }> => {
    if (!firestore || !user) {
      return { success: false };
    }

    try {
      const progress = await getProgress(courseId);

      if (!progress || !progress.completedLessons?.includes(lessonId)) {
        return { success: true, newPercentage: progress?.percentage || 0 };
      }

      const updatedLessons = progress.completedLessons.filter(id => id !== lessonId);
      const newPercentage = updatedLessons.length > 0
        ? Math.round((updatedLessons.length / totalLessons) * 100)
        : 0;

      const progressRef = collection(firestore, 'userProgress');
      const progressQuery = query(
        progressRef,
        where('userId', '==', user.uid),
        where('courseId', '==', courseId)
      );
      const progressSnap = await getDocs(progressQuery);

      if (!progressSnap.empty) {
        const progressDoc = progressSnap.docs[0];
        await updateDoc(doc(firestore, 'userProgress', progressDoc.id), {
          completedLessons: updatedLessons,
          percentage: newPercentage,
          updatedAt: serverTimestamp(),
        });
      }

      return { success: true, newPercentage };
    } catch (error) {
      console.error('Error marking lesson incomplete:', error);
      return { success: false };
    }
  };

  /**
   * Get user's eligibility for feedback/reviews
   */
  const isEligibleForFeedback = async (courseId: string, minPercentage: number = 50): Promise<boolean> => {
    const progress = await getProgress(courseId);
    return progress ? progress.percentage >= minPercentage : false;
  };

  return {
    getProgress,
    markLessonComplete,
    markLessonIncomplete,
    isEligibleForFeedback,
  };
}
