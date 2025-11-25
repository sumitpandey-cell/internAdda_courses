'use client';

import { useParams } from 'next/navigation';
import LessonContent from '../lesson-content';

export default function LessonPage() {
  const params = useParams<{ courseId: string; lessonId: string }>();
  const { courseId, lessonId } = params;

  return (
    <LessonContent
      courseId={courseId}
      currentLessonId={lessonId}
    />
  );
}
