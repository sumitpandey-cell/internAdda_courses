'use server';

import {
  getPersonalizedCourseRecommendations,
  type PersonalizedCourseRecommendationsInput,
} from '@/ai/flows/personalized-course-recommendations';
import { collection, getDocs, query } from 'firebase/firestore';
import { getSdks } from '@/firebase';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import type { Course } from '@/lib/data-types';

// Server-side Firebase initialization
function initializeFirebaseServer() {
  if (getApps().length > 0) {
    return getSdks(getApps()[0]);
  }
  const firebaseApp = initializeApp(firebaseConfig);
  return getSdks(firebaseApp);
}


export async function getRecommendations(
  input: Omit<PersonalizedCourseRecommendationsInput, 'allCourses'>
): Promise<string[]> {
  try {
    const { firestore } = initializeFirebaseServer();
    
    // Fetch all courses to give the AI a list of possibilities
    const coursesSnapshot = await getDocs(collection(firestore, 'courses'));
    const allCourses = coursesSnapshot.docs.map(doc => doc.data() as Course);

    if (allCourses.length === 0) {
      console.log("No courses found in the database.");
      return [];
    }
    
    const allCoursesInfo = allCourses.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description
    }));
    
    const result = await getPersonalizedCourseRecommendations({ ...input, allCourses: allCoursesInfo });
    
    if (!result || !result.courseRecommendations) {
        console.error("AI did not return valid recommendations.");
        return [];
    }
    
    // The validation is now handled inside the flow, but we can double-check here.
    const allCourseIds = allCourses.map(c => c.id);
    const validRecommendations = result.courseRecommendations.filter(id => allCourseIds.includes(id));

    return validRecommendations;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    // In case of an AI error, return an empty array or handle it gracefully.
    return [];
  }
}
