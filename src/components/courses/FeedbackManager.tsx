'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, MessageCircle, Lightbulb, Bug, AlertTriangle, ThumbsUp, Loader2 } from 'lucide-react';
import { useCourseFeedback } from '@/hooks/use-course-feedback';
import type { CourseFeedback } from '@/lib/data-types';

type FeedbackManagerProps = {
  courseId: string;
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

export function FeedbackManager({ courseId }: FeedbackManagerProps) {
  const [feedback, setFeedback] = useState<CourseFeedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'suggestion' | 'bug' | 'complaint' | 'praise'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'reviewed' | 'resolved'>('all');
  const { getCourseFeedback, updateFeedbackStatus } = useCourseFeedback();

  const feedbackIcons = {
    suggestion: Lightbulb,
    bug: Bug,
    complaint: AlertTriangle,
    praise: ThumbsUp,
  };

  const feedbackColors = {
    suggestion: 'bg-blue-50 border-blue-200 text-blue-700',
    bug: 'bg-red-50 border-red-200 text-red-700',
    complaint: 'bg-orange-50 border-orange-200 text-orange-700',
    praise: 'bg-green-50 border-green-200 text-green-700',
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    reviewed: 'bg-blue-100 text-blue-800 border-blue-300',
    resolved: 'bg-green-100 text-green-800 border-green-300',
  };

  useEffect(() => {
    const loadFeedback = async () => {
      setIsLoading(true);
      const feedbackList = await getCourseFeedback(courseId);
      setFeedback(feedbackList);
      setIsLoading(false);
    };
    loadFeedback();
  }, [courseId, getCourseFeedback]);

  const filteredFeedback = feedback.filter(item => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    return true;
  });

  const handleStatusChange = async (feedbackId: string, newStatus: 'pending' | 'reviewed' | 'resolved') => {
    const success = await updateFeedbackStatus(feedbackId, newStatus);
    if (success) {
      setFeedback(feedback.map(f => f.id === feedbackId ? { ...f, status: newStatus } : f));
    }
  };

  const stats = {
    total: feedback.length,
    pending: feedback.filter(f => f.status === 'pending').length,
    suggestions: feedback.filter(f => f.type === 'suggestion').length,
    bugs: feedback.filter(f => f.type === 'bug').length,
    praise: feedback.filter(f => f.type === 'praise').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Feedback</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <MessageCircle className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-yellow-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Suggestions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.suggestions}</p>
              </div>
              <Lightbulb className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Praise</p>
                <p className="text-3xl font-bold text-gray-900">{stats.praise}</p>
              </div>
              <ThumbsUp className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Type</label>
              <div className="flex flex-wrap gap-2">
                {['all', 'suggestion', 'bug', 'complaint', 'praise'].map(type => (
                  <Button
                    key={type}
                    variant={filterType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType(type as any)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Status</label>
              <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'reviewed', 'resolved'].map(status => (
                  <Button
                    key={status}
                    variant={filterStatus === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus(status as any)}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      {filteredFeedback.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No feedback found matching your filters.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {filteredFeedback.map(item => {
            const Icon = feedbackIcons[item.type];
            return (
              <Card key={item.id} className={feedbackColors[item.type]}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className="w-5 h-5" />
                        <h3 className="font-bold text-lg">{item.subject}</h3>
                        <Badge variant="outline" className={statusColors[item.status]}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm opacity-90 mb-2">{item.message}</p>
                      <p className="text-xs opacity-75">
                        {formatTimeAgo(item.createdAt)}
                      </p>
                    </div>

                    {/* Status Actions */}
                    <div className="flex gap-2">
                      {item.status !== 'reviewed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(item.id, 'reviewed')}
                        >
                          Review
                        </Button>
                      )}
                      {item.status !== 'resolved' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(item.id, 'resolved')}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
