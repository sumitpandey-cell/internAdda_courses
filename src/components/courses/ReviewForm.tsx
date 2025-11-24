'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Star, Send } from 'lucide-react';
import { useCourseFeedback } from '@/hooks/use-course-feedback';
import { useFirebase } from '@/firebase';
import { useProgressTracking } from '@/hooks/use-progress-tracking';

type ReviewFormProps = {
  courseId: string;
  onReviewSubmitted?: () => void;
  onFeedbackSubmitted?: () => void;
};

export function ReviewForm({ courseId, onReviewSubmitted, onFeedbackSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { submitReview, submitFeedback } = useCourseFeedback();
  const { user } = useFirebase();
  const { getProgress, isEligibleForFeedback } = useProgressTracking();

  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [userProgress, setUserProgress] = useState<number | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'suggestion' | 'bug' | 'complaint' | 'praise'>('suggestion');
  const [feedbackSubject, setFeedbackSubject] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);

  useEffect(() => {
    const checkEligibility = async () => {
      if (!user) {
        setIsEligible(false);
        return;
      }

      try {
        const eligible = await isEligibleForFeedback(courseId, 50);
        setIsEligible(eligible);

        const progress = await getProgress(courseId);
        if (progress) {
          setUserProgress(Math.round(progress.percentage));
        }
      } catch (error) {
        console.error('Error checking eligibility:', error);
        setIsEligible(false);
      }
    };

    checkEligibility();
  }, [user, courseId, isEligibleForFeedback, getProgress]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating || !title.trim() || !comment.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    const success = await submitReview(
      courseId,
      rating,
      title,
      comment,
      user?.displayName || 'Anonymous',
      user?.photoURL || `https://i.pravatar.cc/200?u=${user?.uid}`
    );

    if (success) {
      setRating(0);
      setTitle('');
      setComment('');
      setShowReviewForm(false);
      onReviewSubmitted?.();
    }
    setIsSubmitting(false);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!feedbackSubject.trim() || !feedbackMessage.trim()) {
      alert('Please fill in all fields');
      return;
    }

    if (!user) {
      alert('You must be logged in to send feedback');
      return;
    }

    setIsFeedbackSubmitting(true);
    try {
      const success = await submitFeedback(
        courseId,
        feedbackType,
        feedbackSubject,
        feedbackMessage
      );

      if (success) {
        setFeedbackType('suggestion');
        setFeedbackSubject('');
        setFeedbackMessage('');
        setShowFeedbackForm(false);
        onFeedbackSubmitted?.();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsFeedbackSubmitting(false);
    }
  };

  if (isEligible === null) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <p className="text-gray-600 text-sm">Checking your course progress...</p>
      </div>
    );
  }

  if (!isEligible) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={() => setShowReviewForm(!showReviewForm)}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold"
      >
        {showReviewForm ? 'Cancel' : 'Leave a Review'}
      </Button>

      {showReviewForm && (
        <form onSubmit={handleReviewSubmit} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-900">Share Your Review</h3>
            <div className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
              {userProgress}% Complete
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Course Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-lg font-semibold text-gray-900">
                  {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : 'Excellent'}
                </span>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
              Review Title
            </label>
            <Input
              id="title"
              placeholder="Summarize your experience in a few words"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="border-gray-200 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
          </div>

          <div>
            <label htmlFor="comment" className="block text-sm font-semibold text-gray-700 mb-2">
              Your Review
            </label>
            <Textarea
              id="comment"
              placeholder="Share what you liked, didn't like, and any suggestions for improvement..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              className="border-gray-200 focus:border-blue-500 min-h-28"
            />
            <p className="text-xs text-gray-500 mt-1">{comment.length}/1000</p>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !rating || !title.trim() || !comment.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold h-11"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </form>
      )}

      <Button
        onClick={() => setShowFeedbackForm(!showFeedbackForm)}
        variant="outline"
        className="w-full gap-2"
      >
        <Send className="w-4 h-4" />
        {showFeedbackForm ? 'Cancel' : 'Send Feedback'}
      </Button>

      {showFeedbackForm && (
        <form onSubmit={handleFeedbackSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
          <div>
            <label htmlFor="feedbackType" className="block text-sm font-medium text-gray-700 mb-1">
              Feedback Type
            </label>
            <select
              id="feedbackType"
              value={feedbackType}
              onChange={(e) => setFeedbackType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="suggestion">Suggestion</option>
              <option value="bug">Bug Report</option>
              <option value="complaint">Complaint</option>
              <option value="praise">Praise</option>
            </select>
          </div>

          <div>
            <label htmlFor="feedbackSubject" className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <Input
              id="feedbackSubject"
              placeholder="Brief subject"
              value={feedbackSubject}
              onChange={(e) => setFeedbackSubject(e.target.value)}
              disabled={isFeedbackSubmitting}
              maxLength={100}
              className="text-sm"
            />
          </div>

          <div>
            <label htmlFor="feedbackMessage" className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <Textarea
              id="feedbackMessage"
              placeholder="Tell us more..."
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              disabled={isFeedbackSubmitting}
              maxLength={1000}
              rows={3}
              className="text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">{feedbackMessage.length}/1000</p>
          </div>

          <Button
            type="submit"
            disabled={isFeedbackSubmitting || !feedbackSubject.trim() || !feedbackMessage.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isFeedbackSubmitting ? 'Sending...' : 'Send Feedback'}
          </Button>
        </form>
      )}
    </div>
  );
}
