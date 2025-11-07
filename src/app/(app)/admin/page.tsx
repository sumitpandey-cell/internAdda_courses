import { StatsCard } from "@/components/dashboard/StatsCard";
import { UserTable } from "@/components/admin/UserTable";
import { AnalyticsChart } from "@/components/admin/AnalyticsChart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { users, courses } from "@/lib/data";
import { Users, BookOpen, DollarSign } from "lucide-react";

export default function AdminPage() {
    const totalUsers = users.length;
    const totalCourses = courses.length;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatsCard title="Total Users" value={totalUsers} icon={Users} />
                <StatsCard title="Total Courses" value={totalCourses} icon={BookOpen} />
                <StatsCard title="Total Revenue" value="$12,345" icon={DollarSign} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>User Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <UserTable users={users} />
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
