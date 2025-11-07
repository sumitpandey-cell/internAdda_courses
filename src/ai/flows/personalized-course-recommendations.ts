'use server';

/**
 * @fileOverview Provides personalized course recommendations based on user enrollment history and preferences.
 *
 * - getPersonalizedCourseRecommendations - A function that returns personalized course recommendations for a given user.
 * - PersonalizedCourseRecommendationsInput - The input type for the getPersonalizedCourseRecommendations function.
 * - PersonalizedCourseRecommendationsOutput - The return type for the getPersonalizedCourseRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedCourseRecommendationsInputSchema = z.object({
  userId: z.string().describe('The ID of the user to generate recommendations for.'),
  enrollmentHistory: z.array(z.string()).describe('An array of course IDs the user is enrolled in.'),
  preferences: z.string().describe('A string containing the user’s learning preferences.'),
  allCourseIds: z.array(z.string()).describe('A list of all available course IDs for the AI to choose from.'),
});
export type PersonalizedCourseRecommendationsInput = z.infer<typeof PersonalizedCourseRecommendationsInputSchema>;

const PersonalizedCourseRecommendationsOutputSchema = z.object({
  courseRecommendations: z.array(z.string()).describe('An array of 3-5 course IDs recommended for the user.'),
});
export type PersonalizedCourseRecommendationsOutput = z.infer<typeof PersonalizedCourseRecommendationsOutputSchema>;

export async function getPersonalizedCourseRecommendations(
  input: PersonalizedCourseRecommendationsInput
): Promise<PersonalizedCourseRecommendationsOutput> {
  return personalizedCourseRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedCourseRecommendationsPrompt',
  input: {schema: PersonalizedCourseRecommendationsInputSchema},
  output: {schema: PersonalizedCourseRecommendationsOutputSchema},
  prompt: `You are an AI course recommendation system for an online learning platform called CourseFlow. You will provide personalized course recommendations to the user based on their enrollment history and learning preferences.

You should recommend 3 to 5 courses.

User ID: {{{userId}}}
User's Currently Enrolled Course IDs: {{#each enrollmentHistory}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
User's Stated Learning Preferences: {{{preferences}}}

List of All Available Course IDs on the Platform: {{#each allCourseIds}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}


Based on this information, recommend a list of new courses that the user might be interested in.
- DO NOT recommend courses the user is already enrolled in.
- Only return the IDs of the courses from the "List of All Available Course IDs on the Platform".
- Your response should only contain the JSON object with the "courseRecommendations" array.
`,
});

const personalizedCourseRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedCourseRecommendationsFlow',
    inputSchema: PersonalizedCourseRecommendationsInputSchema,
    outputSchema: PersonalizedCourseRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
