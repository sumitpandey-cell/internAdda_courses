'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getRecommendations } from './actions';
import { CourseCard } from '@/components/courses/CourseCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Bot, Loader2, Sparkles } from 'lucide-react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, documentId } from 'firebase/firestore';
import type { Course, UserProgress } from '@/lib/data-types';
import { Skeleton } from '@/components/ui/skeleton';

const recommendationsSchema = z.object({
  preferences: z.string().min(10, 'Please describe your interests in a bit more detail.'),
});

export default function RecommendationsPage() {
  const [recommendedCourseIds, setRecommendedCourseIds] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { firestore, user } = useFirebase();

  const progressQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, `users/${user.uid}/progress`)) : null),
    [firestore, user]
  );
  const { data: userProgress } = useCollection<UserProgress>(progressQuery);

  const recommendationsQuery = useMemoFirebase(
    () =>
      firestore && recommendedCourseIds.length > 0
        ? query(collection(firestore, 'courses'), where(documentId(), 'in', recommendedCourseIds))
        : null,
    [firestore, recommendedCourseIds.join(',')]
  );

  const { data: recommendations, isLoading: recommendationsLoading } = useCollection<Course>(recommendationsQuery);


  const form = useForm<z.infer<typeof recommendationsSchema>>({
    resolver: zodResolver(recommendationsSchema),
    defaultValues: {
      preferences: '',
    },
  });

  async function onSubmit(values: z.infer<typeof recommendationsSchema>) {
    if (!user) return;
    setIsAiLoading(true);
    setHasSearched(true);
    setRecommendedCourseIds([]); // Reset previous recommendations immediately

    const enrolledCourseIds = userProgress?.map(p => p.courseId) || [];

    const ids = await getRecommendations({
      userId: user.uid,
      enrollmentHistory: enrolledCourseIds,
      preferences: values.preferences,
    });
    
    setRecommendedCourseIds(ids);
    setIsAiLoading(false);
  }
  
  const isLoading = isAiLoading || recommendationsLoading;

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30">
          <div className="flex items-center gap-3">
             <div className="flex-shrink-0 bg-primary/10 text-primary p-3 rounded-full">
                <Bot className="h-6 w-6" />
             </div>
             <div>
                <CardTitle>AI-Powered Recommendations</CardTitle>
                <CardDescription className="mt-1">
                    Tell us what you're interested in learning, and our AI will suggest courses tailored just for you.
                </CardDescription>
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="preferences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>My learning goals and interests</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., 'I'm a frontend developer looking to learn backend technologies, especially Node.js and databases.' or 'I want to get into data science and machine learning.'"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                     <FormDescription>
                      Consider mentioning your career goals, topics you enjoy, or skills you want to develop.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isAiLoading}>
                {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate My Recommendations
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {isLoading && (
         <div>
            <h2 className="text-2xl font-bold font-headline mb-4">Our AI is thinking...</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
            </div>
        </div>
      )}

      {!isLoading && hasSearched && (
        <div>
          {recommendations && recommendations.length > 0 ? (
            <div>
              <h2 className="text-2xl font-bold font-headline mb-4">Here are some courses you might like:</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {recommendations.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-muted/50 rounded-lg">
                <div className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Recommendations Found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    The AI couldn't find any recommendations based on your preferences.
                </p>
                 <p className="text-sm text-muted-foreground">
                    Try being more specific or broader in your description.
                </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


function CardSkeleton() {
  return (
    <div className="space-y-4 rounded-xl border p-4">
      <Skeleton className="h-40 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-8 w-full mt-4" />
      </div>
    </div>
  );
}
