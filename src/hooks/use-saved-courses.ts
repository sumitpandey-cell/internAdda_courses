import { useFirebase } from '@/firebase';
import { collection, query, where, addDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { useState, useCallback } from 'react';
import { useToast } from './use-toast';

export function useSavedCourses() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const isSaved = useCallback(
    async (courseId: string): Promise<boolean> => {
      if (!firestore || !user) return false;

      try {
        const savedCoursesQuery = query(
          collection(firestore, 'savedCourses'),
          where('userId', '==', user.uid),
          where('courseId', '==', courseId)
        );
        const snapshot = await getDocs(savedCoursesQuery);
        return !snapshot.empty;
      } catch (error) {
        console.error('Error checking if course is saved:', error);
        return false;
      }
    },
    [firestore, user]
  );

  const saveCourse = useCallback(
    async (courseId: string) => {
      if (!firestore || !user) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Please log in to save courses.',
        });
        return false;
      }

      setIsLoading(true);
      try {
        // Check if already saved
        const alreadySaved = await isSaved(courseId);
        if (alreadySaved) {
          toast({
            title: 'Already Saved',
            description: 'This course is already in your saved list.',
          });
          setIsLoading(false);
          return false;
        }

        // Add to saved courses
        await addDoc(collection(firestore, 'savedCourses'), {
          userId: user.uid,
          courseId,
          savedAt: new Date(),
        });

        toast({
          title: 'Saved!',
          description: 'Course added to your saved list.',
        });
        return true;
      } catch (error) {
        console.error('Error saving course:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to save course. Please try again.',
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [firestore, user, isSaved, toast]
  );

  const unsaveCourse = useCallback(
    async (courseId: string) => {
      if (!firestore || !user) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Please log in to unsave courses.',
        });
        return false;
      }

      setIsLoading(true);
      try {
        // Find the saved course record
        const savedCoursesQuery = query(
          collection(firestore, 'savedCourses'),
          where('userId', '==', user.uid),
          where('courseId', '==', courseId)
        );
        const snapshot = await getDocs(savedCoursesQuery);

        if (!snapshot.empty) {
          // Delete the saved course
          await deleteDoc(snapshot.docs[0].ref);

          toast({
            title: 'Removed',
            description: 'Course removed from your saved list.',
          });
          return true;
        } else {
          toast({
            title: 'Not Found',
            description: 'This course is not in your saved list.',
          });
          return false;
        }
      } catch (error) {
        console.error('Error unsaving course:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to remove course. Please try again.',
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [firestore, user, toast]
  );

  const toggleSave = useCallback(
    async (courseId: string, isSavedState: boolean) => {
      if (isSavedState) {
        return await unsaveCourse(courseId);
      } else {
        return await saveCourse(courseId);
      }
    },
    [saveCourse, unsaveCourse]
  );

  return {
    saveCourse,
    unsaveCourse,
    toggleSave,
    isSaved,
    isLoading,
  };
}
