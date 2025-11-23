
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, addDoc } from 'firebase/firestore';
import dynamic from 'next/dynamic';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

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
import { Loader2, PlusCircle, Trash2, ShieldAlert, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile, InstructorProfile } from '@/lib/data-types';
import { Header } from '@/components/layout/Header';
import { ThumbnailUploader } from '@/components/thumbnail-uploader';
import { uploadToCloudinary } from '@/lib/cloudinary-upload';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';

const lessonSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  type: z.enum(['video', 'text']),
  content: z.string().min(1, 'Content is required. For video lessons, please provide the YouTube Video ID.'),
  duration: z.coerce.number().min(1, 'Duration must be at least 1 minute.'),
  transcript: z.string().optional(),
  section: z.string().optional(),
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
  thumbnail: z.string().min(1, 'Thumbnail is required.'),
  passingScore: z.coerce.number().min(0).max(100, 'Passing score must be between 0 and 100.'),
  isFree: z.boolean().default(false),
  price: z.coerce.number().min(0).optional(),
  lessons: z.array(lessonSchema).min(1, 'Please add at least one lesson.'),
  questions: z.array(questionSchema).min(1, 'Please add at least one test question.'),
}).refine((data) => {
  if (!data.isFree && (data.price === undefined || data.price <= 0)) {
    return false;
  }
  return true;
}, {
  message: "Price is required for paid courses and must be greater than 0.",
  path: ["price"],
});


type CourseFormValues = z.infer<typeof courseSchema>;

interface ContentProps {
  form: UseFormReturn<CourseFormValues>;
  onSubmit: (data: CourseFormValues) => void;
  isLoading: boolean;
  isProfileLoading: boolean;
  userProfile: UserProfile | null;
  instructorProfile: InstructorProfile | null;
  lessonFields: any[];
  appendLesson: (lesson: any) => void;
  removeLesson: (index: number) => void;
  questionFields: any[];
  appendQuestion: (question: any) => void;
  removeQuestion: (index: number) => void;
  onThumbnailUpload: (file: Blob, filename: string) => Promise<void>;
  uploadingThumbnail: boolean;
}

