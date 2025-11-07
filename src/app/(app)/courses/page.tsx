"use client";

import { useState } from "react";
import { courses } from "@/lib/data";
import { CourseCard } from "@/components/courses/CourseCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

const categories = ["All", ...new Set(courses.map((c) => c.category))];
const difficulties = ["All", "Beginner", "Intermediate", "Advanced"];

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");
  const [difficulty, setDifficulty] = useState("All");

  const filteredCourses = courses.filter((course) => {
    return (
      (course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (category === "All" || course.category === category) &&
      (difficulty === "All" || course.difficulty === difficulty)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for courses..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              {difficulties.map((diff) => (
                <SelectItem key={diff} value={diff}>
                  {diff}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredCourses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
      {filteredCourses.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No courses found. Try adjusting your filters.
        </div>
      )}
    </div>
  );
}
