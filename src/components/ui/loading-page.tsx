import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export interface LoadingPageProps {
  title?: string;
  description?: string;
  showCard?: boolean;
  cardCount?: number;
}

export function LoadingPage({
  title = 'Loading your content...',
  description = 'Please wait while we fetch your information',
  showCard = true,
  cardCount = 1,
}: LoadingPageProps) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header Skeleton */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <main className="flex-1 container mx-auto px-4 md:px-6 py-8">
        {showCard ? (
          <div className="max-w-xl mx-auto space-y-6">
            {[...Array(cardCount)].map((_, i) => (
              <Card key={i} className="border-gray-200">
                <CardHeader className="space-y-3">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>

                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>

                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>

                  {/* Button */}
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            {/* Title and Description Skeleton */}
            <Skeleton className="h-10 w-64 mb-4" />
            <Skeleton className="h-4 w-96 mb-8" />

            {/* Content Lines Skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Animated Loading Page with spinner
export function LoadingPageWithSpinner({
  title = 'Loading...',
  subtitle = 'Please wait while we fetch your information',
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="text-center">
        {/* Animated Spinner */}
        <div className="flex justify-center mb-6">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-primary animate-spin"></div>
          </div>
        </div>

        {/* Text */}
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-500 max-w-sm">{subtitle}</p>

        {/* Loading Dots Animation */}
        <div className="flex justify-center gap-1 mt-6">
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse animation-delay-100"></span>
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse animation-delay-200"></span>
        </div>
      </div>
    </div>
  );
}
