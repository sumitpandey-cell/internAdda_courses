'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, LayoutDashboard, LogOut, User, GraduationCap, Shield } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { doc } from 'firebase/firestore';

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
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile } from '@/lib/data-types';


export function Header() {
  const { user, isUserLoading, firestore } = useFirebase();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const handleLogout = () => {
    getAuth().signOut();
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
      <Button asChild>
        <Link href="/login">Login</Link>
      </Button>
    );
  };

  return (
    <header className="px-4 lg:px-6 h-16 flex items-center bg-transparent backdrop-blur-sm sticky top-0 z-50 border-b">
      <Link href="/" className="flex items-center justify-center">
        <span className="text-xl font-bold font-headline">Internadda</span>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
        {renderAuthButton()}
      </nav>
    </header>
  );
}
