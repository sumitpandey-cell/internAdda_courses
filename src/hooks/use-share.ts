import { useToast } from '@/hooks/use-toast';

interface ShareOptions {
  title: string;
  description?: string;
  courseId: string;
}

export function useShare() {
  const { toast } = useToast();

  const share = async (options: ShareOptions) => {
    const { title, description, courseId } = options;
    const courseUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/courses/${courseId}`;
    const shareText = `Check out this amazing course: ${title}${description ? ' - ' + description : ''}`;

    try {
      // Check if Web Share API is available
      if (navigator.share) {
        await navigator.share({
          title: title,
          text: shareText,
          url: courseUrl,
        });
        
        toast({
          title: "Shared successfully!",
          description: "Course shared with your friends.",
        });
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(`${shareText}\n${courseUrl}`);
        
        toast({
          title: "Copied to clipboard!",
          description: "Course link copied. Share it with your friends!",
        });
      }
    } catch (error: any) {
      // User cancelled the share or clipboard API failed
      if (error.name !== 'AbortError') {
        console.error('Share error:', error);
        
        // Try clipboard as final fallback
        try {
          await navigator.clipboard.writeText(courseUrl);
          toast({
            title: "Link copied!",
            description: "Course link copied to clipboard.",
          });
        } catch {
          toast({
            variant: "destructive",
            title: "Share failed",
            description: "Could not share the course. Please try again.",
          });
        }
      }
    }
  };

  return { share };
}
