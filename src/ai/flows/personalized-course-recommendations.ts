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

const CourseInfoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
});

const PersonalizedCourseRecommendationsInputSchema = z.object({
  userId: z.string().describe('The ID of the user to generate recommendations for.'),
  enrollmentHistory: z.array(z.string()).describe('An array of course IDs the user is enrolled in.'),
  preferences: z.string().describe('A string containing the user’s learning preferences.'),
  allCourses: z.array(CourseInfoSchema).describe('A list of all available courses for the AI to choose from.'),
});
export type PersonalizedCourseRecommendationsInput = z.infer<typeof PersonalizedCourseRecommendationsInputSchema>;

const PersonalizedCourseRecommendationsOutputSchema = z.object({
  courseRecommendations: z
    .array(z.string())
    .describe('An array of 3-5 course IDs recommended for the user. These IDs must exist in the provided course list.'),
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

List of All Available Courses on the Platform (with ID, title, and description):
{{#each allCourses}}
- ID: {{{this.id}}}, Title: {{{this.title}}}, Description: {{{this.description}}}
{{/each}}


Based on this information, recommend a list of new courses that the user might be interested in.
- DO NOT recommend courses the user is already enrolled in.
- Your response MUST ONLY contain the JSON object with the "courseRecommendations" array.
- The "courseRecommendations" array MUST ONLY contain course IDs from the provided "List of All Available Courses on the Platform".
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
    
    // Add a safeguard to ensure the AI returns a valid object
    if (!output || !Array.isArray(output.courseRecommendations)) {
      return { courseRecommendations: [] };
    }

    // Filter to ensure all recommended IDs actually exist in the input list
    const allCourseIds = input.allCourses.map(c => c.id);
    const validRecommendations = output.courseRecommendations.filter(id => allCourseIds.includes(id));

    return { courseRecommendations: validRecommendations };
  }
);
