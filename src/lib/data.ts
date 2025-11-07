import { PlaceHolderImages } from './placeholder-images';

export type Lesson = {
  id: string;
  title: string;
  type: 'video' | 'text';
  duration: number; // in minutes
  content: string; // youtube video ID or markdown content
  transcript?: string;
};

export type Course = {
  id: string;
  title: string;
  description: string;
  instructor: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[];
  thumbnail: string;
  lessons: Lesson[];
};

export type UserProgress = {
  courseId: string;
  completedLessons: string[];
  totalLessons: number;
  percentage: number;
  lastLessonId?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'Student' | 'Instructor' | 'Admin';
  enrolledCourses: string[];
  progress: UserProgress[];
};

const findImage = (id: string) => PlaceHolderImages.find(img => img.id === id)?.imageUrl || '';

export const lessons: Record<string, Lesson[]> = {
  'js-mastery': [
    { id: 'js1', title: 'Introduction to JavaScript', type: 'video', duration: 12, content: 'W6NZfCO5SIk', transcript: 'Welcome to the introduction to JavaScript. In this video, we will cover the basics of what JavaScript is and why it is so popular. We will start by looking at the history of JavaScript and how it has evolved over the years. Then, we will discuss the key features of the language, such as its dynamic typing and first-class functions. By the end of this video, you will have a solid understanding of what JavaScript is and be ready to start writing your own code.' },
    { id: 'js2', title: 'Variables and Data Types', type: 'text', duration: 8, content: '## Variables\n\nIn JavaScript, we use `var`, `let`, and `const` to declare variables. This is a core concept that you must understand to be a successful JavaScript developer.' },
    { id: 'js3', title: 'Functions and Scope', type: 'video', duration: 15, content: 'W6NZfCO5SIk', transcript: 'In this lesson, we will dive into functions and scope in JavaScript. Functions are one of the fundamental building blocks in JavaScript. We will learn how to declare functions, and the difference between function declarations and function expressions. We will also explore the concept of scope, including global scope, function scope, and block scope. Understanding scope is crucial for writing clean and bug-free code. Join us as we explore these important concepts.' },
  ],
  'react-foundations': [
    { id: 'react1', title: 'What is React?', type: 'video', duration: 10, content: 'SqcY0GlETPk', transcript: 'What is React? React is a JavaScript library for building user interfaces. It lets you compose complex UIs from small and isolated pieces of code called “components”. React has a few different kinds of components, but we’ll start with `React.Component` subclasses. We will cover components, props, and state in this comprehensive introduction. This will be a fun and exciting journey into the world of React!' },
    { id: 'react2', title: 'Components and Props', type: 'text', duration: 15, content: '## Components\n\nComponents are the building blocks of React applications. They are like JavaScript functions that accept inputs (called “props”) and return React elements describing what should appear on the screen.' },
    { id: 'react3', title: 'State and Lifecycle', type: 'video', duration: 20, content: 'SqcY0GlETPk', transcript: 'In this video, we will explore state and lifecycle methods in React. State allows components to be dynamic and interactive. We will learn how to use the `useState` hook to manage state in functional components. Additionally, we will cover the component lifecycle and how to use the `useEffect` hook to handle side effects, such as fetching data or subscribing to events. By the end of this lesson, you will be able to build powerful and interactive React components.' },
  ],
  'python-for-ds': [
    { id: 'py1', title: 'Python Basics', type: 'video', duration: 18, content: 'kqtD5dpn9C8', transcript: 'This lesson covers the basics of Python, a powerful and versatile programming language. We will start with the fundamental syntax, including variables, data types, and operators. Then, we will move on to control structures like loops and conditional statements. This foundation is essential for anyone looking to get into data science, web development, or automation with Python. Let\'s get started on your Python journey!' },
    { id: 'py2', title: 'Introduction to Pandas', type: 'video', duration: 25, content: 'kqtD5dpn9C8', transcript: 'Pandas is a must-know library for any data scientist working with Python. In this introduction, we will learn how to work with DataFrames, the primary data structure in Pandas. We will cover how to create, read, and write data, as well as how to perform basic data manipulation and analysis. Get ready to unlock the power of data with Pandas.' },
    { id: 'py3', title: 'Data Visualization with Matplotlib', type: 'text', duration: 20, content: '## Matplotlib\n\nMatplotlib is a powerful library for creating static, animated, and interactive visualizations in Python. You can generate plots, histograms, power spectra, bar charts, error charts, scatterplots, etc., with just a few lines of code.' },
  ],
   'nodejs-backend': [
    { id: 'node1', title: 'Intro to Node.js', type: 'video', duration: 10, content: 'fBNz5xF-Kx4', transcript: 'Node.js is a runtime environment that allows you to run JavaScript on the server. In this video, we will explore what Node.js is, its architecture, and why it is a great choice for building fast and scalable backend services. We will cover the event loop, non-blocking I/O, and the Node.js module system. Let\'s start building powerful backends with Node.js.' },
    { id: 'node2', title: 'Building a REST API with Express', type: 'video', duration: 30, content: 'fBNz5xF-Kx4', transcript: 'Express is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications. In this tutorial, we will build a complete REST API from scratch. We will cover routing, middleware, and handling requests and responses. You will learn how to create endpoints for CRUD operations and structure your Express application for maintainability.' },
    { id: 'node3', title: 'Connecting to a Database', type: 'text', duration: 15, content: '## Connecting to DB\n\nWe will use Prisma to connect to our PostgreSQL database. Prisma is a next-generation ORM that makes it easy to work with databases. It provides a type-safe query builder and a powerful migration system.' },
  ],
};

