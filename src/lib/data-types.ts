
export type Lesson = {
  id: string;
  title: string;
  type: 'video' | 'text';
  duration?: number; // in minutes, now optional
  content: string; // youtube video ID or markdown content
  transcript?: string;
  order: number;
  section?: string; // Section name for grouping lessons
};

export type InstructorProfile = {
  id: string;
  userId: string;
  name: string;
  bio: string;
  avatar: string;
  expertise: string[]; // Array of skills/specializations
  yearsOfExperience: number;
  qualification: string;
  specialization: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
    github?: string;
  };
  totalStudents?: number;
  totalCourses?: number;
  rating?: number;
  reviews?: number;
  createdAt?: any; // Firestore timestamp
};

export type Course = {
  id: string;
  title: string;
  description: string;
  instructor: string;
  instructorId: string;
  instructorBio: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[];
  whatYouWillLearn: string[];
  prerequisites: string;
  thumbnail: string;
  price: number;
  isFree: boolean;
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

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  recommendedCourseIds?: string[];
}


// New types for testing feature
export type Question = {
  id: string;
  courseId: string;
  text: string;
  type: 'mcq' | 'text';
  options?: string[];
  correctAnswer: string;
  order: number;
}

export type TestAttempt = {
  id: string;
  userId: string;
  courseId: string;
  answers: { questionId: string, answer: string }[];
  score: number;
  passed: boolean;
  submittedAt: any; // Firestore timestamp
}

export type Purchase = {
  id: string;
  userId: string;
  courseId: string;
  amount: number;
  purchaseDate: any; // Firestore timestamp
  status: 'completed' | 'refunded';
};

export type SavedCourse = {
  id: string;
  userId: string;
  courseId: string;
  savedAt: any; // Firestore timestamp
};

export type Enrollment = {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: any; // Firestore timestamp
  status: 'active' | 'completed' | 'dropped';
};

