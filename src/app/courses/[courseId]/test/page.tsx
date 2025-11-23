
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
import { Loader2, Send, ArrowLeft, ArrowRight, CheckCircle2, Clock, Target, ChevronRight } from 'lucide-react';
import type { Course, Question, TestAttempt } from '@/lib/data-types';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';

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
  const [timeSpent, setTimeSpent] = useState(0);

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
      return (
        <div className="flex h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Preparing your test...</p>
          </div>
        </div>
      );
  }

  const currentQuestion = questions?.[currentQuestionIndex];
  const progressPercentage = questions ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const isLastQuestion = questions ? currentQuestionIndex === questions.length - 1 : false;
  const answeredQuestions = Object.keys(answers).length;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 md:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold font-headline mb-2">
                  {course?.title}
                </h1>
                <p className="text-muted-foreground">Final Assessment</p>
              </div>
              <Badge variant="secondary" className="text-base px-4 py-2">
                {answeredQuestions}/{questions?.length} Answered
              </Badge>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <Target className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Passing Score</p>
                    <p className="font-bold text-lg">{course?.passingScore || 70}%</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Questions</p>
                    <p className="font-bold text-lg">{questions?.length || 0}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="p-4 flex items-center gap-3">
                  <Clock className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="font-bold text-lg">No Limit</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Question {currentQuestionIndex + 1} of {questions?.length}</span>
                <span className="text-sm text-muted-foreground">{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>
          </motion.div>

          {/* Question Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Badge className="mb-3" variant="outline">
                      {currentQuestion?.type === 'mcq' ? '☑️ Multiple Choice' : '✍️ Text Answer'}
                    </Badge>
                    <CardTitle className="text-2xl">{currentQuestion?.text}</CardTitle>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary font-bold shrink-0">
                    {currentQuestionIndex + 1}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-8">
                <AnimatePresence mode="wait">
                  {currentQuestion && (
                    <motion.div
                      key={currentQuestion.id}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3 }}
                    >
                      {currentQuestion.type === 'mcq' && currentQuestion.options && (
                        <RadioGroup 
                          value={answers[currentQuestion.id] || ''}
                          onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                          className="space-y-3"
                        >
                          {currentQuestion.options.map((option, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="relative"
                            >
                              <RadioGroupItem 
                                value={option} 
                                id={`${currentQuestion.id}-${i}`}
                                className="sr-only"
                              />
                              <Label 
                                htmlFor={`${currentQuestion.id}-${i}`}
                                className={`
                                  block p-4 rounded-lg border-2 cursor-pointer transition-all
                                  has-[:checked]:bg-primary/15 has-[:checked]:border-primary
                                  hover:border-primary/50 hover:bg-muted/50
                                `}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`
                                    h-6 w-6 rounded-full border-2 flex items-center justify-center
                                    has-[:checked]:bg-primary has-[:checked]:border-primary
                                  `}>
                                    {answers[currentQuestion.id] === option && (
                                      <CheckCircle2 className="h-4 w-4 text-white" />
                                    )}
                                  </div>
                                  <span className="font-medium text-base">{option}</span>
                                </div>
                              </Label>
                            </motion.div>
                          ))}
                        </RadioGroup>
                      )}
                      {currentQuestion.type === 'text' && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <Textarea 
                            value={answers[currentQuestion.id] || ''}
                            placeholder="Type your answer here..."
                            onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                            className="min-h-32 text-base resize-none"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Character count: {(answers[currentQuestion.id] || '').length}
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          {/* Navigation Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between gap-4"
          >
            <Button 
              variant="outline" 
              onClick={handlePrev} 
              disabled={currentQuestionIndex === 0}
              size="lg"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {/* Question Indicator */}
            <div className="flex items-center gap-2">
              {questions?.map((_, idx) => (
                <motion.div
                  key={idx}
                  className={`
                    h-2.5 rounded-full transition-all
                    ${idx === currentQuestionIndex 
                      ? 'bg-primary w-8' 
                      : answers[questions[idx].id] 
                      ? 'bg-green-500 w-2.5'
                      : 'bg-muted w-2.5'
                    }
                  `}
                  whileHover={{ scale: 1.2 }}
                />
              ))}
            </div>

            {isLastQuestion ? (
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading} 
                size="lg"
                className="bg-gradient-to-r from-primary to-primary/80"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Submit Test
              </Button>
            ) : (
              <Button 
                onClick={handleNext}
                size="lg"
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </motion.div>
        </div>
      </main>

      {/* Result Dialog */}
      <AlertDialog open={showResult} onOpenChange={setShowResult}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              <div className={`
                h-24 w-24 rounded-full mx-auto flex items-center justify-center mb-4
                ${testResult?.passed 
                  ? 'bg-green-500/20' 
                  : 'bg-amber-500/20'
                }
              `}>
                <div className={`
                  text-5xl
                  ${testResult?.passed ? 'text-green-500' : 'text-amber-500'}
                `}>
                  {testResult?.passed ? '🎉' : '💪'}
                </div>
              </div>
            </motion.div>
            
            <div>
              <AlertDialogTitle className="text-3xl">
                {testResult?.passed ? 'Outstanding!' : 'Great Effort!'}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base mt-2">
                {testResult?.passed 
                  ? 'Congratulations! You passed the test with flying colors. Ready to claim your certificate?'
                  : 'You gave it a great shot! Review the material and try again to pass this test.'
                }
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>

          {/* Score Display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center py-8 bg-muted/50 rounded-lg"
          >
            <p className="text-sm text-muted-foreground mb-2">Your Score</p>
            <p className={`text-6xl font-bold mb-2 ${testResult?.passed ? 'text-green-500' : 'text-amber-500'}`}>
              {testResult?.score}%
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Passing Score: <span className="font-semibold">{course?.passingScore || 70}%</span></p>
              <p className={testResult?.passed ? 'text-green-600' : 'text-amber-600'}>
                {testResult?.passed ? '✓ Passed' : '○ Not Passed'}
              </p>
            </div>
          </motion.div>

          <AlertDialogFooter className="flex gap-3 sm:flex-row">
            <Button 
              variant="outline" 
              onClick={handleResultDialogClose}
              className="flex-1"
            >
              {testResult?.passed ? 'Back to Course' : 'Review Material'}
            </Button>
            <Button 
              onClick={handleResultDialogClose}
              className={`flex-1 ${testResult?.passed ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-amber-500 to-amber-600'}`}
            >
              {testResult?.passed ? '🏆 Get Certificate' : 'Try Again'}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
