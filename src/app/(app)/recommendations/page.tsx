"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getRecommendations } from "./actions";
import { mainUser, courses, type Course } from "@/lib/data";
import { CourseCard } from "@/components/courses/CourseCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bot, Loader2 } from "lucide-react";

const recommendationsSchema = z.object({
  preferences: z.string().min(10, "Please describe your interests in a bit more detail."),
});

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof recommendationsSchema>>({
    resolver: zodResolver(recommendationsSchema),
    defaultValues: {
      preferences: "",
    },
  });

  async function onSubmit(values: z.infer<typeof recommendationsSchema>) {
    setIsLoading(true);
    setRecommendations([]);

    const recommendedCourseIds = await getRecommendations({
      userId: mainUser.id,
      enrollmentHistory: mainUser.enrolledCourses,
      preferences: values.preferences,
    });
    
    const recommendedCourses = courses.filter(course => recommendedCourseIds.includes(course.id));
    setRecommendations(recommendedCourses);
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

      {isLoading && (
        <div className="text-center py-12">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">Our AI is thinking...</p>
        </div>
      )}

      {recommendations.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold font-headline mb-4">Here are some courses you might like:</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
