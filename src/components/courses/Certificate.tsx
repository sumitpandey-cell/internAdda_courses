
'use client';

import React from 'react';
import { BookOpen, Award } from 'lucide-react';
import type { Course } from '@/lib/data-types';
import { cn } from '@/lib/utils';
import Image from 'next/image';

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
          'w-[1000px] h-[700px] bg-slate-50 text-gray-800 p-8 flex flex-col items-center justify-center border-8 border-yellow-600/80 relative',
          className
        )}
        style={{ fontFamily: '"Garamond", "Times New Roman", serif' }}
        {...props}
      >
        {/* Ornate Border */}
        <div className="absolute inset-0 border-2 border-yellow-700/80 m-2"></div>
        <div className="absolute inset-0 border border-yellow-800/80 m-4"></div>

        <div className="text-center z-10 w-full">
          <div className="flex justify-center items-center mb-4">
            <BookOpen className="h-10 w-10 text-primary" />
            <h1 className="ml-3 text-2xl font-bold text-primary" style={{fontFamily: "Inter, sans-serif"}}>Internadda Courses</h1>
          </div>
          
          <p className="text-2xl mt-6">This certificate is proudly presented to</p>

          <h2 className="text-6xl font-bold text-primary my-6 tracking-wider" style={{ fontFamily: "'Dancing Script', cursive" }}>
            {studentName}
          </h2>

          <p className="text-2xl">for the successful completion of the course</p>

          <h3 className="text-4xl font-semibold my-4">
            &ldquo;{course.title}&rdquo;
          </h3>

          <div className="flex justify-around items-end w-full max-w-3xl mx-auto mt-12 text-sm">
            <div className="text-center w-48">
              <p className="font-bold text-lg">{course.instructor}</p>
              <hr className="border-t-2 border-gray-700 my-2" />
              <p className="text-xs">Lead Instructor</p>
            </div>

            {/* Seal */}
            <div className="relative flex items-center justify-center h-28 w-28 text-white">
                <div className="absolute inset-0 bg-yellow-500 rounded-full"></div>
                <div className="absolute inset-1 border-2 border-dashed border-white rounded-full"></div>
                <div className="relative z-10 flex flex-col items-center">
                    <Award className="h-10 w-10" />
                    <p className="text-xs font-bold mt-1">INTERNADDA</p>
                </div>
            </div>

            <div className="text-center w-48">
              <p className="font-['Dancing_Script',_cursive] text-4xl -mb-2">Sumit Pandey</p>
              <hr className="border-t-2 border-gray-700 my-2" />
              <p className="text-xs">CEO, Internadda</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

Certificate.displayName = 'Certificate';
