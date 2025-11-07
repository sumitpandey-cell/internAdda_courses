'use server';

/**
 * @fileOverview A conversational AI agent for recommending courses.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  getFirestore,
  collection,
  getDocs,
  query,
} from 'firebase/firestore';
import { getApps, initializeApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
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
  const result = await courseRecommendationFlow(input);
  
  if (!result.response) {
      return { ...result, response: "I'm sorry, I could not generate a response." };
  }

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
    return result; // Return text response if audio generation fails
  }

  const audioBuffer = Buffer.from(
    media.url.substring(media.url.indexOf(',') + 1),
    'base64'
  );

  const audioBase64 = await toWav(audioBuffer);
  
  return { ...result, audioBase64 };
}

// Define the Genkit flow
const courseRecommendationFlow = ai.defineFlow(
  {
    name: 'courseRecommendationFlow',
    inputSchema: CourseChatRequestSchema,
    outputSchema: CourseChatResponseSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `You are 'CourseBot', a friendly and helpful AI course advisor for the CourseFlow platform. Your goal is to have a natural conversation with the user, understand their learning goals, and recommend relevant courses when appropriate.

- Be conversational and engaging.
- If the user asks for recommendations, suggest 1-3 courses from the provided list.
- Base your recommendations on the user's message and the conversation history.
- When you recommend courses, briefly explain WHY you are recommending each one.
- Your final output must be a JSON object with a 'response' and an optional 'recommendedCourseIds' field.

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
          // Instruct the model to always return JSON
          response: {
              format: 'json',
              schema: CourseChatResponseSchema
          }
      },
      context: {
        message: input.message,
        history: input.history,
        availableCourses: input.availableCourses
      },
    });

    if (!output) {
      return { response: "I'm sorry, I had trouble processing that request. Please try again." };
    }

    // Safeguard to ensure IDs are valid
    if (output.recommendedCourseIds) {
        const allCourseIds = input.availableCourses.map(c => c.id);
        output.recommendedCourseIds = output.recommendedCourseIds.filter(id => allCourseIds.includes(id));
    }

    return output;
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
