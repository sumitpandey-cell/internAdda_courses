'use server';

import {
  getCourseRecommendations,
  type CourseChatRequest
} from '@/ai/flows/course-chat-flow';
import { collection, getDocs, query } from 'firebase/firestore';
import { getSdks } from '@/firebase';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import type { Course, ChatMessage } from '@/lib/data-types';

// Server-side Firebase initialization
function initializeFirebaseServer() {
  if (getApps().length > 0) {
    return getSdks(getApps()[0]);
  }
  const firebaseApp = initializeApp(firebaseConfig);
  return getSdks(firebaseApp);
}


export async function getCourseChatResponse(
  message: string,
  history: Array<{role: 'user' | 'model', content: string}>
): Promise<ChatMessage | null> {
  try {
    const { firestore } = initializeFirebaseServer();
    
    const coursesSnapshot = await getDocs(collection(firestore, 'courses'));
    const allCourses = coursesSnapshot.docs.map(doc => doc.data() as Course);

    if (allCourses.length === 0) {
      console.log("No courses found in the database.");
      return {
        role: 'model',
        content: "I couldn't find any courses in the database to recommend."
      };
    }
    
    const input: CourseChatRequest = {
        history,
        message,
        availableCourses: allCourses,
    }
    
    const result = await getCourseRecommendations(input);
    
    if (!result) {
        console.error("AI did not return a valid response.");
        return {
            role: 'model',
            content: "Sorry, I had trouble processing that request. Please try again."
        }
    }

    return {
        role: 'model',
        content: result.response,
        audioBase64: result.audioBase64,
        recommendedCourseIds: result.recommendedCourseIds,
    }
    
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return {
        role: 'model',
        content: "I'm sorry, I encountered an error while trying to generate a recommendation."
    }
  }
}