export const courses: Course[] = [
  {
    id: 'js-mastery',
    title: 'JavaScript Mastery',
    description: 'A comprehensive guide to modern JavaScript, from fundamentals to advanced topics.',
    instructor: 'John Doe',
    category: 'Web Development',
    difficulty: 'Intermediate',
    tags: ['JavaScript', 'ES6+', 'Web Dev'],
    thumbnail: findImage('course-js-thumb'),
    lessons: lessons['js-mastery'],
  },
  {
    id: 'react-foundations',
    title: 'React Foundations',
    description: 'Learn the fundamentals of React to build fast, scalable web applications.',
    instructor: 'Jane Smith',
    category: 'Web Development',
    difficulty: 'Beginner',
    tags: ['React', 'Frontend', 'JavaScript'],
    thumbnail: findImage('course-react-thumb'),
    lessons: lessons['react-foundations'],
  },
  {
    id: 'python-for-ds',
    title: 'Python for Data Science',
    description: 'Master Python for data analysis, visualization, and machine learning.',
    instructor: 'Emily White',
    category: 'Data Science',
    difficulty: 'Beginner',
    tags: ['Python', 'Data Science', 'Pandas'],
    thumbnail: findImage('course-python-thumb'),
    lessons: lessons['python-for-ds'],
  },
  {
    id: 'nodejs-backend',
    title: 'Node.js Backend Development',
    description: 'Build robust and scalable server-side applications with Node.js and Express.',
    instructor: 'Michael Brown',
    category: 'Web Development',
    difficulty: 'Intermediate',
    tags: ['Node.js', 'Backend', 'API'],
    thumbnail: findImage('course-node-thumb'),
    lessons: lessons['nodejs-backend'],
  },
  {
    id: 'ux-design-principles',
    title: 'UX Design Principles',
    description: 'Learn the core principles of User Experience design to create intuitive products.',
    instructor: 'Chris Green',
    category: 'Design',
    difficulty: 'Beginner',
    tags: ['UX', 'Design', 'UI'],
    thumbnail: findImage('course-ux-thumb'),
    lessons: [],
  },
  {
    id: 'sql-deep-dive',
    title: 'SQL Deep Dive',
    description: 'From basic queries to advanced data modeling, become an SQL expert.',
    instructor: 'Patricia Black',
    category: 'Data Science',
    difficulty: 'Intermediate',
    tags: ['SQL', 'Database', 'Data'],
    thumbnail: findImage('course-sql-thumb'),
    lessons: [],
  },
  {
    id: 'docker-and-kubernetes',
    title: 'Docker & Kubernetes',
    description: 'Master containerization and orchestration for modern application deployment.',
    instructor: 'Frank Blue',
    category: 'DevOps',
    difficulty: 'Advanced',
    tags: ['Docker', 'Kubernetes', 'DevOps'],
    thumbnail: findImage('course-docker-thumb'),
    lessons: [],
  },
  {
    id: 'intro-to-ai',
    title: 'Introduction to AI',
    description: 'Explore the exciting world of Artificial Intelligence and its applications.',
    instructor: 'Laura Yellow',
    category: 'AI',
    difficulty: 'Beginner',
    tags: ['AI', 'Machine Learning'],
    thumbnail: findImage('course-ai-thumb'),
    lessons: [],
  },
];

export const users: User[] = [
    {
        id: 'user1',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        avatar: 'https://picsum.photos/seed/user1/100/100',
        role: 'Student',
        enrolledCourses: ['js-mastery', 'react-foundations', 'python-for-ds'],
        progress: [
            { courseId: 'js-mastery', completedLessons: ['js1', 'js2'], totalLessons: 3, percentage: 66, lastLessonId: 'js2' },
            { courseId: 'react-foundations', completedLessons: ['react1'], totalLessons: 3, percentage: 33, lastLessonId: 'react1' },
            { courseId: 'python-for-ds', completedLessons: [], totalLessons: 3, percentage: 0 },
        ],
    },
    {
        id: 'user2',
        name: 'Bob Williams',
        email: 'bob@example.com',
        avatar: 'https://picsum.photos/seed/user2/100/100',
        role: 'Student',
        enrolledCourses: ['nodejs-backend'],
        progress: [
            { courseId: 'nodejs-backend', completedLessons: ['node1'], totalLessons: 3, percentage: 33, lastLessonId: 'node1' },
        ]
    },
    {
        id: 'user3',
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        avatar: 'https://picsum.photos/seed/user3/100/100',
        role: 'Admin',
        enrolledCourses: [],
        progress: []
    },
     {
        id: 'user4',
        name: 'Diana Prince',
        email: 'diana@example.com',
        avatar: 'https://picsum.photos/seed/user4/100/100',
        role: 'Instructor',
        enrolledCourses: [],
        progress: []
    }
];

export const mainUser: User = users[0];
