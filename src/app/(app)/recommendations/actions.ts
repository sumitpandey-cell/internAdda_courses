"use server";

import {
  getPersonalizedCourseRecommendations,
  type PersonalizedCourseRecommendationsInput,
} from "@/ai/flows/personalized-course-recommendations";

export async function getRecommendations(
  input: PersonalizedCourseRecommendationsInput
): Promise<string[]> {
  try {
    const result = await getPersonalizedCourseRecommendations(input);
    return result.courseRecommendations;
  } catch (error) {
    console.error("Error getting recommendations:", error);
    // In case of an AI error, return an empty array or handle it gracefully.
    return [];
  }
}
