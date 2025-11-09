
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
import { Loader2, Send, ArrowLeft, ArrowRight } from 'lucide-react';
import type { Course, Question, TestAttempt } from '@/lib/data-types';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

export default function TestPage() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const { courseId } = params;
  const { firestore, user, isUserLoading } = useFirebase();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
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

  const handleNext = () => {
    if (questions && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  if (isUserLoading || questionsLoading) {
      return <div className="flex h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const currentQuestion = questions?.[currentQuestionIndex];
  const progressPercentage = questions ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const isLastQuestion = questions ? currentQuestionIndex === questions.length - 1 : false;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl mx-auto overflow-hidden">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline">Final Test: {course?.title}</CardTitle>
            <CardDescription>
                Score {course?.passingScore || 70}% or higher to pass. Good luck!
            </CardDescription>
            <div className="pt-4">
                <Progress value={progressPercentage} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">{`Question ${currentQuestionIndex + 1} of ${questions?.length}`}</p>
            </div>
          </CardHeader>
          <CardContent className="min-h-[300px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {currentQuestion && (
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="font-semibold text-xl mb-6 text-center">{currentQuestion.text}</p>
                  {currentQuestion.type === 'mcq' && currentQuestion.options && (
                    <RadioGroup 
                      value={answers[currentQuestion.id] || ''}
                      onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                      className="max-w-md mx-auto"
                    >
                      <div className="space-y-4">
                          {currentQuestion.options.map((option, i) => (
                              <div key={i} className="flex items-center space-x-3 p-4 border rounded-lg has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-all">
                                  <RadioGroupItem value={option} id={`${currentQuestion.id}-${i}`} />
                                  <Label htmlFor={`${currentQuestion.id}-${i}`} className="text-base cursor-pointer flex-1">{option}</Label>
                              </div>
                          ))}
                      </div>
                    </RadioGroup>
                  )}
                  {currentQuestion.type === 'text' && (
                      <Textarea 
                          value={answers[currentQuestion.id] || ''}
                          placeholder="Your answer..."
                          onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                          className="text-base"
                      />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
          <div className="flex items-center justify-between p-6 bg-muted/50 border-t">
              <Button variant="outline" onClick={handlePrev} disabled={currentQuestionIndex === 0}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              {isLastQuestion ? (
                 <Button onClick={handleSubmit} disabled={isLoading} size="lg">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Submit Test
                </Button>
              ) : (
                <Button onClick={handleNext}>
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
          </div>
        </Card>
      </main>

      <AlertDialog open={showResult} onOpenChange={setShowResult}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl text-center">
                    {testResult?.passed ? '🎉 Congratulations! 🎉' : 'Keep Going!'}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-center">
                      {testResult?.passed ? 'You passed the test with flying colors.' : 'You didn\'t pass this time, but don\'t give up.'}
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="text-center py-4">
                  <p className="text-base text-muted-foreground">Your Score</p>
                  <p className={`text-7xl font-bold ${testResult?.passed ? 'text-green-500' : 'text-destructive'}`}>{testResult?.score}%</p>
                  <p className="text-sm text-muted-foreground mt-2">Passing Score: {course?.passingScore || 70}%</p>
              </div>
              <AlertDialogFooter>
                  <AlertDialogAction onClick={handleResultDialogClose} className="w-full">
                      {testResult?.passed ? 'Claim Your Certificate' : 'Back to Course'}
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
