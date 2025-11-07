"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { name: "JS Mastery", users: 400, revenue: 2400 },
  { name: "React Foundations", users: 300, revenue: 1398 },
  { name: "Python for DS", users: 500, revenue: 9800 },
  { name: "Node.js Backend", users: 278, revenue: 3908 },
  { name: "UX Design", users: 189, revenue: 4800 },
  { name: "SQL Deep Dive", users: 239, revenue: 3800 },
  { name: "Docker & K8s", users: 349, revenue: 4300 },
]

export function AnalyticsChart() {
  return (
    <div className="h-80 w-full">
      <ChartContainer
        config={{
          users: { label: "Users", color: "hsl(var(--primary))" },
        }}
        className="w-full h-full"
      >
        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
          <Tooltip cursor={false} content={<ChartTooltipContent />} />
          <Bar dataKey="users" fill="var(--color-users)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
