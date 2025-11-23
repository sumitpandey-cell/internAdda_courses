'use client';

import { useEffect, useRef } from 'react';
import { Star, Quote, Award, TrendingUp, Briefcase, GraduationCap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const testimonials = [
    {
        name: 'Priya Sharma',
        role: 'Data Analyst',
        company: 'TechCorp',
        image: null,
        achievement: 'Landed Dream Job',
        testimonial: 'After completing the Data Science course, I secured a position at TechCorp with a 60% salary increase. The practical projects and real-world scenarios prepared me perfectly for the interview.',
        course: 'Data Science Fundamentals',
        rating: 5,
    },
    {
        name: 'Rahul Verma',
        role: 'Full Stack Developer',
        company: 'CloudNine Systems',
        image: null,
        achievement: 'Career Switch',
        testimonial: 'I transitioned from a non-tech background to becoming a full-stack developer. The Web Development course was comprehensive and the internship opportunity helped me gain real experience.',
        course: 'Web Development Bootcamp',
        rating: 5,
    },
    {
        name: 'Ananya Patel',
        role: 'AI Engineer',
        company: 'AI Innovations',
        image: null,
        achievement: 'Skill Upgrade',
        testimonial: 'The AI and Machine Learning course exceeded my expectations. Within 3 months of completion, I got promoted to AI Engineer with a significant pay raise.',
        course: 'AI & Machine Learning',
        rating: 5,
    },
    {
        name: 'Arjun Reddy',
        role: 'DevOps Engineer',
        company: 'DevOps Pro',
        image: null,
        achievement: 'First Tech Job',
        testimonial: 'As a fresh graduate, the Cloud & DevOps course gave me the edge I needed. The certification and hands-on projects helped me land my first job in just 2 weeks!',
        course: 'Cloud & DevOps',
        rating: 5,
    },
    {
        name: 'Sneha Gupta',
        role: 'Cybersecurity Analyst',
        company: 'SecureNet',
        image: null,
        achievement: 'Industry Recognition',
        testimonial: 'The Cybersecurity course was incredibly detailed and practical. I now work on protecting critical infrastructure and couldn\'t be happier with my career path.',
        course: 'Cybersecurity Essentials',
        rating: 5,
    },
    {
        name: 'Vikram Singh',
        role: 'Product Manager',
        company: 'TechCorp',
        image: null,
        achievement: 'Role Transition',
        testimonial: 'The comprehensive curriculum helped me transition from engineering to product management. The strategic thinking and user-centric approach I learned were invaluable.',
        course: 'Product Management',
        rating: 5,
    },
    {
        name: 'Meera Krishnan',
        role: 'UX Designer',
        company: 'DesignHub',
        image: null,
        achievement: 'Creative Breakthrough',
        testimonial: 'The design thinking course transformed my approach to problem-solving. I now lead design projects for major clients and love every moment of it.',
        course: 'UX/UI Design',
        rating: 5,
    },
];

const stats = [
    {
        icon: GraduationCap,
        value: '10,000+',
        label: 'Students Enrolled',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
    },
    {
        icon: Briefcase,
        value: '85%',
        label: 'Placement Rate',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
    },
    {
        icon: Award,
        value: '500+',
        label: 'Certificates Issued',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
    },
    {
        icon: TrendingUp,
        value: '40%',
        label: 'Avg. Salary Increase',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
    },
];

function TestimonialCard({ testimonial }: { testimonial: typeof testimonials[0] }) {
    return (
        <Card className="flex-shrink-0 w-[380px] border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl group">
            <CardContent className="p-6">
                {/* Quote Icon */}
                <div className="mb-4">
                    <Quote className="w-8 h-8 text-primary/20 fill-current" />
                </div>

                {/* Testimonial Text */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 line-clamp-4">
                    "{testimonial.testimonial}"
                </p>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                    ))}
                </div>

                {/* Achievement Badge */}
                <Badge variant="secondary" className="mb-4 bg-green-100 text-green-800 border-green-200">
                    <Award className="w-3 h-3 mr-1" />
                    {testimonial.achievement}
                </Badge>

                {/* User Info */}
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <Avatar className="h-12 w-12 border-2 border-primary/20">
                        <AvatarImage src={testimonial.image || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {testimonial.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm">
                            {testimonial.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            {testimonial.role} at {testimonial.company}
                        </p>
                        <p className="text-xs text-primary font-medium mt-1">
                            {testimonial.course}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function TestimonialsSection() {
    const scrollerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const scroller = scrollerRef.current;
        if (!scroller) return;

        let animationId: number;
        let scrollPosition = 0;
        const scrollSpeed = 0.5; // pixels per frame

        const animate = () => {
            scrollPosition += scrollSpeed;

            // Reset when we've scrolled past the first set of cards
            // Each card is 380px + 24px gap = 404px
            const cardWidth = 404;
            const totalWidth = cardWidth * testimonials.length;

            if (scrollPosition >= totalWidth) {
                scrollPosition = 0;
            }

            scroller.style.transform = `translateX(-${scrollPosition}px)`;
            animationId = requestAnimationFrame(animate);
        };

        animationId = requestAnimationFrame(animate);

        // Pause on hover
        const handleMouseEnter = () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };

        const handleMouseLeave = () => {
            animationId = requestAnimationFrame(animate);
        };

        scroller.addEventListener('mouseenter', handleMouseEnter);
        scroller.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            scroller.removeEventListener('mouseenter', handleMouseEnter);
            scroller.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return (
        <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-background via-accent/5 to-background overflow-hidden">
            <div className="container mx-auto">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <Badge className="mb-4 px-4 py-1.5 bg-primary/10 text-primary border-primary/20">
                        <Star className="w-3 h-3 mr-1 inline fill-current" />
                        Success Stories
                    </Badge>
                    <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                        What Our Learners Are Achieving
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Real stories from real students who transformed their careers through our courses
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16">
                    {stats.map((stat, index) => (
                        <Card key={index} className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                            <CardContent className="p-6 text-center">
                                <div className={`w-12 h-12 ${stat.bgColor} rounded-full flex items-center justify-center mx-auto mb-3`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-muted-foreground font-medium">
                                    {stat.label}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Infinite Scrolling Testimonials */}
                <div className="relative">
                    {/* Blur Overlays */}
                    <div className="absolute left-0 top-0 bottom-0 w-32 md:w-48 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-32 md:w-48 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none" />

                    {/* Scrolling Container */}
                    <div className="overflow-hidden py-4">
                        <div
                            ref={scrollerRef}
                            className="flex gap-6 will-change-transform"
                            style={{ width: 'max-content' }}
                        >
                            {/* Render testimonials twice for seamless loop */}
                            {[...testimonials, ...testimonials].map((testimonial, index) => (
                                <TestimonialCard key={index} testimonial={testimonial} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
