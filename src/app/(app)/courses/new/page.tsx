'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useFirebase, addDocumentNonBlocking, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, PlusCircle, Trash2, ShieldAlert } from 'lucide-react';
import type { UserProfile } from '@/lib/data-types';

const lessonSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  type: z.enum(['video', 'text']),
  content: z.string().min(1, 'Content is required.'),
  duration: z.coerce.number().min(1, 'Duration must be at least 1 minute.'),
});

const courseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  description: z.string().min(20, 'Description must be at least 20 characters.'),
  category: z.string().min(1, 'Category is required.'),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  tags: z.string().min(1, 'Please add at least one tag.'),
  thumbnail: z.string().url('Please enter a valid image URL.'),
  lessons: z.array(lessonSchema).min(1, 'Please add at least one lesson.'),
});

type CourseFormValues = z.infer<typeof courseSchema>;

export default function NewCoursePage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { firestore, user } = useFirebase();

  const userProfileRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      difficulty: 'Beginner',
      tags: '',
      thumbnail: '',
      lessons: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lessons',
  });

  useEffect(() => {
    // Redirect if user is loaded and is not an instructor/admin
    if (!isProfileLoading && userProfile && userProfile.role === 'Student') {
      router.replace('/courses');
    }
  }, [userProfile, isProfileLoading, router]);

  const onSubmit = async (data: CourseFormValues) => {
    if (!firestore || !user || userProfile?.role === 'Student') return;
    setIsLoading(true);

    try {
      const courseCollectionRef = collection(firestore, 'courses');
      const courseRef = doc(courseCollectionRef);
      const courseId = courseRef.id;

      const newCourse = {
        id: courseId,
        title: data.title,
        description: data.description,
        category: data.category,
        difficulty: data.difficulty,
        tags: data.tags.split(',').map(tag => tag.trim()),
        thumbnail: data.thumbnail,
        instructorId: user.uid,
        instructor: user.displayName || 'Anonymous', // Denormalize instructor name
      };
      
      // Use non-blocking write for the main document
      // We are using setDoc here with the generated ref to ensure the ID is set correctly.
      await setDoc(courseRef, newCourse);
      
      // 2. Add each lesson to the subcollection
      for (let i = 0; i < data.lessons.length; i++) {
        const lesson = data.lessons[i];
        const lessonCollectionRef = collection(firestore, `courses/${courseId}/lessons`);
        const lessonRef = doc(lessonCollectionRef);
        const newLesson = {
          id: lessonRef.id,
          courseId: courseId,
          title: lesson.title,
          type: lesson.type,
          content: lesson.content,
          duration: lesson.duration,
          order: i + 1,
        };
        // Also non-blocking, but we can await them inside a loop if we want to ensure order.
        // For simplicity, we fire and forget.
        addDocumentNonBlocking(lessonCollectionRef, newLesson);
      }

      router.push(`/courses/${courseId}`);
    } catch (error) {
      console.error('Error creating course:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isProfileLoading) {
     return (
        <div className="flex justify-center items-center h-96">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
     )
  }
  
  if (userProfile?.role === 'Student') {
      return (
          <div className="max-w-4xl mx-auto">
              <Card className="mt-10 border-destructive">
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-destructive">
                          <ShieldAlert />
                          Access Denied
                      </CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p>You do not have permission to create courses. This area is for instructors only.</p>
                      <Button onClick={() => router.push('/courses')} className="mt-4">
                          Back to Courses
                      </Button>
                  </CardContent>
              </Card>
          </div>
      )
  }


  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Course</CardTitle>
          <CardDescription>Fill out the details below to create a new course. You must add at least one lesson.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Course Details */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Introduction to React" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe what students will learn in this course." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Web Development" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Beginner">Beginner</SelectItem>
                          <SelectItem value="Intermediate">Intermediate</SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

               <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., react, javascript, frontend" {...field} />
                    </FormControl>
                    <FormDescription>
                      Comma-separated list of tags.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="thumbnail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thumbnail URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.png" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Lessons Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Lessons</h3>
                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4 bg-muted/50 relative">
                    <div className="space-y-4">
                       <FormField
                        control={form.control}
                        name={`lessons.${index}.title`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lesson {index + 1} Title</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name={`lessons.${index}.type`}
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select type"/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="video">Video</SelectItem>
                                        <SelectItem value="text">Text</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`lessons.${index}.duration`}
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Duration (min)</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                      </div>
                       <FormField
                        control={form.control}
                        name={`lessons.${index}.content`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content</FormLabel>
                            <FormControl>
                              <Textarea placeholder="YouTube Video ID or Markdown content" {...field} />
                            </FormControl>
                            <FormDescription>
                                {form.watch(`lessons.${index}.type`) === 'video' ? 'Enter the YouTube Video ID.' : 'Enter text content using Markdown.'}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => remove(index)}
                        className="absolute top-2 right-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
                 <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ title: '', type: 'video', content: '', duration: 10 })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Lesson
                </Button>
              </div>

              <Button type="submit" disabled={isLoading} size="lg">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Course
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
