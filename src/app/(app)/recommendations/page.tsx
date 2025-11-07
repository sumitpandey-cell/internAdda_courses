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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Bot, Loader2 } from 'lucide-react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, documentId } from 'firebase/firestore';
import type { Course, UserProgress } from '@/lib/data-types';
import { Skeleton } from '@/components/ui/skeleton';

const recommendationsSchema = z.object({
  preferences: z.string().min(10, 'Please describe your interests in a bit more detail.'),
});

export default function RecommendationsPage() {
  const [recommendedCourseIds, setRecommendedCourseIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
    setIsLoading(true);
    setRecommendedCourseIds([]);

    const enrolledCourseIds = userProgress?.map(p => p.courseId) || [];

    const ids = await getRecommendations({
      userId: user.uid,
      enrollmentHistory: enrolledCourseIds,
      preferences: values.preferences,
    });
    
    setRecommendedCourseIds(ids);
    setIsLoading(false);
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot />
            AI-Powered Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Tell us what you're interested in learning, and our AI will suggest courses tailored just for you. Consider mentioning your career goals, topics you enjoy, or skills you want to develop.
          </p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="preferences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>My learning preferences</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., 'I'm a frontend developer looking to learn backend technologies, especially Node.js and databases.' or 'I want to get into data science and machine learning.'"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Get Recommendations
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {(isLoading || recommendationsLoading) && (
        <div className="text-center py-12">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">Our AI is thinking...</p>
        </div>
      )}

      {!isLoading && !recommendationsLoading && recommendations && recommendations.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold font-headline mb-4">Here are some courses you might like:</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      )}
       {!isLoading && !recommendationsLoading && recommendedCourseIds.length > 0 && recommendations?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            The AI couldn't find any recommendations based on your preferences. Try being more specific!
          </div>
        )}
    </div>
  );
}
