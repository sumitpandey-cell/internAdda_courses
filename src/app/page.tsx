'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CourseCard } from '@/components/courses/CourseCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Course } from '@/lib/data-types';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Search,
    Filter,
    X,
    SlidersHorizontal,
    GraduationCap,
    BookOpen,
    TrendingUp,
    Sparkles
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export default function CoursesPage() {
    const { firestore } = useFirebase();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('newest');
    const [showFilters, setShowFilters] = useState(false);

    const coursesQuery = useMemoFirebase(
        () => (firestore ? query(collection(firestore, 'courses')) : null),
        [firestore]
    );
    const { data: courses, isLoading } = useCollection<Course>(coursesQuery);

    const categories = [
        { value: 'all', label: 'All Domains', icon: BookOpen },
        { value: 'Artificial Intelligence', label: 'Artificial Intelligence', icon: Sparkles },
        { value: 'Data Science', label: 'Data Science', icon: TrendingUp },
        { value: 'Web Development', label: 'Web Development', icon: GraduationCap },
        { value: 'Cybersecurity', label: 'Cybersecurity', icon: Filter },
        { value: 'Prompt Engineering', label: 'Prompt Engineering', icon: Sparkles },
        { value: 'Cloud & DevOps', label: 'Cloud & DevOps', icon: BookOpen },
    ];

    const difficulties = ['all', 'Beginner', 'Intermediate', 'Advanced'];

    // Filter and sort courses
    const filteredAndSortedCourses = useMemo(() => {
        if (!courses) return [];

        let filtered = courses;

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (course) =>
                    course.title.toLowerCase().includes(query) ||
                    course.description.toLowerCase().includes(query) ||
                    course.instructor.toLowerCase().includes(query) ||
                    course.tags?.some(tag => tag.toLowerCase().includes(query))
            );
        }

        // Category filter
        if (selectedCategory !== 'all') {
            filtered = filtered.filter((course) => course.category === selectedCategory);
        }

        // Difficulty filter
        if (selectedDifficulty !== 'all') {
            filtered = filtered.filter((course) => course.difficulty === selectedDifficulty);
        }

        // Sort
        const sorted = [...filtered];
        switch (sortBy) {
            case 'title-asc':
                sorted.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'title-desc':
                sorted.sort((a, b) => b.title.localeCompare(a.title));
                break;
            case 'difficulty-asc':
                sorted.sort((a, b) => {
                    const order = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
                    return order[a.difficulty] - order[b.difficulty];
                });
                break;
            case 'difficulty-desc':
                sorted.sort((a, b) => {
                    const order = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
                    return order[b.difficulty] - order[a.difficulty];
                });
                break;
            default:
                // newest - keep original order
                break;
        }

        return sorted;
    }, [courses, searchQuery, selectedCategory, selectedDifficulty, sortBy]);

    const activeFiltersCount = useMemo(() => {
        let count = 0;
        if (selectedCategory !== 'all') count++;
        if (selectedDifficulty !== 'all') count++;
        if (searchQuery.trim()) count++;
        return count;
    }, [selectedCategory, selectedDifficulty, searchQuery]);

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedCategory('all');
        setSelectedDifficulty('all');
        setSortBy('newest');
    };

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-background via-background to-accent/5">
            <Header />
            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background py-16 md:py-24 px-4 border-b">
                    <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                    <div className="container mx-auto relative z-10">
                        <div className="text-center max-w-4xl mx-auto">
                            <Badge className="mb-4 text-sm px-4 py-1.5 bg-primary/10 text-primary border-primary/20">
                                <Sparkles className="w-3 h-3 mr-1 inline" />
                                Premium Courses
                            </Badge>
                            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                Explore Our Course Library
                            </h1>
                            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                                Master in-demand skills with our comprehensive, industry-aligned courses.
                                Complete courses, pass exams, and unlock paid internship opportunities.
                            </p>

                            {/* Search Bar */}
                            <div className="mt-10 max-w-2xl mx-auto">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input
                                        type="text"
                                        placeholder="Search courses by title, instructor, or tags..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-12 pr-12 h-14 text-base border-2 focus:border-primary shadow-lg"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Filters and Results Section */}
                <section className="py-8 px-4">
                    <div className="container mx-auto">
                        {/* Filter Bar */}
                        <div className="mb-8">
                            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                                {/* Mobile Filter Toggle */}
                                <Button
                                    variant="outline"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="lg:hidden w-full justify-between"
                                >
                                    <span className="flex items-center gap-2">
                                        <SlidersHorizontal className="h-4 w-4" />
                                        Filters
                                        {activeFiltersCount > 0 && (
                                            <Badge variant="secondary" className="ml-2">
                                                {activeFiltersCount}
                                            </Badge>
                                        )}
                                    </span>
                                    <Filter className="h-4 w-4" />
                                </Button>

                                {/* Desktop Filters */}
                                <div className={`flex flex-col sm:flex-row gap-3 w-full lg:w-auto ${showFilters ? 'flex' : 'hidden lg:flex'}`}>
                                    {/* Category Filter */}
                                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                        <SelectTrigger className="w-full sm:w-[200px] border-2">
                                            <SelectValue placeholder="Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat.value} value={cat.value}>
                                                    <div className="flex items-center gap-2">
                                                        <cat.icon className="h-4 w-4" />
                                                        {cat.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* Difficulty Filter */}
                                    <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                                        <SelectTrigger className="w-full sm:w-[180px] border-2">
                                            <SelectValue placeholder="Difficulty" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {difficulties.map((diff) => (
                                                <SelectItem key={diff} value={diff}>
                                                    {diff === 'all' ? 'All Levels' : diff}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {/* Sort By */}
                                    <Select value={sortBy} onValueChange={setSortBy}>
                                        <SelectTrigger className="w-full sm:w-[180px] border-2">
                                            <SelectValue placeholder="Sort by" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="newest">Newest First</SelectItem>
                                            <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                                            <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                                            <SelectItem value="difficulty-asc">Easiest First</SelectItem>
                                            <SelectItem value="difficulty-desc">Hardest First</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Results Count and Clear */}
                                <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
                                    <p className="text-sm text-muted-foreground">
                                        {isLoading ? (
                                            <Skeleton className="h-5 w-32" />
                                        ) : (
                                            <>
                                                <span className="font-semibold text-foreground">
                                                    {filteredAndSortedCourses.length}
                                                </span>{' '}
                                                {filteredAndSortedCourses.length === 1 ? 'course' : 'courses'} found
                                            </>
                                        )}
                                    </p>
                                    {activeFiltersCount > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearFilters}
                                            className="text-primary hover:text-primary/80"
                                        >
                                            <X className="h-4 w-4 mr-1" />
                                            Clear all
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Active Filters Display */}
                            {activeFiltersCount > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {searchQuery && (
                                        <Badge variant="secondary" className="gap-1 pr-1">
                                            Search: "{searchQuery}"
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="ml-1 hover:bg-background/50 rounded-full p-0.5"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    )}
                                    {selectedCategory !== 'all' && (
                                        <Badge variant="secondary" className="gap-1 pr-1">
                                            Category: {selectedCategory}
                                            <button
                                                onClick={() => setSelectedCategory('all')}
                                                className="ml-1 hover:bg-background/50 rounded-full p-0.5"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    )}
                                    {selectedDifficulty !== 'all' && (
                                        <Badge variant="secondary" className="gap-1 pr-1">
                                            Level: {selectedDifficulty}
                                            <button
                                                onClick={() => setSelectedDifficulty('all')}
                                                className="ml-1 hover:bg-background/50 rounded-full p-0.5"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Courses Grid */}
                        {isLoading ? (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {[...Array(8)].map((_, i) => (
                                    <CardSkeleton key={i} />
                                ))}
                            </div>
                        ) : filteredAndSortedCourses.length > 0 ? (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {filteredAndSortedCourses.map((course) => (
                                    <CourseCard key={course.id} course={course} />
                                ))}
                            </div>
                        ) : (
                            <Card className="p-12 text-center border-2 border-dashed">
                                <div className="max-w-md mx-auto">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">No courses found</h3>
                                    <p className="text-muted-foreground mb-4">
                                        We couldn't find any courses matching your criteria. Try adjusting your filters or search query.
                                    </p>
                                    <Button onClick={clearFilters} variant="outline">
                                        Clear all filters
                                    </Button>
                                </div>
                            </Card>
                        )}
                    </div>
                </section>

                {/* CTA Section */}
                <section className="bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground py-16 md:py-24 px-4 mt-16">
                    <div className="container mx-auto text-center">
                        <div className="max-w-3xl mx-auto">
                            <Badge className="mb-4 bg-white/20 text-white border-white/30">
                                <GraduationCap className="w-3 h-3 mr-1 inline" />
                                Career Opportunity
                            </Badge>
                            <h2 className="text-3xl md:text-5xl font-bold mb-6">
                                Ready to Launch Your Career?
                            </h2>
                            <p className="text-lg md:text-xl mb-8 text-primary-foreground/90 leading-relaxed">
                                Complete any course, pass the final exam with 70% or higher, and unlock access to
                                high-stipend paid internship opportunities with leading companies.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button
                                    asChild
                                    size="lg"
                                    variant="secondary"
                                    className="bg-white text-primary hover:bg-white/90 shadow-xl"
                                >
                                    <a href="https://www.internadda.com/intern/internship" target="_blank" rel="noopener noreferrer">
                                        View Internship Programs
                                    </a>
                                </Button>
                                <Button
                                    asChild
                                    size="lg"
                                    variant="outline"
                                    className="border-white/30 text-blue-700 hover:bg-white/10"
                                >
                                    <a href="https://www.internadda.com/about" target="_blank" rel="noopener noreferrer">
                                        Learn More About Us
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}

function CardSkeleton() {
    return (
        <Card className="overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
                <div className="pt-3 border-t">
                    <Skeleton className="h-4 w-full" />
                </div>
            </div>
        </Card>
    );
}
