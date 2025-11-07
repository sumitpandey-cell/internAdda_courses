'use server';

import {
  getPersonalizedCourseRecommendations,
  type PersonalizedCourseRecommendationsInput,
} from '@/ai/flows/personalized-course-recommendations';
import { collection, getDocs, query } from 'firebase/firestore';
import { getSdks } from '@/firebase';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

// Server-side Firebase initialization
function initializeFirebaseServer() {
  if (getApps().length > 0) {
    return getSdks(getApps()[0]);
  }
  const firebaseApp = initializeApp(firebaseConfig);
  return getSdks(firebaseApp);
}


export async function getRecommendations(
  input: Omit<PersonalizedCourseRecommendationsInput, 'allCourseIds'>
): Promise<string[]> {
  try {
    const { firestore } = initializeFirebaseServer();
    
    // Fetch all course IDs to give the AI a list of possibilities
    const coursesSnapshot = await getDocs(collection(firestore, 'courses'));
    const allCourseIds = coursesSnapshot.docs.map(doc => doc.id);

    if (allCourseIds.length === 0) {
      console.log("No courses found in the database.");
      return [];
    }
    
    const result = await getPersonalizedCourseRecommendations({ ...input, allCourseIds });
    
    if (!result || !result.courseRecommendations) {
        console.error("AI did not return valid recommendations.");
        return [];
    }
    
    // Validate recommendations against existing courses
    const validRecommendations = result.courseRecommendations.filter(id => allCourseIds.includes(id));

    return validRecommendations;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    // In case of an AI error, return an empty array or handle it gracefully.
    return [];
  }
}
