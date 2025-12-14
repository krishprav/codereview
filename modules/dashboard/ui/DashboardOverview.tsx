
"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, getMonthlyActivity } from "../actions";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import {
    GitCommit,
    GitPullRequest,
    MessageSquare,
    GitBranch,
    Loader2
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const DashboardOverview = () => {
    const [timeRange, setTimeRange] = useState("1"); // Default to 1 Month

    const { data: stats, isLoading: isLoadingStats } = useQuery({
        queryKey: ["dashboardStats"],
        queryFn: () => getDashboardStats(),
    });

    const { data: activityList, isLoading: isLoadingActivity } = useQuery({
        queryKey: ["monthlyActivity", timeRange],
        queryFn: () => getMonthlyActivity(timeRange), // Pass string directly
    });

    if (isLoadingStats || isLoadingActivity) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!stats || !activityList) {
        return <div>Error loading dashboard data.</div>;
    }

    const totalCommits = activityList.reduce(
        (acc: number, curr: any) => acc + (curr.totalContributions - curr.totalPRs - curr.totalReviews),
        0
    );
    const totalPRs = activityList.reduce(
        (acc: number, curr: any) => acc + curr.totalPRs,
        0
    );
    const totalReviews = activityList.reduce(
        (acc: number, curr: any) => acc + curr.totalReviews,
        0
    );

    // Prepare data for the bar chart (reverse to show oldest to newest)
    const chartData = [...activityList].reverse();

    // Helper to determine if current range is "standard" or "custom"
    const standardRanges = ["today", "week", "1", "12", "all"];
    const isCustomRange = !standardRanges.includes(timeRange);
    const mainSelectValue = isCustomRange ? "custom" : timeRange;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-2">
                    <h2 className="text-3xl font-bold tracking-tight">
                        Welcome back, {stats.username}
                    </h2>
                    <p className="text-muted-foreground">
                        Here's an overview of your coding activity.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                     <Select 
                        value={mainSelectValue} 
                        onValueChange={(val) => {
                            if (val === "custom") {
                                setTimeRange("3"); // Default custom to 3 months
                            } else {
                                setTimeRange(val);
                            }
                        }}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select time range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">Last 1 Week</SelectItem>
                            <SelectItem value="1">Last 1 Month</SelectItem>
                            <SelectItem value="12">Last 1 Year</SelectItem>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="custom">Custom Date Range</SelectItem>
                        </SelectContent>
                    </Select>

                    {isCustomRange && (
                        <Select value={timeRange} onValueChange={setTimeRange}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Custom range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="3">Last 3 Months</SelectItem>
                                <SelectItem value="6">Last 6 Months</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Commits
                        </CardTitle>
                        <GitCommit className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCommits}</div>
                        <p className="text-xs text-muted-foreground">
                            In selected range
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Pull Requests
                        </CardTitle>
                        <GitPullRequest className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalPRs}</div>
                        <p className="text-xs text-muted-foreground">
                            In selected range
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Code Reviews
                        </CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalReviews}</div>
                        <p className="text-xs text-muted-foreground">
                             In selected range
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Days
                        </CardTitle>
                        <GitBranch className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                             {activityList.reduce((acc: number, curr: any) => acc + curr.days, 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                             In selected range
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Monthly Activity Chart */}
                <Card className="col-span-7">
                    <CardHeader>
                        <CardTitle>Activity Overview</CardTitle>
                        <CardDescription>
                            Your contributions, PRs, and reviews over time.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis
                                    dataKey="label"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--popover))",
                                        borderColor: "hsl(var(--border))",
                                        borderRadius: "0.5rem",
                                    }}
                                    itemStyle={{ color: "hsl(var(--foreground))" }}
                                />
                                <Legend />
                                <Bar
                                    dataKey="totalContributions"
                                    name="Total Contributions"
                                    fill="hsl(var(--primary))"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    dataKey="totalPRs"
                                    name="Pull Requests"
                                    fill="#82ca9d" 
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    dataKey="totalReviews"
                                    name="Reviews"
                                    fill="#ffc658"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-1">
                {/* Heatmap Section */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Contribution Activity</CardTitle>
                        <CardDescription>
                            {stats.contributions.weeks.reduce((acc: number, week: any) => 
                                acc + week.contributionDays.reduce((dAcc: number, day: any) => dAcc + day.contributionCount, 0), 0
                            )} contributions in the last year
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-1 overflow-x-auto pb-4">
                            {/* Month Labels */}
                            <div className="flex flex-row gap-1">
                                {stats.contributions.weeks.map((week: any, wIndex: number) => {
                                    const firstDay = new Date(week.contributionDays[0].date);
                                    const prevWeekFirstDay = wIndex > 0 ? new Date(stats.contributions.weeks[wIndex - 1].contributionDays[0].date) : null;
                                    const isNewMonth = !prevWeekFirstDay || firstDay.getMonth() !== prevWeekFirstDay.getMonth();
                                    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                                    
                                    return (
                                        <div key={wIndex} className="min-w-max text-[10px] text-muted-foreground w-3 text-center">
                                            {isNewMonth ? monthNames[firstDay.getMonth()] : ""}
                                        </div>
                                    );
                                })}
                            </div>

                           <div className="flex flex-row gap-1">
                                {stats.contributions.weeks.map((week: any, wIndex: number) => (
                                    <div key={wIndex} className="flex flex-col gap-1 min-w-max">
                                        {week.contributionDays.map((day: any, dIndex: number) => (
                                            <div
                                                key={`${wIndex}-${dIndex}`}
                                                className="h-3 w-3 rounded-sm"
                                                style={{
                                                    backgroundColor: day.color || "#ebedf0", // Fallback color
                                                }}
                                                title={`${day.date}: ${day.contributionCount} contributions`}
                                            />
                                        ))}
                                    </div>
                                ))}
                           </div>
                           <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Less</span>
                                <div className="flex gap-1">
                                    <div className="h-3 w-3 rounded-sm bg-[#ebedf0] dark:bg-zinc-800" />
                                    <div className="h-3 w-3 rounded-sm bg-[#9be9a8] dark:bg-emerald-900" />
                                    <div className="h-3 w-3 rounded-sm bg-[#40c463] dark:bg-emerald-700" />
                                    <div className="h-3 w-3 rounded-sm bg-[#30a14e] dark:bg-emerald-500" />
                                    <div className="h-3 w-3 rounded-sm bg-[#216e39] dark:bg-emerald-300" />
                                </div>
                                <span>More</span>
                           </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
