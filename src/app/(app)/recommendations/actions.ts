'use server';

import {
  getCourseRecommendations,
  type CourseChatRequest
} from '@/ai/flows/course-chat-flow';
import type { Course, ChatMessage } from '@/lib/data-types';

export async function getCourseChatResponse(
  message: string,
  history: Array<{role: 'user' | 'model', content: string}>,
  allCourses: Course[] // Accept the course list as an argument
): Promise<ChatMessage | null> {
  try {
    if (allCourses.length === 0) {
      console.log("No courses found to recommend.");
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
