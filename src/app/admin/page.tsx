
'use client';

import { StatsCard } from '@/components/dashboard/StatsCard';
import { UserTable } from '@/components/admin/UserTable';
import { AnalyticsChart } from '@/components/admin/AnalyticsChart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Users, BookOpen, DollarSign } from 'lucide-react';
import { Header } from '@/components/layout/Header';

export default function AdminPage() {
  const { firestore } = useFirebase();

  const usersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users')) : null),
    [firestore]
  );
  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);

  const coursesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'courses')) : null),
    [firestore]
  );
  const { data: courses, isLoading: coursesLoading } = useCollection(coursesQuery);


  const totalUsers = users?.length || 0;
  const totalCourses = courses?.length || 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 md:px-6 py-8">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatsCard
              title="Total Users"
              value={usersLoading ? '...' : totalUsers}
              icon={Users}
            />
            <StatsCard
              title="Total Courses"
              value={coursesLoading ? '...' : totalCourses}
              icon={BookOpen}
            />
            <StatsCard title="Total Revenue" value="$0" icon={DollarSign} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <UserTable users={users || []} />
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Course Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalyticsChart />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
