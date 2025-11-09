import Link from "next/link";
import { Linkedin, Twitter, Youtube } from 'lucide-react';
import { Button } from "../ui/button";

const footerLinks = {
    Learn: [
        { href: "#", text: "Browse Courses" },
        { href: "#", text: "Free Courses" },
        { href: "#", text: "Paid Courses" },
        { href: "#", "text": "Become an Instructor"}
    ],
    Intern: [
        { href: "#", text: "Find Internships" },
        { href: "#", text: "For Companies" },
        { href: "#", text: "Success Stories" },
        { href: "#", text: "Career Coaching" }
    ],
    "Career Tools": [
        { href: "#", text: "ATS Score Checker" },
        { href: "#", text: "Resume Builder" },
        { href: "#", text: "Interview Prep" },
        { href: "#", text: "Career Letter Gen" },
        { href: "#", text: "Proxy Paraphraser" }
    ],
    InternAdda: [
        { href: "#", text: "About Us" },
        { href: "#", text: "Contact Us" },
        { href: "#", text: "Terms & Conditions" },
        { href: "#", text: "Refund Policy" }
    ],
    Community: [
        { href: "#", text: "Join Community" },
        { href: "#", text: "Partners" },
        { href: "#", text: "Blog" },
        { href: "#", text: "Offline Academy" }
    ]
};

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4 md:px-6">
      <div className="container mx-auto grid grid-cols-2 md:grid-cols-6 gap-8">
        <div className="col-span-2 md:col-span-1">
          <h3 className="text-lg font-bold text-white mb-4">Internadda</h3>
          <p className="text-sm mb-4">
            Transforming careers through learning, interning, and earning opportunities.
          </p>
          <div className="flex gap-4">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <Linkedin className="h-5 w-5" />
            </Button>
             <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <Twitter className="h-5 w-5" />
            </Button>
             <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <Youtube className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
                <h4 className="font-semibold text-white mb-4">{title}</h4>
                <ul className="space-y-2">
                    {links.map(link => (
                        <li key={link.text}>
                            <Link href={link.href} className="text-sm hover:text-white transition-colors">
                                {link.text}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        ))}
      </div>
      <div className="container mx-auto text-center border-t border-gray-700 mt-8 pt-6">
        <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Internadda. All rights reserved. | Developed by Internadda Team
        </p>
      </div>
    </footer>
  );
}
