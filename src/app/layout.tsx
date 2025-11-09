import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import './globals.css';
import { BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'InternAdda Courses',
  description: 'Your gateway to top courses with InternAdda.',
};

function RootLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <BookOpen className="h-12 w-12 text-primary animate-pulse" />
        <p className="text-muted-foreground">Loading Your Experience...</p>
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Source+Code+Pro:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <Suspense fallback={<RootLoading />}>
            {children}
          </Suspense>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