const Content = React.memo(function Content({
  form,
  onSubmit,
  isLoading,
  isProfileLoading,
  userProfile,
  instructorProfile,
  lessonFields,
  appendLesson,
  removeLesson,
  questionFields,
  appendQuestion,
  removeQuestion,
  onThumbnailUpload,
  uploadingThumbnail,
}: ContentProps) {
  const router = useRouter();
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

  if (!instructorProfile) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="mt-10 border-amber-500/20 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <ShieldAlert />
              Profile Required
            </CardTitle>
            <CardDescription className="text-amber-800">
              Complete your instructor profile before creating courses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-amber-900">
              To maintain course quality and build student trust, we require all instructors to complete their profile first. This includes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-amber-800 ml-2">
              <li>Profile photo and bio</li>
              <li>Expertise and specialization</li>
              <li>Years of experience</li>
              <li>Qualifications</li>
              <li>Social media links (optional)</li>
            </ul>
            <div className="pt-4 flex gap-3">
              <Button asChild>
                <Link href="/instructor-profile">
                  <User className="mr-2 h-4 w-4" />
                  Complete Profile
                </Link>
              </Button>
              <Button variant="outline" onClick={() => router.push('/instructor')}>
                Back to Dashboard
              </Button>
            </div>
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

              {/* Pricing Section */}
              <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-medium">Pricing</h3>
                <FormField
                  control={form.control}
                  name="isFree"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-white">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Free Course</FormLabel>
                        <FormDescription>
                          Check this if you want to offer this course for free.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {!form.watch('isFree') && (
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (₹)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 499" {...field} />
                        </FormControl>
                        <FormDescription>
                          Set the price for your course.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={form.control}
                name="thumbnail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Thumbnail</FormLabel>
                    <FormControl>
                      <ThumbnailUploader
                        value={field.value}
                        onChange={field.onChange}
                        onFileReady={onThumbnailUpload}
                        disabled={isLoading || uploadingThumbnail}
                      />
                    </FormControl>
                    <FormDescription>
                      Upload an image (min 400px wide, max 3MB). Will be optimized to ≤120KB.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Lessons Section - Grouped by Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Course Curriculum</h3>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const sectionName = prompt("Enter section name (e.g., 'Getting Started', 'Advanced Topics'):");
                        if (sectionName && sectionName.trim()) {
                          appendLesson({
                            title: '',
                            type: 'video',
                            content: '',
                            duration: 10,
                            transcript: '',
                            section: sectionName.trim()
                          });
                        }
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Create New Section
                    </Button>
                  </div>
                </div>

                {(() => {
                  // Group lessons by section
                  const grouped = lessonFields.reduce((acc: Record<string, { indices: number[], lessons: any[] }>, field, index) => {
                    const sectionName = form.watch(`lessons.${index}.section`) || 'Unsectioned Lessons';
                    if (!acc[sectionName]) {
                      acc[sectionName] = { indices: [], lessons: [] };
                    }
                    acc[sectionName].indices.push(index);
                    acc[sectionName].lessons.push(field);
                    return acc;
                  }, {});

                  return (
                    <Accordion type="multiple" defaultValue={Object.keys(grouped)} className="space-y-4">
                      {Object.entries(grouped).map(([sectionName, { indices, lessons: sectionLessons }]) => (
                        <AccordionItem key={sectionName} value={sectionName} className="border-2 border-gray-200 rounded-xl overflow-hidden">
                          <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 hover:no-underline">
                            <div className="flex items-center gap-3 w-full">
                              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 text-white font-bold text-sm">
                                {sectionLessons.length}
                              </div>
                              <div className="flex-1 text-left">
                                <h4 className="font-semibold text-base">{sectionName}</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {sectionLessons.length} {sectionLessons.length === 1 ? 'lesson' : 'lessons'}
                                </p>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pb-6 pt-2">
                            <div className="space-y-4">
                              {indices.map((index, idx) => {
                                const lessonTitle = form.watch(`lessons.${index}.title`) || `Untitled Lesson`;
                                const lessonType = form.watch(`lessons.${index}.type`) || 'video';

                                return (
                                  <Accordion key={lessonFields[index].id} type="single" collapsible className="border-2 border-gray-100 rounded-lg">
                                    <AccordionItem value={`lesson-${index}`} className="border-none">
                                      <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline">
                                        <div className="flex items-center gap-3 w-full">
                                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                            {idx + 1}
                                          </span>
                                          <div className="flex-1 text-left">
                                            <p className="font-semibold text-sm">{lessonTitle}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                              {lessonType === 'video' ? '📹 Video' : '📄 Text'} Lesson
                                              {sectionName !== 'Unsectioned Lessons' && ` • in ${sectionName}`}
                                            </p>
                                          </div>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              removeLesson(index);
                                            }}
                                            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent className="px-4 pb-4">
                                        <Card className="p-6 bg-card border shadow-sm relative overflow-hidden mt-2">
                                          <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                                          <div className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                              <FormField
                                                control={form.control}
                                                name={`lessons.${index}.title`}
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel>Lesson Title</FormLabel>
                                                    <FormControl>
                                                      <Input placeholder="e.g., Introduction to Components" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                              <FormField
                                                control={form.control}
                                                name={`lessons.${index}.section`}
                                                render={({ field }) => (
                                                  <FormItem>
                                                    <FormLabel>Section Name</FormLabel>
                                                    <FormControl>
                                                      <Input placeholder="e.g., Getting Started" {...field} />
                                                    </FormControl>
                                                    <FormDescription>
                                                      Group this lesson into a section
                                                    </FormDescription>
                                                    <FormMessage />
                                                  </FormItem>
                                                )}
                                              />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                              <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                  control={form.control}
                                                  name={`lessons.${index}.type`}
                                                  render={({ field }) => (
                                                    <FormItem>
                                                      <FormLabel>Type</FormLabel>
                                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
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
                                            </div>

                                            <FormField
                                              control={form.control}
                                              name={`lessons.${index}.content`}
                                              render={({ field }) => (
                                                <FormItem>
                                                  <FormLabel>
                                                    {form.watch(`lessons.${index}.type`) === 'video' ? 'YouTube Video ID' : 'Lesson Content'}
                                                  </FormLabel>
                                                  <FormControl>
                                                    {form.watch(`lessons.${index}.type`) === 'video' ? (
                                                      <div className="space-y-2">
                                                        <Input placeholder="e.g., dQw4w9WgXcQ" {...field} />
                                                        <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                                                          <p className="font-medium mb-1">How to get the Video ID:</p>
                                                          <p>1. Go to the YouTube video.</p>
                                                          <p>2. Look at the URL: <code>youtube.com/watch?v=<b>dQw4w9WgXcQ</b></code></p>
                                                          <p>3. Copy the text after <code>v=</code> (e.g., <code>dQw4w9WgXcQ</code>).</p>
                                                        </div>
                                                      </div>
                                                    ) : (
                                                      <div data-color-mode="light">
                                                        <MDEditor value={field.value} onChange={field.onChange} height={200} preview="edit" />
                                                      </div>
                                                    )}
                                                  </FormControl>
                                                  <FormMessage />
                                                </FormItem>
                                              )}
                                            />

                                            <FormField
                                              control={form.control}
                                              name={`lessons.${index}.transcript`}
                                              render={({ field }) => (
                                                <FormItem>
                                                  <FormLabel>Lesson Notes (Markdown Supported)</FormLabel>
                                                  <FormControl>
                                                    <div data-color-mode="light">
                                                      <MDEditor
                                                        value={field.value || ''}
                                                        onChange={field.onChange}
                                                        height={200}
                                                        preview="edit"
                                                        textareaProps={{
                                                          placeholder: "Add detailed notes, code snippets, or a transcript for this lesson..."
                                                        }}
                                                      />
                                                    </div>
                                                  </FormControl>
                                                  <FormDescription>
                                                    These notes will be displayed to students alongside the lesson.
                                                  </FormDescription>
                                                  <FormMessage />
                                                </FormItem>
                                              )}
                                            />
                                          </div>
                                        </Card>
                                      </AccordionContent>
                                    </AccordionItem>
                                  </Accordion>
                                );
                              })}

                              {/* Add Lesson to This Section Button */}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() => appendLesson({
                                  title: '',
                                  type: 'video',
                                  content: '',
                                  duration: 10,
                                  transcript: '',
                                  section: sectionName === 'Unsectioned Lessons' ? '' : sectionName
                                })}
                              >
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Lesson to {sectionName}
                              </Button>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  );
                })()}
              </div>

              {/* Questions Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Final Test Questions</h3>
                {questionFields.map((field, index) => {
                  const questionText = form.watch(`questions.${index}.text`) || 'Untitled Question';
                  const questionType = form.watch(`questions.${index}.type`) || 'mcq';

                  return (
                    <Accordion key={field.id} type="single" collapsible className="border-2 border-gray-100 rounded-lg">
                      <AccordionItem value={`question-${index}`} className="border-none">
                        <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline">
                          <div className="flex items-center gap-3 w-full">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary/10 text-secondary-foreground text-xs font-semibold">
                              {index + 1}
                            </span>
                            <div className="flex-1 text-left">
                              <p className="font-semibold text-sm line-clamp-1">{questionText}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {questionType === 'mcq' ? '☑️ Multiple Choice' : '✍️ Text Answer'}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeQuestion(index);
                              }}
                              className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <Card className="p-6 bg-card border shadow-sm relative overflow-hidden mt-2">
                            <div className="absolute top-0 left-0 w-1 h-full bg-secondary/20" />
                            <div className="space-y-6">
                              <FormField
                                control={form.control}
                                name={`questions.${index}.text`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Question Text</FormLabel>
                                    <FormControl><Textarea placeholder="What is the main concept of..." {...field} /></FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                  control={form.control}
                                  name={`questions.${index}.type`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Question Type</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                          <SelectItem value="mcq">Multiple Choice</SelectItem>
                                          <SelectItem value="text">Text Answer</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`questions.${index}.correctAnswer`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Correct Answer</FormLabel>
                                      <FormControl><Input placeholder="The correct answer is..." {...field} /></FormControl>
                                      <FormDescription>For MCQs, this must exactly match one of the options.</FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              {form.watch(`questions.${index}.type`) === 'mcq' && (
                                <FormField
                                  control={form.control}
                                  name={`questions.${index}.options`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Options (comma-separated)</FormLabel>
                                      <FormControl><Input placeholder="Option A, Option B, Option C, Option D" {...field} /></FormControl>
                                      <FormDescription>Provide at least 2 options separated by commas.</FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              )}
                            </div>
                          </Card>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  );
                })}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => appendQuestion({ text: '', type: 'mcq', correctAnswer: '' })}
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
});


export default function NewCoursePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<{ blob: Blob; filename: string } | null>(null);
  const router = useRouter();
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const instructorProfileRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'instructorProfiles', user.uid) : null),
    [firestore, user]
  );
  const { data: instructorProfile } = useDoc<InstructorProfile>(instructorProfileRef);

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

  // Handle thumbnail file ready (compressed)
  const handleThumbnailUpload = async (file: Blob, filename: string) => {
    // Store the file for upload during form submission
    setThumbnailFile({ blob: file, filename });
  };

  const onSubmit = async (data: CourseFormValues) => {
    if (!firestore || !user || userProfile?.role === 'Student') return;

    // Validate thumbnail
    if (!data.thumbnail || (data.thumbnail.trim() === '')) {
      toast({
        variant: 'destructive',
        title: 'Thumbnail Required',
        description: 'Please upload a thumbnail image or provide a URL.',
      });
      return;
    }

    setIsLoading(true);

    try {
      let thumbnailUrl = data.thumbnail;

      // Upload thumbnail to Cloudinary if we have a file
      if (thumbnailFile) {
        setUploadingThumbnail(true);

        try {
          const result = await uploadToCloudinary(
            thumbnailFile.blob,
            thumbnailFile.filename,
            {
              folder: `course-thumbnails/${user.uid}`,
            }
          );

          thumbnailUrl = result.secureUrl;
        } catch (uploadError) {
          throw new Error(
            uploadError instanceof Error
              ? uploadError.message
              : 'Failed to upload thumbnail'
          );
        } finally {
          setUploadingThumbnail(false);
        }
      }
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
        thumbnail: thumbnailUrl,
        instructorId: user.uid,
        instructor: user.displayName || 'Anonymous', // Denormalize instructor name
        passingScore: data.passingScore,
        isFree: data.isFree,
        price: data.isFree ? 0 : data.price,
      };

      await setDoc(courseRef, newCourse);

      // Save lessons
      for (let i = 0; i < data.lessons.length; i++) {
        const lesson = data.lessons[i];
        const lessonCollectionRef = collection(firestore, `courses/${courseId}/lessons`);

        const lessonDocRef = await addDoc(lessonCollectionRef, {
          courseId: courseId, title: lesson.title, type: lesson.type,
          content: lesson.content, duration: lesson.duration, order: i + 1, transcript: lesson.transcript,
          section: lesson.section || '',
        });
        await setDoc(lessonDocRef, { id: lessonDocRef.id }, { merge: true });
      }

      // Save questions
      for (let i = 0; i < data.questions.length; i++) {
        const question = data.questions[i];
        const questionCollectionRef = collection(firestore, `courses/${courseId}/questions`);
        const questionOptions = (question.type === 'mcq' && question.options) ? question.options.split(',').map(o => o.trim()) : [];

        const questionDocRef = await addDoc(questionCollectionRef, {
          courseId: courseId, text: question.text, type: question.type,
          options: questionOptions,
          correctAnswer: question.correctAnswer, order: i + 1,
        });
        await setDoc(questionDocRef, { id: questionDocRef.id }, { merge: true });
      }

      router.push(`/courses/${courseId}`);
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create course',
      });
    } finally {
      setIsLoading(false);
      setUploadingThumbnail(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-8">
        <Content
          form={form}
          onSubmit={onSubmit}
          isLoading={isLoading}
          isProfileLoading={isProfileLoading}
          userProfile={userProfile}
          instructorProfile={instructorProfile}
          lessonFields={lessonFields}
          appendLesson={appendLesson}
          removeLesson={removeLesson}
          questionFields={questionFields}
          appendQuestion={appendQuestion}
          removeQuestion={removeQuestion}
          onThumbnailUpload={handleThumbnailUpload}
          uploadingThumbnail={uploadingThumbnail}
        />
      </main>
    </div>
  );
}

