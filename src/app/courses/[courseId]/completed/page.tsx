
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Confetti from 'react-confetti';
import { useWindowSize } from '@react-hook/window-size';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Download, Award, Share2, Linkedin, Twitter, ArrowRight, BookOpen } from 'lucide-react';
import { Certificate } from '@/components/courses/Certificate';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Header } from '@/components/layout/Header';
import type { Course } from '@/lib/data-types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Image from 'next/image';

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
  const [certificateImage, setCertificateImage] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 8000);
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    if (certificateRef.current) {
        html2canvas(certificateRef.current, { scale: 1, useCORS: true, backgroundColor: null }).then((canvas) => {
            setCertificateImage(canvas.toDataURL('image/png'));
        });
    }
  }, [course, user]);


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
  
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = `I just completed the "${course.title}" course on InternAdda Courses!`;

  const linkedinShareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-6">
        <Card className="w-full max-w-4xl text-center shadow-2xl">
            <CardHeader>
                <div className="mx-auto bg-green-100 rounded-full p-3 w-fit">
                    <Award className="h-10 w-10 text-green-600" />
                </div>
                <CardTitle className="text-3xl md:text-4xl font-bold font-headline text-primary mt-4">
                    Congratulations, {user?.displayName?.split(' ')[0] || 'Student'}!
                </CardTitle>
                <p className="text-lg text-muted-foreground">
                    You have successfully completed the &ldquo;{course.title}&rdquo; course.
                </p>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                    <div>
                        <h3 className="font-semibold text-lg">Your Certificate</h3>
                        <p className="text-muted-foreground text-sm">Download your official certificate to share your achievement.</p>
                        <Button size="lg" onClick={handleDownload} className="mt-4 w-full sm:w-auto">
                            <Download className="mr-2 h-5 w-5" />
                            Download Certificate
                        </Button>
                    </div>
                     <div>
                        <h3 className="font-semibold text-lg">Share Your Success</h3>
                        <p className="text-muted-foreground text-sm">Let your network know about your new skills.</p>
                        <div className="flex gap-2 justify-center mt-4">
                           <Button variant="outline" asChild>
                                <a href={linkedinShareUrl} target="_blank" rel="noopener noreferrer">
                                    <Linkedin className="mr-2" /> LinkedIn
                                </a>
                           </Button>
                           <Button variant="outline" asChild>
                                <a href={twitterShareUrl} target="_blank" rel="noopener noreferrer">
                                    <Twitter className="mr-2" /> Twitter
                                </a>
                           </Button>
                        </div>
                    </div>
                </div>
                <div className="p-4 border rounded-lg bg-muted/30 aspect-[10/7] flex items-center justify-center">
                    {certificateImage ? (
                        <Image 
                            src={certificateImage} 
                            alt="Certificate Preview" 
                            width={500} 
                            height={350} 
                            className="object-contain"
                        />
                    ) : (
                        <p className="text-muted-foreground">Generating preview...</p>
                    )}
                </div>
            </CardContent>
            <CardFooter className="bg-muted/50 p-6 flex-col sm:flex-row">
                 <div className="flex-1 text-center sm:text-left">
                    <h3 className="font-semibold text-lg flex items-center justify-center sm:justify-start gap-2">
                        <BookOpen />
                        What&apos;s Next?
                    </h3>
                    <p className="text-muted-foreground text-sm">Continue your learning journey and explore more courses.</p>
                </div>
                <Button variant="default" onClick={() => router.push('/')} className="mt-4 sm:mt-0 w-full sm:w-auto">
                    Explore More Courses <ArrowRight className="ml-2" />
                </Button>
            </CardFooter>
        </Card>
      </main>

      {/* Hidden certificate for rendering high-quality PDF */}
      <div className="absolute -left-[9999px] -top-[9999px]">
        <Certificate ref={certificateRef} course={course} studentName={user?.displayName || 'Valued Student'} />
      </div>
    </div>
  );
}
