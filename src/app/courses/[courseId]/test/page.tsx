
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirebase, useDoc, useCollection, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc, collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import type { Course, Question, TestAttempt } from '@/lib/data-types';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function TestPage() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const { courseId } = params;
  const { firestore, user, isUserLoading } = useFirebase();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [testResult, setTestResult] = useState<{ score: number; passed: boolean } | null>(null);

  const courseRef = useMemoFirebase(
    () => (firestore && courseId ? doc(firestore, 'courses', courseId) : null),
    [firestore, courseId]
  );
  const { data: course } = useDoc<Course & { passingScore: number }>(courseRef);

  const questionsQuery = useMemoFirebase(
    () => (firestore && courseId ? query(collection(firestore, `courses/${courseId}/questions`), orderBy('order')) : null),
    [firestore, courseId]
  );
  const { data: questions, isLoading: questionsLoading } = useCollection<Question>(questionsQuery);
  
  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    if (!firestore || !user || !questions || !course) return;
    setIsLoading(true);

    let correctAnswers = 0;
    const submittedAnswers = questions.map(q => ({
        questionId: q.id,
        answer: answers[q.id] || '',
    }));

    questions.forEach(q => {
        if (answers[q.id] && answers[q.id].toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()) {
            correctAnswers++;
        }
    });

    const score = Math.round((correctAnswers / questions.length) * 100);
    const passed = score >= (course.passingScore || 70);

    const attemptRef = doc(collection(firestore, `users/${user.uid}/testAttempts`));
    const attemptData: TestAttempt = {
        id: attemptRef.id,
        userId: user.uid,
        courseId,
        answers: submittedAnswers,
        score,
        passed,
        submittedAt: serverTimestamp(),
    };
    
    setDocumentNonBlocking(attemptRef, attemptData, {});
    setTestResult({ score, passed });
    setShowResult(true);
    setIsLoading(false);
  };
  
  const handleResultDialogClose = () => {
      if(testResult?.passed) {
          router.push(`/courses/${courseId}/completed`);
      } else {
          router.push(`/courses/${courseId}`);
      }
  }
  
  if (isUserLoading || questionsLoading) {
      return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Final Test: {course?.title}</CardTitle>
            <CardDescription>
                Complete the test to earn your certificate. You need a score of {course?.passingScore || 70}% or higher to pass.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {questions?.map((q, index) => (
              <div key={q.id}>
                <p className="font-semibold mb-4">{index + 1}. {q.text}</p>
                {q.type === 'mcq' && q.options && (
                  <RadioGroup onValueChange={(value) => handleAnswerChange(q.id, value)}>
                    <div className="space-y-2">
                        {q.options.map((option, i) => (
                            <div key={i} className="flex items-center space-x-2">
                                <RadioGroupItem value={option} id={`${q.id}-${i}`} />
                                <Label htmlFor={`${q.id}-${i}`}>{option}</Label>
                            </div>
                        ))}
                    </div>
                  </RadioGroup>
                )}
                {q.type === 'text' && (
                    <Textarea 
                        placeholder="Your answer..."
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    />
                )}
              </div>
            ))}
            <Button onClick={handleSubmit} disabled={isLoading || Object.keys(answers).length !== questions?.length} className="w-full" size="lg">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Submit Test
            </Button>
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={showResult} onOpenChange={setShowResult}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Test Results</AlertDialogTitle>
                  <AlertDialogDescription>
                      {testResult?.passed ? 'Congratulations! You passed the test.' : 'Unfortunately, you did not pass this time.'}
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="text-center py-4">
                  <p className="text-muted-foreground">Your Score</p>
                  <p className={`text-6xl font-bold ${testResult?.passed ? 'text-green-500' : 'text-destructive'}`}>{testResult?.score}%</p>
              </div>
              <AlertDialogFooter>
                  <AlertDialogAction onClick={handleResultDialogClose}>
                      {testResult?.passed ? 'Get Certificate' : 'Back to Course'}
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
