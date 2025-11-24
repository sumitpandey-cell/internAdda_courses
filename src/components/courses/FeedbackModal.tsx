'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { MessageCircle, AlertCircle, Lightbulb, ThumbsUp, Bug, Lock } from 'lucide-react';
import { useCourseFeedback } from '@/hooks/use-course-feedback';
import { useFirebase } from '@/firebase';
import { useProgressTracking } from '@/hooks/use-progress-tracking';

type FeedbackModalProps = {
  courseId: string;
  triggerLabel?: string;
  triggerVariant?: 'default' | 'outline' | 'ghost';
};

export function FeedbackModal({
  courseId,
  triggerLabel = 'Send Feedback',
  triggerVariant = 'outline'
}: FeedbackModalProps) {
  const [open, setOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'suggestion' | 'bug' | 'complaint' | 'praise'>('suggestion');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [userProgress, setUserProgress] = useState<number | null>(null);

  const { submitFeedback } = useCourseFeedback();
  const { user } = useFirebase();
  const { getProgress, isEligibleForFeedback } = useProgressTracking();

  // Check eligibility on mount and when user changes
  useEffect(() => {
    const checkEligibility = async () => {
      if (!user) {
        setIsEligible(false);
        return;
      }

      try {
        const eligible = await isEligibleForFeedback(courseId, 50);
        setIsEligible(eligible);

        if (eligible) {
          const progress = await getProgress(courseId);
          if (progress) {
            setUserProgress(Math.round(progress.percentage));
          }
        }
      } catch (error) {
        console.error('Error checking eligibility:', error);
        setIsEligible(false);
      }
    };

    checkEligibility();
  }, [user, courseId, isEligibleForFeedback, getProgress]);

  const feedbackTypes = [
    { id: 'suggestion', label: 'Suggestion', icon: Lightbulb, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { id: 'bug', label: 'Report Bug', icon: Bug, color: 'text-red-600 bg-red-50 border-red-200' },
    { id: 'complaint', label: 'Complaint', icon: AlertCircle, color: 'text-orange-600 bg-orange-50 border-orange-200' },
    { id: 'praise', label: 'Praise', icon: ThumbsUp, color: 'text-green-600 bg-green-50 border-green-200' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    const success = await submitFeedback(courseId, feedbackType, subject, message);

    if (success) {
      setSubject('');
      setMessage('');
      setFeedbackType('suggestion');
      setOpen(false);
    }
    setIsSubmitting(false);
  };

  // Loading state - return nothing while checking
  if (isEligible === null) {
    return null;
  }

  // Not eligible - show locked button
  if (!isEligible) {
    return (
      <Button variant={triggerVariant} disabled className="gap-2 opacity-50 cursor-not-allowed">
        <Lock className="w-4 h-4" />
        {triggerLabel}
      </Button>
    );
  }

  // Eligible - show normal feedback modal
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} className="gap-2">
          <MessageCircle className="w-4 h-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            Send Feedback
          </DialogTitle>
          <DialogDescription>
            Help us improve by sharing your thoughts and suggestions about this course.
            {userProgress !== null && (
              <span className="block mt-2 text-xs text-gray-500">Your progress: <strong>{userProgress}%</strong></span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Feedback Type</label>
            <div className="grid grid-cols-2 gap-2">
              {feedbackTypes.map((type) => {
                const TypeIcon = type.icon;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFeedbackType(type.id as any)}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                      feedbackType === type.id
                        ? `${type.color} border-current font-semibold`
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <TypeIcon className="w-5 h-5" />
                    <span className="text-xs text-center">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
              Subject
            </label>
            <Input
              id="subject"
              placeholder="Brief description of your feedback"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={100}
              className="border-gray-200"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
              Message
            </label>
            <Textarea
              id="message"
              placeholder="Please provide detailed information..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              className="border-gray-200 min-h-24 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">{message.length}/500</p>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !subject.trim() || !message.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            {isSubmitting ? 'Sending...' : 'Send Feedback'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
