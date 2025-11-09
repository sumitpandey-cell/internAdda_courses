
'use client';

import React from 'react';
import { BookOpen, Award } from 'lucide-react';
import type { Course } from '@/lib/data-types';
import { cn } from '@/lib/utils';

interface CertificateProps extends React.HTMLAttributes<HTMLDivElement> {
  course: Course;
  studentName: string;
}

export const Certificate = React.forwardRef<HTMLDivElement, CertificateProps>(
  ({ course, studentName, className, ...props }, ref) => {
    const completionDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <div
        ref={ref}
        className={cn(
          'w-[1000px] h-[700px] bg-white text-gray-800 p-8 flex flex-col items-center justify-center border-4 border-yellow-500 relative font-serif',
          className
        )}
        style={{ fontFamily: '"Garamond", "Times New Roman", serif' }}
        {...props}
      >
        {/* Ornate Border */}
        <div className="absolute inset-0 border-2 border-yellow-600 m-2"></div>
        <div className="absolute inset-0 border-1 border-yellow-700 m-4"></div>

        <div className="text-center z-10">
          <div className="flex justify-center items-center mb-4">
            <BookOpen className="h-12 w-12 text-primary" />
            <h1 className="ml-3 text-3xl font-bold font-headline text-primary" style={{fontFamily: "Inter, sans-serif"}}>Internadda Courses</h1>
          </div>
          
          <p className="text-xl mt-8">This certificate is proudly presented to</p>

          <h2 className="text-6xl font-bold text-primary my-8 tracking-wider">
            {studentName}
          </h2>

          <p className="text-xl">for the successful completion of the course</p>

          <h3 className="text-4xl font-semibold my-6">
            &ldquo;{course.title}&rdquo;
          </h3>

          <div className="flex justify-around items-center w-full max-w-2xl mx-auto mt-16 text-sm">
            <div className="text-center">
              <p className="font-bold text-lg">{course.instructor}</p>
              <hr className="border-t-2 border-gray-700 my-2" />
              <p className="text-xs">Lead Instructor</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-lg">{completionDate}</p>
              <hr className="border-t-2 border-gray-700 my-2" />
              <p className="text-xs">Date of Completion</p>
            </div>
          </div>
        </div>
        
        {/* Seal */}
        <div className="absolute bottom-10 right-10 flex items-center justify-center h-24 w-24 rounded-full bg-yellow-500 text-white">
            <div className="flex items-center justify-center h-20 w-20 rounded-full border-2 border-dashed border-white">
                <Award className="h-10 w-10" />
            </div>
        </div>
      </div>
    );
  }
);

Certificate.displayName = 'Certificate';
