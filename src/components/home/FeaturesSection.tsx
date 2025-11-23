'use client';

import Image from 'next/image';
import { Rocket, Target, Zap, Shield, Users, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const features = [
    {
        icon: Rocket,
        title: 'Fast-Track Your Career',
        description: 'Learn industry-relevant skills and land your dream job faster with our structured learning paths.',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
    },
    {
        icon: Target,
        title: 'Job-Ready Skills',
        description: 'Master practical skills that employers are actively seeking in today\'s competitive job market.',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
    },
    {
        icon: Zap,
        title: 'Learn at Your Pace',
        description: 'Flexible learning schedules that fit your lifestyle. Study anytime, anywhere, on any device.',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
    },
    {
        icon: Shield,
        title: '100% Free Courses',
        description: 'Access high-quality education without any cost. No hidden fees, no subscriptions required.',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
    },
    {
        icon: Users,
        title: 'Expert Instructors',
        description: 'Learn from industry professionals with years of real-world experience and expertise.',
        color: 'text-pink-600',
        bgColor: 'bg-pink-100',
    },
    {
        icon: Trophy,
        title: 'Verified Certificates',
        description: 'Earn recognized certificates upon completion to showcase your achievements to employers.',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
    },
];

export function FeaturesSection() {
    return (
        <>
            {/* Why Choose Us Section */}
            <section className="py-16 md:py-24 px-4 bg-background">
                <div className="container mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                            Why Choose Internadda?
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            We're committed to helping you achieve your career goals with quality education and real opportunities
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <Card
                                key={index}
                                className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group"
                            >
                                <CardContent className="p-6">
                                    <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                        <feature.icon className={`w-7 h-7 ${feature.color}`} />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">
                                        {feature.title}
                                    </h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {feature.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Image-Based CTA Sections */}
            <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-accent/5 to-background">
                <div className="container mx-auto space-y-24">
                    {/* Career Growth Section */}
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="order-2 md:order-1">
                            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                                <Image
                                    src="/images/career-growth.png"
                                    alt="Career Growth Illustration"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>
                        <div className="order-1 md:order-2">
                            <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full mb-4 text-sm font-semibold">
                                Career Advancement
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                                Accelerate Your Career Growth
                            </h2>
                            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                                Our courses are designed to help you climb the career ladder faster. With industry-aligned curriculum and practical projects, you'll gain the skills that employers value most.
                            </p>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-muted-foreground">Industry-recognized certifications</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-muted-foreground">Real-world project experience</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-muted-foreground">Direct path to paid internships</span>
                                </li>
                            </ul>
                            <Button asChild size="lg">
                                <Link href="/courses">Explore Courses</Link>
                            </Button>
                        </div>
                    </div>

                    {/* Online Learning Section */}
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-block px-4 py-2 bg-purple-100 text-purple-600 rounded-full mb-4 text-sm font-semibold">
                                Flexible Learning
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                                Learn Anytime, Anywhere
                            </h2>
                            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                                Access world-class education from the comfort of your home. Our platform is designed for modern learners who need flexibility without compromising on quality.
                            </p>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-muted-foreground">24/7 access to course materials</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-muted-foreground">Mobile-friendly platform</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span className="text-muted-foreground">Self-paced learning modules</span>
                                </li>
                            </ul>
                            <Button asChild size="lg" variant="outline">
                                <Link href="/courses">Start Learning Today</Link>
                            </Button>
                        </div>
                        <div>
                            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                                <Image
                                    src="/images/online-learning.png"
                                    alt="Online Learning"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
