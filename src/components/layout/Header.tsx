import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="px-4 lg:px-6 h-16 flex items-center bg-background/80 backdrop-blur-sm sticky top-0 z-50 border-b">
      <Link href="/" className="flex items-center justify-center">
        <BookOpen className="h-6 w-6 text-primary" />
        <span className="ml-2 text-xl font-bold font-headline">InternAdda Courses</span>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
        <Link
          href="/courses"
          className="text-sm font-medium hover:underline underline-offset-4"
        >
          Courses
        </Link>
        <Link
          href="/#features"
          className="text-sm font-medium hover:underline underline-offset-4"
        >
          Features
        </Link>
        <Link
          href="/#testimonials"
          className="text-sm font-medium hover:underline underline-offset-4"
        >
          Testimonials
        </Link>
        <Button asChild>
          <Link href="/login">Login</Link>
        </Button>
         <Button asChild variant="secondary">
          <Link href="/dashboard">My Dashboard</Link>
        </Button>
      </nav>
    </header>
  );
}
