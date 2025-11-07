'use server';

/**
 * @fileOverview A conversational AI agent for recommending courses.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Course } from '@/lib/data-types';
import wav from 'wav';

// Define schemas for the flow
const CourseInfoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  difficulty: z.string(),
  tags: z.array(z.string()),
});

const CourseChatRequestSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string()
  })),
  message: z.string().describe('The latest message from the user.'),
  availableCourses: z.array(CourseInfoSchema).describe("List of all available courses."),
});
export type CourseChatRequest = z.infer<typeof CourseChatRequestSchema>;

const CourseChatResponseSchema = z.object({
  response: z.string().describe("A conversational, helpful response to the user's message."),
  recommendedCourseIds: z.array(z.string()).optional().describe("An array of up to 3 course IDs that are relevant to the user's request. Only recommend courses if the user is asking for them."),
});
export type CourseChatResponse = z.infer<typeof CourseChatResponseSchema>;


// Main exported function to be called from server actions
export async function getCourseRecommendations(
  input: CourseChatRequest
): Promise<CourseChatResponse & { audioBase64?: string }> {
  try {
    console.log("Calling courseRecommendationFlow with input:", JSON.stringify(input, null, 2));
    const result = await courseRecommendationFlow(input);
    
    if (!result.response) {
      console.log("AI did not return a response.", result);
      return { ...result, response: "I'm sorry, I could not generate a response." };
    }

    console.log("AI text response received:", result.response);

    // Generate audio from the text response
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: result.response,
    });

    if (!media) {
      console.log("No audio generated.");
      return result; // Return text response if audio generation fails
    }

    console.log("Audio generated successfully.");

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const audioBase64 = await toWav(audioBuffer);
    
    return { ...result, audioBase64 };
  } catch (e: any) {
    console.error("Error in getCourseRecommendations:", e);
    // Return a user-friendly error response, but do not re-throw
    return {
      response: "I'm sorry, I encountered an internal error. Please try again later.",
      recommendedCourseIds: []
    };
  }
}

// Define the Genkit flow
const courseRecommendationFlow = ai.defineFlow(
  {
    name: 'courseRecommendationFlow',
    inputSchema: CourseChatRequestSchema,
    outputSchema: CourseChatResponseSchema,
  },
  async (input) => {
    try {
      const { output } = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt: `You are a friendly and encouraging AI career guider on the CourseFlow platform. Your main purpose is to have a natural, supportive conversation with students about their career aspirations and learning paths.

- Your primary role is to be a guide and a mentor, not just a course recommender. Engage in a normal, free-flowing conversation.
- DO NOT recommend any courses unless the student explicitly asks for course suggestions or expresses a clear intent to learn a specific topic.
- If the student asks for recommendations, analyze their career goals and conversation history to suggest 1-3 highly relevant courses from the provided list.
- When you do recommend courses, explain how each one aligns with their stated goals.
- Your final output must be a JSON object with a 'response' and an optional 'recommendedCourseIds' field. Only populate 'recommendedCourseIds' if you are actively recommending courses in your response.

CONVERSATION HISTORY:
{{#each history}}
- {{role}}: {{content}}
{{/each}}

LATEST USER MESSAGE:
"{{{message}}}"

AVAILABLE COURSES:
{{#each availableCourses}}
- ID: {{{this.id}}}, Title: {{{this.title}}}, Description: {{{this.description}}}
{{/each}}
`,
        config: {
          generationConfig: {
            responseMimeType: "application/json",
          },
        },
        output: {
            schema: CourseChatResponseSchema,
        },
        context: {
          message: input.message,
          history: input.history,
          availableCourses: input.availableCourses,
        },
      });

      if (!output) {
        console.error('AI generation returned no output.');
        return { response: "I'm sorry, I had trouble processing that request. Please try again." };
      }

      console.log('AI output received:', JSON.stringify(output, null, 2));

      // Safeguard to ensure IDs are valid
      if (output.recommendedCourseIds) {
        const allCourseIds = input.availableCourses.map((c) => c.id);
        output.recommendedCourseIds = output.recommendedCourseIds.filter((id) =>
          allCourseIds.includes(id)
        );
      }

      return output;
    } catch (e) {
      console.error('Error within courseRecommendationFlow:', e);
      // We throw the error here so it can be caught by the calling function `getCourseRecommendations`
      throw e;
    }
  }
);


// Helper function to convert PCM audio buffer to WAV base64
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
