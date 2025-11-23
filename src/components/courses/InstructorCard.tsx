import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Award,
  Briefcase,
  Users,
  Star,
  ExternalLink,
  Mail,
  Github,
  Linkedin,
  Twitter,
  Globe,
} from 'lucide-react';
import type { InstructorProfile } from '@/lib/data-types';

interface InstructorCardProps {
  instructor: InstructorProfile;
  instructorEmail?: string;
  courseCount?: number;
  studentCount?: number;
}

export function InstructorCard({
  instructor,
  instructorEmail,
  courseCount,
  studentCount,
}: InstructorCardProps) {
  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'twitter':
        return <Twitter className="h-4 w-4" />;
      case 'linkedin':
        return <Linkedin className="h-4 w-4" />;
      case 'github':
        return <Github className="h-4 w-4" />;
      case 'website':
        return <Globe className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const socialLinks = [
    {
      name: 'twitter',
      url: instructor.socialLinks?.twitter,
      icon: getSocialIcon('twitter'),
    },
    {
      name: 'linkedin',
      url: instructor.socialLinks?.linkedin,
      icon: getSocialIcon('linkedin'),
    },
    {
      name: 'github',
      url: instructor.socialLinks?.github,
      icon: getSocialIcon('github'),
    },
    {
      name: 'website',
      url: instructor.socialLinks?.website,
      icon: getSocialIcon('website'),
    },
  ].filter((link) => link.url);

  return (
    <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
      {/* Header Background */}
      <div className="h-24 bg-gradient-to-r from-primary/20 to-primary/5" />

      <CardContent className="p-6 -mt-12 relative">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
              <AvatarImage src={instructor.avatar} alt={instructor.name} />
              <AvatarFallback className="text-xl font-bold bg-gradient-to-br from-primary to-primary/70 text-white">
                {instructor.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-1">{instructor.name}</h3>
            <p className="text-muted-foreground font-medium mb-2">{instructor.specialization}</p>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-4 mb-4">
              {instructor.yearsOfExperience > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <span>{instructor.yearsOfExperience}+ years experience</span>
                </div>
              )}
              {courseCount !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <Award className="h-4 w-4 text-primary" />
                  <span>{courseCount} courses</span>
                </div>
              )}
              {studentCount !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-primary" />
                  <span>{studentCount} students</span>
                </div>
              )}
              {instructor.rating && (
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span>{instructor.rating} rating</span>
                </div>
              )}
            </div>

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex gap-2">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title={link.name}
                  >
                    {link.icon}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <Separator className="my-6" />

        {/* Qualification & Bio */}
        <div className="space-y-4 mb-6">
          {instructor.qualification && (
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-1">Qualification</p>
              <p className="text-sm">{instructor.qualification}</p>
            </div>
          )}

          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">About</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{instructor.bio}</p>
          </div>
        </div>

        {/* Expertise */}
        {instructor.expertise && instructor.expertise.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-3">Expertise</p>
            <div className="flex flex-wrap gap-2">
              {instructor.expertise.map((skill) => (
                <Badge key={skill} variant="secondary" className="px-3 py-1">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Contact Button */}
        {instructorEmail && (
          <Button
            asChild
            variant="outline"
            className="w-full mt-6"
          >
            <a href={`mailto:${instructorEmail}`}>
              <Mail className="mr-2 h-4 w-4" />
              Contact Instructor
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
