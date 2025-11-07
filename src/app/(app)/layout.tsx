"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BookOpen,
    LayoutDashboard,
    Bot,
    Shield,
    User,
    Settings,
    LogOut,
} from "lucide-react";
import {
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    SidebarProvider,
    SidebarTrigger,
    SidebarInset,
    SidebarRail,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mainUser, courses } from "@/lib/data";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/courses", icon: BookOpen, label: "Courses" },
  { href: "/recommendations", icon: Bot, label: "AI Recommendations" },
];

const adminNavItems = [
    { href: "/admin", icon: Shield, label: "Admin Panel" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const pathSegments = pathname.split('/').filter(Boolean);
    const isLessonPage = pathSegments[0] === 'courses' && pathSegments.length > 2 && courses.find(c => c.id === pathSegments[1])?.lessons.some(l => l.id === pathSegments[2]);


    const isActive = (path: string) => {
        if (path === '/courses' && (pathname.startsWith('/courses/') || pathname === '/courses')) return true;
        if (path !== '/courses' && path !== '/dashboard') return pathname.startsWith(path);
        return pathname === path;
    };
    
    const pageTitle = [...navItems, ...adminNavItems].find(item => isActive(item.href))?.label || "CourseFlow";

    if (isLessonPage) {
        return (
             <main className="bg-background">
                {children}
            </main>
        )
    }

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader>
                     <div className="flex items-center gap-2 w-full p-2">
                        <BookOpen className="h-8 w-8 text-primary" />
                        <h2 className="text-xl font-bold font-headline group-data-[collapsible=icon]:hidden">CourseFlow</h2>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarMenu>
                        {navItems.map((item) => (
                            <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive(item.href)}
                                    tooltip={{ children: item.label }}
                                >
                                    <Link href={item.href}>
                                        <item.icon />
                                        <span>{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                     {mainUser.role === 'Admin' && (
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <hr className="my-2 border-border"/>
                            </SidebarMenuItem>
                            {adminNavItems.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive(item.href)}
                                        tooltip={{ children: item.label }}
                                    >
                                        <Link href={item.href}>
                                            <item.icon />
                                            <span>{item.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                     )}
                </SidebarContent>
                <SidebarFooter>
                    <DropdownMenu>
                        <DropdownMenuTrigger className="w-full">
                            <SidebarMenuButton
                                className="w-full"
                                asChild
                                tooltip={{children: (
                                    <>
                                        <p>{mainUser.name}</p>
                                        <p className="text-muted-foreground">{mainUser.email}</p>
                                    </>
                                )}}
                                >
                                <div>
                                    <Avatar className="size-8">
                                        <AvatarImage src={mainUser.avatar} alt={mainUser.name} />
                                        <AvatarFallback>{mainUser.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-left">
                                        <p className="font-medium">{mainUser.name}</p>
                                    </span>
                                </div>
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 mb-2" side="top" align="start">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <DropdownMenuItem>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarFooter>
                 <SidebarRail />
            </Sidebar>
            <SidebarInset>
                 <header className="flex h-14 items-center gap-4 border-b bg-background/50 px-4 sm:px-6 backdrop-blur-sm sticky top-0 z-10">
                    <SidebarTrigger className="md:hidden" />
                    <div className="flex-1">
                        <h1 className="text-xl font-semibold font-headline">
                            {pageTitle}
                        </h1>
                    </div>
                 </header>
                <main className="flex-1 p-4 sm:p-6 overflow-auto">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
