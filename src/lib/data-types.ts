export type Lesson = {
  id: string;
  title: string;
  type: 'video' | 'text';
  duration?: number; // in minutes, now optional
  content: string; // youtube video ID or markdown content
  transcript?: string;
  order: number;
};

export type Course = {
  id: string;
  title: string;
  description: string;
  instructor: string;
  instructorId: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[];
  thumbnail: string;
};

export type UserProgress = {
  userId: string;
  courseId: string;
  completedLessons: string[];
  totalLessons: number;
  percentage: number;
  lastLessonId?: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'Student' | 'Instructor' | 'Admin';
};

export type Note = {
  id: string;
  userId: string;
  lessonId: string;
  content: string;
  timestamp: any; // Firestore timestamp
}
