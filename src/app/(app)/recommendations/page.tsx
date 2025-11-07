'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getCourseChatResponse } from './actions';
import { CourseCard } from '@/components/courses/CourseCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, Loader2, Send, Sparkles, User, Volume2 } from 'lucide-react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, documentId } from 'firebase/firestore';
import type { Course, ChatMessage } from '@/lib/data-types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const chatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty.'),
});

export default function RecommendationsPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { firestore } = useFirebase();
  
  // 1. Fetch all courses once when the component mounts
  const coursesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'courses')) : null),
    [firestore]
  );
  const { data: allCourses, isLoading: areCoursesLoading } = useCollection<Course>(coursesQuery);


  const recommendedCourseIds = messages.flatMap(m => m.recommendedCourseIds || []);

  const recommendationsQuery = useMemoFirebase(
    () =>
      firestore && recommendedCourseIds.length > 0
        ? query(collection(firestore, 'courses'), where(documentId(), 'in', recommendedCourseIds))
        : null,
    [firestore, recommendedCourseIds.join(',')]
  );

  const { data: recommendations, isLoading: areRecommendationsLoading } = useCollection<Course>(recommendationsQuery);

  const form = useForm<z.infer<typeof chatSchema>>({
    resolver: zodResolver(chatSchema),
    defaultValues: {
      message: '',
    },
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
        })
    }
  }, [messages])

  async function onSubmit(values: z.infer<typeof chatSchema>) {
    const userMessage: ChatMessage = {
      role: 'user',
      content: values.message,
    };
    setMessages(prev => [...prev, userMessage]);
    form.reset();
    setIsAiLoading(true);

    const history = messages.map(m => ({
        role: m.role,
        content: m.content
    }));

    // 2. Pass allCourses to the server action
    const result = await getCourseChatResponse(values.message, history, allCourses || []);

    if (result) {
        setMessages(prev => [...prev, result]);
        if (result.audioBase64) {
            const audioSrc = `data:audio/wav;base64,${result.audioBase64}`;
            if (audioRef.current) {
                audioRef.current.src = audioSrc;
                // audioRef.current.play(); // Autoplay can be disruptive, let user click
            }
        }
    }
    
    setIsAiLoading(false);
  }

  const playAudio = (base64: string) => {
    if (audioRef.current) {
      const audioSrc = `data:audio/wav;base64,${base64}`;
      audioRef.current.src = audioSrc;
      audioRef.current.play();
    }
  }


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-10rem)]">
        <audio ref={audioRef} className="hidden" />
        <div className="lg:col-span-2 h-full flex flex-col">
            <Card className="flex-1 flex flex-col">
                <CardContent className="flex-1 flex flex-col p-4">
                    <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
                        <div className="space-y-6">
                            {messages.length === 0 && (
                                <div className="text-center py-12">
                                    <Bot className="mx-auto h-12 w-12 text-primary/50" />
                                    <h2 className="mt-4 text-xl font-semibold">AI Course Advisor</h2>
                                    <p className="text-muted-foreground mt-1">
                                        Ask me anything about your learning goals to get started!
                                    </p>
                                </div>
                            )}
                            {messages.map((message, index) => (
                                <div key={index} className={cn("flex items-start gap-4", message.role === 'user' ? 'justify-end' : 'justify-start')}>
                                     {message.role === 'model' && (
                                        <Avatar className="w-8 h-8 bg-primary/20 text-primary">
                                            <AvatarFallback><Sparkles className="w-4 h-4"/></AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={cn(
                                        "max-w-md p-3 rounded-lg", 
                                        message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                    )}>
                                       <p>{message.content}</p>
                                       {message.audioBase64 && (
                                          <Button onClick={() => playAudio(message.audioBase64!)} variant="ghost" size="icon" className="mt-2 h-7 w-7 text-muted-foreground">
                                              <Volume2 className="h-4 w-4" />
                                          </Button>
                                       )}
                                    </div>
                                    {message.role === 'user' && (
                                        <Avatar className="w-8 h-8">
                                            <AvatarFallback><User className="w-4 h-4"/></AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            ))}
                             {isAiLoading && (
                                <div className="flex items-start gap-4">
                                     <Avatar className="w-8 h-8 bg-primary/20 text-primary">
                                        <AvatarFallback><Loader2 className="w-4 h-4 animate-spin"/></AvatarFallback>
                                    </Avatar>
                                    <div className="max-w-md p-3 rounded-lg bg-muted">
                                       <p className="text-muted-foreground italic">Thinking...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                    <div className="mt-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
                            <FormField
                                control={form.control}
                                name="message"
                                render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormControl>
                                        <Input placeholder="Ask for course recommendations..." {...field} autoComplete="off" disabled={areCoursesLoading} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <Button type="submit" size="icon" disabled={isAiLoading || areCoursesLoading}>
                                {areCoursesLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                            </form>
                        </Form>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-1 h-full">
             <Card className="h-full flex flex-col">
                <CardContent className="flex-1 flex flex-col p-4">
                    <h3 className="font-semibold mb-4 text-lg">Recommended for you</h3>
                    <ScrollArea className="flex-1">
                        <div className="space-y-4">
                            {areRecommendationsLoading && (
                                <>
                                    <Skeleton className="h-40 w-full" />
                                    <Skeleton className="h-40 w-full" />
                                </>
                            )}
                            {!areRecommendationsLoading && recommendations && recommendations.length > 0 ? (
                                recommendations.map(course => <CourseCard key={course.id} course={course} />)
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                   <p>The AI will recommend courses here as you chat.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
