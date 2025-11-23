'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Course } from '@/lib/data-types';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';

type PopularCoursesCarouselProps = {
    courses: Course[];
    isLoading?: boolean;
};

export function PopularCoursesCarousel({ courses, isLoading }: PopularCoursesCarouselProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const popularCourses = courses.slice(0, 6);
    const coursesPerPage = 3;
    const totalPages = Math.ceil(popularCourses.length / coursesPerPage);

    const scrollToPage = (pageIndex: number) => {
        const container = scrollContainerRef.current;
        if (!container) return;

        // Calculate the width of a single card including its gap
        // This assumes all cards have the same width and gap
        const firstCard = container.querySelector('.flex-shrink-0');
        if (!firstCard) return;

        const cardWidth = firstCard.clientWidth;
        const gap = parseFloat(window.getComputedStyle(container).gap || '0px');
        const itemWidthWithGap = cardWidth + gap;

        const scrollPosition = pageIndex * coursesPerPage * itemWidthWithGap;

        container.scrollTo({
            left: scrollPosition,
            behavior: 'smooth',
        });

        setCurrentPage(pageIndex);
    };

    const handleScroll = () => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const firstCard = container.querySelector('.flex-shrink-0');
        if (!firstCard) return;

        const cardWidth = firstCard.clientWidth;
        const gap = parseFloat(window.getComputedStyle(container).gap || '0px');
        const itemWidthWithGap = cardWidth + gap;

        const scrollPosition = container.scrollLeft;
        // Calculate the current page based on scroll position and items per page
        const newPage = Math.round(scrollPosition / (coursesPerPage * itemWidthWithGap));

        if (newPage !== currentPage) {
            setCurrentPage(newPage);
        }
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            // Initial check for scroll position if component mounts with scroll already applied
            handleScroll();
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [currentPage, popularCourses.length]); // Re-run if courses change

    return (
        <section className="py-16 md:py-24 px-4 rounded-2xl bg-gray-800 relative overflow-hidden">
            <div className="container mx-auto">
                <div className="grid lg:grid-cols-[400px_1fr] gap-12 items-center">
                    {/* Left Side - Text Content */}
                    <div className="space-y-6">
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                            Learn essential career and life skills
                        </h2>
                        <p className="text-lg text-white leading-relaxed">
                            Internadda helps you build in-demand skills fast and advance your career in a changing job market.
                        </p>
                    </div>

                    {/* Right Side - Course Cards Carousel */}
                    <div className="relative">
                        {/* Navigation Buttons */}
                        <div className="flex gap-3  justify-end mb-6">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 rounded-full border-2 disabled:opacity-30"
                                onClick={() => scrollToPage(Math.max(0, currentPage - 1))}
                                disabled={currentPage === 0}
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 rounded-full border-2 disabled:opacity-30"
                                onClick={() => scrollToPage(Math.min(totalPages - 1, currentPage + 1))}
                                disabled={currentPage >= totalPages - 1}
                            >
                                <ChevronRight className="h-5 w-5z" />
                            </Button>
                        </div>

                        {/* Course Cards */}
                        <div
                            ref={scrollContainerRef}
                            className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory"
                            style={{
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                            }}
                        >
                            {isLoading ? (
                                <>
                                    {[...Array(3)].map((_, i) => (
                                        <Card key={i} className="flex-shrink-0 w-[280px] snap-start overflow-hidden">
                                            <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
                                            <div className="p-5 space-y-3">
                                                <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
                                                <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4" />
                                            </div>
                                        </Card>
                                    ))}
                                </>
                            ) : popularCourses.length > 0 ? (
                                popularCourses.map((course, index) => (
                                    <Link
                                        key={course.id}
                                        href={`/courses/${course.id}`}
                                        className="flex-shrink-0 w-[280px] snap-start group"
                                    >
                                        <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl h-full">
                                            {/* Course Image */}
                                            <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden">
                                                <Image
                                                    src={course.thumbnail}
                                                    alt={course.title}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                {/* Price Badge */}
                                                <div className="absolute top-3 left-3">
                                                    <Badge className={`${course.isFree ? 'bg-green-500/90 hover:bg-green-600 border-green-400' : 'bg-blue-600/90 hover:bg-blue-700 border-blue-500'} text-white backdrop-blur-sm shadow-lg font-semibold`}>
                                                        {course.isFree ? 'FREE' : `₹${course.price}`}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Course Info */}
                                            <div className="p-5 bg-white">
                                                {/* Student Count Badge */}
                                                <div className="flex items-center gap-1.5 text-gray-600 mb-3">
                                                    <Users className="w-4 h-4" />
                                                    <span className="text-sm font-semibold">
                                                        {index === 0 ? '17M+' : index === 1 ? '18M+' : index === 2 ? '2.1M+' : '1M+'}
                                                    </span>
                                                </div>

                                                {/* Course Title */}
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
                                                        {course.title}
                                                    </h3>
                                                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                                                </div>
                                            </div>
                                        </Card>
                                    </Link>
                                ))
                            ) : (
                                <div className="w-full text-center py-12">
                                    <p className="text-gray-500">No courses available</p>
                                </div>
                            )}
                        </div>

                        {/* Pagination Dots */}
                        {!isLoading && popularCourses.length > coursesPerPage && (
                            <div className="flex justify-center gap-2 mt-6">
                                {Array.from({ length: totalPages }).map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => scrollToPage(index)}
                                        className={`h-2 rounded-full transition-all duration-300 ${index === currentPage
                                            ? 'w-8 bg-primary'
                                            : 'w-2 bg-gray-300 hover:bg-gray-400'
                                            }`}
                                        aria-label={`Go to page ${index + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
