'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Star, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { useCourseFeedback } from '@/hooks/use-course-feedback';
import type { CourseReview } from '@/lib/data-types';

type ReviewsDisplayProps = {
  courseId: string;
  maxReviews?: number;
};

const formatTimeAgo = (timestamp: any): string => {
  try {
    // Handle Firestore timestamp
    let date: Date;
    if (timestamp && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      return 'Recently';
    }

    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
  } catch (error) {
    return 'Recently';
  }
};

export function ReviewsDisplay({ courseId, maxReviews = 6 }: ReviewsDisplayProps) {
  const [reviews, setReviews] = useState<CourseReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent');
  const { getCourseReviews, markHelpful } = useCourseFeedback();

  // processing state per review id: 'helpful' | 'unhelpful' | null
  const [processing, setProcessing] = useState<Record<string, 'helpful' | 'unhelpful' | null>>({});
  
  // track user's vote per review: { [reviewId]: 'helpful' | 'unhelpful' | null }
  const [userVotes, setUserVotes] = useState<Record<string, 'helpful' | 'unhelpful' | null>>({});

  useEffect(() => {
    const loadReviews = async () => {
      setIsLoading(true);
      try {
  const fetchedReviews = await getCourseReviews(courseId, maxReviews);
        console.log('Fetched reviews:', fetchedReviews);
        // Sort reviews
        let sorted = [...fetchedReviews];
        if (sortBy === 'helpful') {
          sorted.sort((a, b) => (b.helpful || 0) - (a.helpful || 0));
        } else if (sortBy === 'rating') {
          sorted.sort((a, b) => b.rating - a.rating);
        }
        
        setReviews(sorted);
      } catch (error) {
        console.error('Error loading reviews:', error);
        setReviews([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadReviews();
  }, [courseId, maxReviews, getCourseReviews, sortBy]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-gray-600 font-medium">No reviews yet. Be the first to share your feedback!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sort Options */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={sortBy === 'recent' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('recent')}
        >
          Most Recent
        </Button>
        <Button
          variant={sortBy === 'helpful' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('helpful')}
        >
          Most Helpful
        </Button>
        <Button
          variant={sortBy === 'rating' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSortBy('rating')}
        >
          Highest Rated
        </Button>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <Avatar className="h-12 w-12 border-2 border-white shadow-sm flex-shrink-0">
                <AvatarImage src={review.userAvatar || undefined} />
                <AvatarFallback>{review.userName?.charAt(0) || 'A'}</AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-start justify-between mb-2 gap-4">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">{review.userName || 'Anonymous'}</p>
                    <p className="text-xs text-gray-500">
                      {formatTimeAgo(review.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Title */}
                <h4 className="font-semibold text-gray-900 mb-2 break-words">{review.title || 'Great Course'}</h4>

                {/* Comment */}
                <p className="text-gray-700 leading-relaxed mb-4 break-words">{review.comment || ''}</p>

                {/* Helpful Buttons */}
                <div className="flex items-center gap-4 pt-3 border-t border-gray-200">
                  <button
                    onClick={async () => {
                      if (!markHelpful || processing[review.id]) return;
                      
                      const currentVote = userVotes[review.id];
                      const isToggle = currentVote === 'helpful';
                      
                      setProcessing((s) => ({ ...s, [review.id]: 'helpful' }));
                      try {
                        const ok = await markHelpful(review.id, true);
                        if (ok) {
                          setReviews((prev) =>
                            prev.map((r) => {
                              if (r.id === review.id) {
                                let helpful = r.helpful || 0;
                                let unhelpful = r.unhelpful || 0;
                                
                                // If toggling (same vote), decrement
                                if (isToggle) {
                                  helpful = Math.max(0, helpful - 1);
                                } else {
                                  // If switching from unhelpful to helpful
                                  if (currentVote === 'unhelpful') {
                                    unhelpful = Math.max(0, unhelpful - 1);
                                  }
                                  helpful += 1;
                                }
                                
                                return { ...r, helpful, unhelpful };
                              }
                              return r;
                            })
                          );
                          
                          // Update user vote
                          setUserVotes((s) => ({
                            ...s,
                            [review.id]: isToggle ? null : 'helpful'
                          }));
                        }
                      } catch (err) {
                        console.error('Error marking helpful:', err);
                      } finally {
                        setProcessing((s) => ({ ...s, [review.id]: null }));
                      }
                    }}
                    disabled={!!processing[review.id] || userVotes[review.id] === 'unhelpful'}
                    className={`text-sm flex items-center gap-1.5 transition-colors group ${
                      userVotes[review.id] === 'helpful'
                        ? 'text-green-600 font-semibold'
                        : 'text-gray-600 hover:text-green-600 disabled:hover:text-gray-600'
                    } disabled:opacity-50`}
                  >
                    <ThumbsUp className={`w-4 h-4 flex-shrink-0 ${userVotes[review.id] === 'helpful' ? 'fill-current' : 'group-hover:fill-current'}`} />
                    <span>Helpful ({review.helpful || 0})</span>
                  </button>

                  <button
                    onClick={async () => {
                      if (!markHelpful || processing[review.id]) return;
                      
                      const currentVote = userVotes[review.id];
                      const isToggle = currentVote === 'unhelpful';
                      
                      setProcessing((s) => ({ ...s, [review.id]: 'unhelpful' }));
                      try {
                        const ok = await markHelpful(review.id, false);
                        if (ok) {
                          setReviews((prev) =>
                            prev.map((r) => {
                              if (r.id === review.id) {
                                let helpful = r.helpful || 0;
                                let unhelpful = r.unhelpful || 0;
                                
                                // If toggling (same vote), decrement
                                if (isToggle) {
                                  unhelpful = Math.max(0, unhelpful - 1);
                                } else {
                                  // If switching from helpful to unhelpful
                                  if (currentVote === 'helpful') {
                                    helpful = Math.max(0, helpful - 1);
                                  }
                                  unhelpful += 1;
                                }
                                
                                return { ...r, helpful, unhelpful };
                              }
                              return r;
                            })
                          );
                          
                          // Update user vote
                          setUserVotes((s) => ({
                            ...s,
                            [review.id]: isToggle ? null : 'unhelpful'
                          }));
                        }
                      } catch (err) {
                        console.error('Error marking unhelpful:', err);
                      } finally {
                        setProcessing((s) => ({ ...s, [review.id]: null }));
                      }
                    }}
                    disabled={!!processing[review.id] || userVotes[review.id] === 'helpful'}
                    className={`text-sm flex items-center gap-1.5 transition-colors group ${
                      userVotes[review.id] === 'unhelpful'
                        ? 'text-red-600 font-semibold'
                        : 'text-gray-600 hover:text-red-600 disabled:hover:text-gray-600'
                    } disabled:opacity-50`}
                  >
                    <ThumbsDown className={`w-4 h-4 flex-shrink-0 ${userVotes[review.id] === 'unhelpful' ? 'fill-current' : 'group-hover:fill-current'}`} />
                    <span>Not Helpful ({review.unhelpful || 0})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
