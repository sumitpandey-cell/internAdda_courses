'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, LogOut, User, GraduationCap, Shield, ChevronDown, Menu } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import internadda_logo from 'public/images/internadda_logo.png';

import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { UserProfile } from '@/lib/data-types';


export function Header() {
  const { user, isUserLoading, firestore } = useFirebase();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const userProfileRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const handleLogout = () => {
    getAuth().signOut();
    setMobileMenuOpen(false);
    router.push('/');
  };

  const isInstructor = userProfile?.role === 'Instructor' || userProfile?.role === 'Admin';
  const isAdmin = userProfile?.role === 'Admin';

  const renderAuthButton = () => {
    if (isUserLoading) {
      return <Skeleton className="h-10 w-24" />;
    }

    if (user) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.photoURL || userProfile?.avatar} alt={user.displayName || 'User'} />
                <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.displayName || 'Anonymous'}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard')}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>My Dashboard</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            {isInstructor && (
              <DropdownMenuItem onClick={() => router.push('/instructor')}>
                <GraduationCap className="mr-2 h-4 w-4" />
                <span>Instructor</span>
              </DropdownMenuItem>
            )}
            {isAdmin && (
              <DropdownMenuItem onClick={() => router.push('/admin')}>
                <Shield className="mr-2 h-4 w-4" />
                <span>Admin</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <Button asChild variant="ghost">
        <Link href="/login">Login</Link>
      </Button>
    );
  };

  return (
    <header className="px-4 md:px-6 lg:px-12 h-16 flex items-center bg-white sticky top-0 z-50 border-b border-gray-200">
      <Link href="https://www.internadda.com/" className="flex items-center gap-2">
        <img src="/images/internadda_logo.png" alt="Logo" className="h-8 w-8" />
        
        <div >
        <span className="text-2xl font-bold text-gray-900">Intern</span>
        <span className="text-2xl font-bold text-blue-900">adda</span>
        </div>
      </Link>

      {/* Desktop Navigation */}
      <nav className="ml-auto hidden lg:flex items-center gap-8">
        <Link href="https://www.internadda.com/" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
          Home
        </Link>
        <Link href="/" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
          Courses
        </Link>
        <Link href="https://www.internadda.com/intern/internship" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
          Internships
        </Link>
        <Link href="https://www.internadda.com/about" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
          About Us
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="text-sm font-medium text-gray-700 hover:text-gray-900 px-2">
              More <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push('https://www.internadda.com/blog')}>
              Blog
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('https://www.internadda.com/contact')}>
              Contact
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('https://www.internadda.com/faq')}>
              FAQ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {renderAuthButton()}
      </nav>

      {/* Mobile Navigation */}
      <div className="ml-auto flex lg:hidden items-center">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] sm:w-[350px]">
            <div className="flex flex-col gap-6 mt-8">
              {/* Profile Section */}
              {user ? (
                <div className="flex flex-col gap-4 pb-4 border-b">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.photoURL || userProfile?.avatar} alt={user.displayName || 'User'} />
                      <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium">{user.displayName || 'Anonymous'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <SheetClose asChild>
                      <Button variant="ghost" className="justify-start" onClick={() => router.push('/dashboard')}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        My Dashboard
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button variant="ghost" className="justify-start" onClick={() => router.push('/profile')}>
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Button>
                    </SheetClose>
                    {isInstructor && (
                      <SheetClose asChild>
                        <Button variant="ghost" className="justify-start" onClick={() => router.push('/instructor')}>
                          <GraduationCap className="mr-2 h-4 w-4" />
                          Instructor
                        </Button>
                      </SheetClose>
                    )}
                    {isAdmin && (
                      <SheetClose asChild>
                        <Button variant="ghost" className="justify-start" onClick={() => router.push('/admin')}>
                          <Shield className="mr-2 h-4 w-4" />
                          Admin
                        </Button>
                      </SheetClose>
                    )}
                    <Button variant="ghost" className="justify-start text-destructive hover:text-destructive" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="pb-4 border-b">
                  <SheetClose asChild>
                    <Button className="w-full" onClick={() => router.push('/login')}>
                      Login
                    </Button>
                  </SheetClose>
                </div>
              )}

              {/* Navigation Links */}
              <SheetClose asChild>
                <Link href="/" className="text-base font-medium text-gray-900 hover:text-primary transition-colors">
                  Home
                </Link>
              </SheetClose>

              <SheetClose asChild>
                <Link href="/courses" className="text-base font-medium text-gray-900 hover:text-primary transition-colors">
                  Courses
                </Link>
              </SheetClose>

              <SheetClose asChild>
                <Link href="https://www.internadda.com/intern/internship" className="text-base font-medium text-gray-900 hover:text-primary transition-colors">
                  Internships
                </Link>
              </SheetClose>

              <SheetClose asChild>
                <Link href="https://www.internadda.com/about" className="text-base font-medium text-gray-900 hover:text-primary transition-colors">
                  About Us
                </Link>
              </SheetClose>

              {/* More Dropdown */}
              <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between px-0 font-medium text-gray-900">
                    More
                    <ChevronDown className={`h-4 w-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="flex flex-col gap-3 mt-3 pl-4">
                  <SheetClose asChild>
                    <Link href="https://www.internadda.com/blog" className="text-base font-medium text-gray-700 hover:text-primary transition-colors">
                      Blog
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="https://www.internadda.com/contact" className="text-base font-medium text-gray-700 hover:text-primary transition-colors">
                      Contact
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="https://www.internadda.com/faq" className="text-base font-medium text-gray-700 hover:text-primary transition-colors">
                      FAQ
                    </Link>
                  </SheetClose>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
