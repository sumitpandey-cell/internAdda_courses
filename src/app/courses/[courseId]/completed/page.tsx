
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Confetti from 'react-confetti';
import { useWindowSize } from '@react-hook/window-size';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Download, Award } from 'lucide-react';
import { Certificate } from '@/components/courses/Certificate';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Header } from '@/components/layout/Header';
import type { Course } from '@/lib/data-types';

export default function CourseCompletedPage() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const { courseId } = params;
  const { firestore, user } = useFirebase();

  const [width, height] = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(true);

  const courseRef = useMemoFirebase(
    () => (firestore && courseId ? doc(firestore, 'courses', courseId) : null),
    [firestore, courseId]
  );
  const { data: course, isLoading: courseLoading } = useDoc<Course>(courseRef);

  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  if (courseLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Award className="h-12 w-12 text-primary animate-pulse" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Course not found.</p>
        <Button onClick={() => router.push('/')} className="mt-4">
          Back to Courses
        </Button>
      </div>
    );
  }

  const handleDownload = () => {
    if (certificateRef.current) {
      html2canvas(certificateRef.current, {
        scale: 2, // Increase resolution
        useCORS: true, 
      }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [canvas.width, canvas.height],
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`Certificate-${course.title.replace(/ /g, '_')}.pdf`);
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}
      <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <Award className="h-20 w-20 text-yellow-500 mb-4" />
        <h1 className="text-4xl font-bold font-headline text-primary mb-2">
          Congratulations, {user?.displayName || 'Student'}!
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          You have successfully completed the "{course.title}" course.
        </p>
        <div className="flex gap-4">
          <Button size="lg" onClick={handleDownload}>
            <Download className="mr-2 h-5 w-5" />
            Download Certificate
          </Button>
          <Button size="lg" variant="outline" onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </main>

      {/* Hidden certificate for rendering */}
      <div className="absolute -left-[9999px] -top-[9999px]">
        <Certificate ref={certificateRef} course={course} studentName={user?.displayName || 'Valued Student'} />
      </div>
    </div>
  );
}
