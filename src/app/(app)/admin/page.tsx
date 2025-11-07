'use client';

import { StatsCard } from '@/components/dashboard/StatsCard';
import { UserTable } from '@/components/admin/UserTable';
import { AnalyticsChart } from '@/components/admin/AnalyticsChart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useCollection, useFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { Users, BookOpen, DollarSign } from 'lucide-react';

export default function AdminPage() {
  const { firestore } = useFirebase();

  const { data: users, isLoading: usersLoading } = useCollection(
    firestore ? query(collection(firestore, 'users')) : null
  );
  const { data: courses, isLoading: coursesLoading } = useCollection(
    firestore ? query(collection(firestore, 'courses')) : null
  );

  const totalUsers = users?.length || 0;
  const totalCourses = courses?.length || 0;

  return (
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
  );
}
