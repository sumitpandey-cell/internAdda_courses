
'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useFirebase, addDocumentNonBlocking, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

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
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const lessonSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  type: z.enum(['video', 'text']),
  content: z.string().min(1, 'Content is required.'),
  duration: z.coerce.number().min(1, 'Duration must be at least 1 minute.'),
  transcript: z.string().optional(),
});

const questionSchema = z.object({
  text: z.string().min(1, 'Question text is required.'),
  type: z.enum(['mcq', 'text']),
  options: z.string().optional(), // Comma-separated for MCQ
  correctAnswer: z.string().min(1, 'Correct answer is required.'),
});

const courseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  description: z.string().min(20, 'Description must be at least 20 characters.'),
  category: z.string().min(1, 'Category is required.'),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  whatYouWillLearn: z.string().min(1, 'Please list at least one topic.'),
  prerequisites: z.string().min(1, 'Prerequisites are required.'),
  instructorBio: z.string().min(20, 'Instructor bio must be at least 20 characters.'),
  tags: z.string().optional(),
  thumbnail: z.string().url('Please enter a valid image URL.'),
  passingScore: z.coerce.number().min(0).max(100, 'Passing score must be between 0 and 100.'),
  lessons: z.array(lessonSchema).min(1, 'Please add at least one lesson.'),
  questions: z.array(questionSchema).min(1, 'Please add at least one test question.'),
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
      whatYouWillLearn: '',
      prerequisites: 'No prior experience required. This course is designed for absolute beginners!',
      instructorBio: 'A passionate educator dedicated to making technology accessible to everyone.',
      tags: '',
      thumbnail: '',
      passingScore: 70,
      lessons: [],
      questions: [],
    },
  });

  const { fields: lessonFields, append: appendLesson, remove: removeLesson } = useFieldArray({
    control: form.control,
    name: 'lessons',
  });
  
  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control: form.control,
    name: 'questions',
  });

  useEffect(() => {
    // Redirect if user is loaded and is not an instructor/admin
    if (!isProfileLoading && userProfile && userProfile.role === 'Student') {
      router.replace('/');
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
        whatYouWillLearn: data.whatYouWillLearn.split(',').map(item => item.trim()),
        prerequisites: data.prerequisites,
        instructorBio: data.instructorBio,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
        thumbnail: data.thumbnail,
        instructorId: user.uid,
        instructor: user.displayName || 'Anonymous', // Denormalize instructor name
        passingScore: data.passingScore,
      };
      
      await setDoc(courseRef, newCourse);
      
      // Save lessons
      for (let i = 0; i < data.lessons.length; i++) {
        const lesson = data.lessons[i];
        const lessonCollectionRef = collection(firestore, `courses/${courseId}/lessons`);
        const lessonRef = doc(lessonCollectionRef);
        
        await setDoc(lessonRef, {
          id: lessonRef.id, courseId: courseId, title: lesson.title, type: lesson.type,
          content: lesson.content, duration: lesson.duration, order: i + 1, transcript: lesson.transcript,
        });
      }
      
      // Save questions
      for (let i = 0; i < data.questions.length; i++) {
        const question = data.questions[i];
        const questionCollectionRef = collection(firestore, `courses/${courseId}/questions`);
        const questionRef = doc(questionCollectionRef);
        
        await setDoc(questionRef, {
          id: questionRef.id, courseId: courseId, text: question.text, type: question.type,
          options: question.type === 'mcq' ? question.options?.split(',').map(o => o.trim()) : [],
          correctAnswer: question.correctAnswer, order: i + 1,
        });
      }


      router.push(`/courses/${courseId}`);
    } catch (error) {
      console.error('Error creating course:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const Content = () => {
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
                        <Button onClick={() => router.push('/')} className="mt-4">
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
            <CardDescription>Fill out the details below to create a new course. You must add at least one lesson and one test question.</CardDescription>
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
                      <FormLabel>Course Overview</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe what students will learn in this course." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="whatYouWillLearn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What You Will Learn</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Build dynamic web apps, Master React Hooks, Manage state with Redux" {...field} />
                      </FormControl>
                       <FormDescription>
                        Comma-separated list of key topics or skills.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="prerequisites"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prerequisites</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., Basic understanding of HTML, CSS, and JavaScript." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="instructorBio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructor Bio</FormLabel>
                      <FormControl>
                        <Textarea placeholder="A short bio about the instructor." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                  <FormField
                    control={form.control}
                    name="passingScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passing Score (%)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 70" {...field} />
                        </FormControl>
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
                      <FormLabel>Tags (for filtering)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., react, javascript, frontend" {...field} />
                      </FormControl>
                      <FormDescription>
                        Comma-separated list of tags for searching and filtering.
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
                  {lessonFields.map((field, index) => (
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
                         <FormField
                          control={form.control}
                          name={`lessons.${index}.transcript`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Transcript</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Enter the lesson transcript here..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeLesson(index)}
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
                    onClick={() => appendLesson({ title: '', type: 'video', content: '', duration: 10, transcript: '' })}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Lesson
                  </Button>
                </div>
                
                {/* Questions Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Final Test Questions</h3>
                  {questionFields.map((field, index) => (
                    <Card key={field.id} className="p-4 bg-muted/50 relative">
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name={`questions.${index}.text`}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Question {index + 1}</FormLabel>
                                    <FormControl><Textarea {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`questions.${index}.type`}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Question Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select type"/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="mcq">Multiple Choice</SelectItem>
                                        <SelectItem value="text">Text Answer</SelectItem>
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            {form.watch(`questions.${index}.type`) === 'mcq' && (
                                <FormField
                                control={form.control}
                                name={`questions.${index}.options`}
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Options (comma-separated)</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            )}
                             <FormField
                                control={form.control}
                                name={`questions.${index}.correctAnswer`}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Correct Answer</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormDescription>For MCQs, this must exactly match one of the options.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeQuestion(index)}
                          className="absolute top-2 right-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                    </Card>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendQuestion({ text: '', type: 'mcq', correctAnswer: ''})}
                    >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Question
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

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-8">
        <Content />
      </main>
      <Footer />
    </div>
  );
}

    