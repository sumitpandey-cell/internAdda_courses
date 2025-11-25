import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import type { Enrollment, UserProgress } from '@/lib/data-types';

export function useEnrollment() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  /**
   * Enroll a user in a course
   */
  const enrollCourse = async (courseId: string) => {
    if (!firestore || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to enroll.",
      });
      return false;
    }

    try {
      // Check if already enrolled
      const enrollmentsRef = collection(firestore, 'enrollments');
      const existingQuery = query(
        enrollmentsRef,
        where('userId', '==', user.uid),
        where('courseId', '==', courseId)
      );
      const existingSnap = await getDocs(existingQuery);

      if (!existingSnap.empty) {
        toast({
          variant: "destructive",
          title: "Already Enrolled",
          description: "You are already enrolled in this course.",
        });
        return false;
      }

      // Create enrollment record
      await addDoc(enrollmentsRef, {
        userId: user.uid,
        courseId: courseId,
        enrolledAt: serverTimestamp(),
        status: 'active'
      });

      toast({
        title: "Enrolled Successfully!",
        description: "You can now start learning this course.",
      });
      return true;
    } catch (error) {
      console.error('Enrollment error:', error);
      toast({
        variant: "destructive",
        title: "Enrollment Failed",
        description: "Could not enroll in the course. Please try again.",
      });
      return false;
    }
  };

  /**
   * Check if user is enrolled in a course
   */
  const isEnrolled = async (courseId: string): Promise<boolean> => {
    if (!firestore || !user) return false;

    try {
      const enrollmentsRef = collection(firestore, 'enrollments');
      const enrollQuery = query(
        enrollmentsRef,
        where('userId', '==', user.uid),
        where('courseId', '==', courseId)
      );
      const enrollSnap = await getDocs(enrollQuery);
      return !enrollSnap.empty;
    } catch (error) {
      console.error('Error checking enrollment:', error);
      return false;
    }
  };

  /**
   * Get enrollment count for a course
   */
  const getEnrollmentCount = async (courseId: string): Promise<number> => {
    if (!firestore) return 0;

    try {
      const enrollmentsRef = collection(firestore, 'enrollments');
      const countQuery = query(
        enrollmentsRef,
        where('courseId', '==', courseId),
        where('status', '==', 'active')
      );
      const countSnap = await getDocs(countQuery);
      return countSnap.size;
    } catch (error) {
      console.error('Error getting enrollment count:', error);
      return 0;
    }
  };

  /**
   * Get all active enrollment count for a course
   */
  const getActiveEnrollmentCount = async (courseId: string): Promise<number> => {
    if (!firestore) return 0;

    try {
      // First try to get from public enrollmentStats collection (preferred - no permission issues)
      const statsRef = doc(firestore, 'enrollmentStats', courseId);
      const statsSnap = await getDoc(statsRef);
      
      if (statsSnap.exists() && statsSnap.data()?.activeCount !== undefined) {
        return statsSnap.data().activeCount;
      }

      // Fallback: Only query enrollments if we're authenticated and likely have permission
      if (!user) {
        // Not authenticated - cannot read enrollments, return 0
        return 0;
      }

      // Try to get from enrollments collection (requires proper permissions)
      const enrollmentsRef = collection(firestore, 'enrollments');
      const activeQuery = query(
        enrollmentsRef,
        where('courseId', '==', courseId),
        where('status', '==', 'active')
      );
      const activeSnap = await getDocs(activeQuery);
      return activeSnap.size;
    } catch (error) {
      // If permission denied on enrollments, try stats one more time silently
      try {
        const statsRef = doc(firestore, 'enrollmentStats', courseId);
        const statsSnap = await getDoc(statsRef);
        if (statsSnap.exists()) {
          return statsSnap.data()?.activeCount || 0;
        }
      } catch (statsError) {
        // Both failed, return 0
      }
      // Only log error if it's not a permission error (to avoid console spam)
      if (!(error as any)?.code?.includes('permission')) {
        console.error('Error getting active enrollment count:', error);
      }
      return 0;
    }
  };

  /**
   * Get enrollment status for a user in a course
   */
  const getEnrollmentStatus = async (courseId: string): Promise<Enrollment | null> => {
    if (!firestore || !user) return null;

    try {
      const enrollmentsRef = collection(firestore, 'enrollments');
      const statusQuery = query(
        enrollmentsRef,
        where('userId', '==', user.uid),
        where('courseId', '==', courseId)
      );
      const statusSnap = await getDocs(statusQuery);

      if (!statusSnap.empty) {
        const doc = statusSnap.docs[0];
        return { id: doc.id, ...doc.data() } as Enrollment;
      }
      return null;
    } catch (error) {
      console.error('Error getting enrollment status:', error);
      return null;
    }
  };

  /**
   * Update enrollment status
   */
  const updateEnrollmentStatus = async (courseId: string, status: 'active' | 'completed' | 'dropped') => {
    if (!firestore || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in.",
      });
      return false;
    }

    try {
      const enrollmentsRef = collection(firestore, 'enrollments');
      const statusQuery = query(
        enrollmentsRef,
        where('userId', '==', user.uid),
        where('courseId', '==', courseId)
      );
      const statusSnap = await getDocs(statusQuery);

      if (!statusSnap.empty) {
        const enrollmentDoc = statusSnap.docs[0];
        await updateDoc(doc(firestore, 'enrollments', enrollmentDoc.id), {
          status: status
        });

        toast({
          title: "Status Updated",
          description: `Enrollment status updated to ${status}.`,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating enrollment:', error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update enrollment status.",
      });
      return false;
    }
  };

  /**
   * Unenroll from a course
   */
  const unenrollCourse = async (courseId: string) => {
    if (!firestore || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in.",
      });
      return false;
    }

    try {
      const enrollmentsRef = collection(firestore, 'enrollments');
      const enrollQuery = query(
        enrollmentsRef,
        where('userId', '==', user.uid),
        where('courseId', '==', courseId)
      );
      const enrollSnap = await getDocs(enrollQuery);

      if (!enrollSnap.empty) {
        const enrollmentDoc = enrollSnap.docs[0];
        await deleteDoc(doc(firestore, 'enrollments', enrollmentDoc.id));

        toast({
          title: "Unenrolled",
          description: "You have been unenrolled from the course.",
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error unenrolling:', error);
      toast({
        variant: "destructive",
        title: "Unenroll Failed",
        description: "Could not unenroll from the course.",
      });
      return false;
    }
  };

  /**
   * Get user's progress in a course
   */
  const getUserProgress = async (courseId: string): Promise<UserProgress | null> => {
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
        return { ...doc.data() } as UserProgress;
      }
      return null;
    } catch (error) {
      console.error('Error getting user progress:', error);
      return null;
    }
  };

  /**
   * Check if user is eligible to review (enrolled + completed 50% or more)
   */
  const isEligibleToReview = async (courseId: string, minCompletionPercentage: number = 50): Promise<boolean> => {
    if (!firestore || !user) return false;

    try {
      // Check enrollment
      const enrolled = await isEnrolled(courseId);
      if (!enrolled) return false;

      // Check progress
      const progress = await getUserProgress(courseId);
      if (!progress) return false;

      // Check if completed at least minCompletionPercentage
      return progress.percentage >= minCompletionPercentage;
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      return false;
    }
  };

  return {
    enrollCourse,
    isEnrolled,
    getEnrollmentCount,
    getActiveEnrollmentCount,
    getEnrollmentStatus,
    updateEnrollmentStatus,
    unenrollCourse,
    getUserProgress,
    isEligibleToReview,
  };
}
