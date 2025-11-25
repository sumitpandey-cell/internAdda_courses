/**
 * Example Component: Course Stats Display
 * 
 * This component demonstrates how to use the new course stats caching system.
 * It shows enrollment numbers, ratings, and other statistics with automatic caching.
 */

import { useCourseStats } from '@/hooks/use-course-stats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Star, Award, TrendingUp, RefreshCw } from 'lucide-react';

interface CourseStatsCardProps {
    courseId: string;
}

export function CourseStatsCard({ courseId }: CourseStatsCardProps) {
    const { stats, isLoading, error, refresh } = useCourseStats(courseId);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-destructive">{error}</p>
                    <Button onClick={refresh} variant="outline" className="mt-4">
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Course Statistics</CardTitle>
                <Button
                    onClick={refresh}
                    variant="ghost"
                    size="icon"
                    title="Refresh stats"
                >
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    {/* Total Enrollments */}
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                        <div className="p-2 bg-blue-100 rounded-full">
                            <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Students</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {stats?.totalEnrollments?.toLocaleString() || 0}
                            </p>
                        </div>
                    </div>

                    {/* Average Rating */}
                    <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
                        <div className="p-2 bg-yellow-100 rounded-full">
                            <Star className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Rating</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {stats?.averageRating?.toFixed(1) || '0.0'} ⭐
                            </p>
                        </div>
                    </div>

                    {/* Total Reviews */}
                    <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                        <div className="p-2 bg-purple-100 rounded-full">
                            <Award className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Reviews</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {stats?.totalReviews?.toLocaleString() || 0}
                            </p>
                        </div>
                    </div>

                    {/* Completion Rate */}
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                        <div className="p-2 bg-green-100 rounded-full">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Completion</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {stats?.completionRate || 0}%
                            </p>
                        </div>
                    </div>
                </div>

                {/* Cache Info (for development) */}
                {stats?.lastUpdated && (
                    <p className="text-xs text-gray-400 mt-4 text-center">
                        Last updated: {new Date(stats.lastUpdated).toLocaleString()}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Simpler inline stats display for course cards
 */
export function InlineCourseStats({ courseId }: { courseId: string }) {
    const { stats, isLoading } = useCourseStats(courseId);

    if (isLoading) {
        return (
            <div className="flex items-center gap-4 text-sm text-gray-600">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
            </div>
        );
    }

    return (
        <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {stats?.totalEnrollments?.toLocaleString() || 0} students
            </span>
            <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {stats?.averageRating?.toFixed(1) || '0.0'}
                {stats?.totalReviews ? ` (${stats.totalReviews})` : ''}
            </span>
        </div>
    );
}
