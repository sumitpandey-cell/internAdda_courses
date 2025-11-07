'use server';

import {
  getPersonalizedCourseRecommendations,
  type PersonalizedCourseRecommendationsInput,
} from '@/ai/flows/personalized-course-recommendations';
import { collection, getDocs, query, where, getFirestore } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export async function getRecommendations(
  input: PersonalizedCourseRecommendationsInput
): Promise<string[]> {
  try {
    const { firestore } = initializeFirebase();
    
    // Fetch all course IDs to give the AI a list of possibilities
    const coursesSnapshot = await getDocs(collection(firestore, 'courses'));
    const allCourseIds = coursesSnapshot.docs.map(doc => doc.id);

    const result = await getPersonalizedCourseRecommendations({ ...input, allCourseIds });
    
    // Validate recommendations against existing courses
    const validRecommendations = result.courseRecommendations.filter(id => allCourseIds.includes(id));

    return validRecommendations;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    // In case of an AI error, return an empty array or handle it gracefully.
    return [];
  }
}
