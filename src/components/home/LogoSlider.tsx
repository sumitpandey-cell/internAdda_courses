'use client';

import { useEffect, useRef } from 'react';

const companies = [
    'TechCorp',
    'DataFlow Solutions',
    'CloudNine Systems',
    'AI Innovations',
    'SecureNet',
    'DevOps Pro',
    'CyberGuard',
    'QuantumLeap',
    'NexGen Tech',
    'FutureScale',
];

export function LogoSlider() {
    const sliderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const slider = sliderRef.current;
        if (!slider) return;

        let animationId: number;
        let position = 0;
        const speed = 0.5; // pixels per frame

        const animate = () => {
            position -= speed;

            // Reset position when first set of logos scrolls out
            if (Math.abs(position) >= slider.scrollWidth / 2) {
                position = 0;
            }

            slider.style.transform = `translateX(${position}px)`;
            animationId = requestAnimationFrame(animate);
        };

        animationId = requestAnimationFrame(animate);

        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }, []);

    return (
        <section className="py-12 bg-gradient-to-b from-background to-accent/5 border-y border-border/50 overflow-hidden">
            <div className="container mx-auto px-4">
                <p className="text-center text-sm font-semibold text-muted-foreground mb-8 tracking-wide uppercase">
                    Trusted by Students Joining Leading Companies
                </p>
                <div className="relative">
                    {/* Gradient Overlays */}
                    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

                    {/* Slider Container */}
                    <div className="overflow-hidden">
                        <div
                            ref={sliderRef}
                            className="flex gap-12 items-center will-change-transform"
                            style={{ width: 'max-content' }}
                        >
                            {/* Duplicate the array for seamless loop */}
                            {[...companies, ...companies].map((company, index) => (
                                <div
                                    key={index}
                                    className="flex-shrink-0 px-8 py-4 bg-card border border-border/50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 hover:border-primary/30"
                                >
                                    <span className="text-lg font-bold text-foreground/80 whitespace-nowrap">
                                        {company}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
