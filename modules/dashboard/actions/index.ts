"use server"
import prisma from "@/lib/db";
import {
    fetchUserContributions,
    getGithubAccessToken,
    fetchUserPullRequests,
    fetchUserCodeReviews
} from "@/modules/github/lib/github";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Octokit } from "octokit";

interface ActivityItem {
    date: string; // "YYYY-MM" or "YYYY-MM-DD"
    label: string; // "January" or "Jan 01"
    year: number;
    totalContributions: number;
    totalPRs: number;
    totalReviews: number;
    days: number; // Number of days with contributions (1 for daily if active)
}

export async function getDashboardStats() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        if (!session) {
            throw new Error("Unauthorized");
        }

        const token = await getGithubAccessToken();
        if (!token) {
            throw new Error("Access token not found");
        }

        const octokit = new Octokit({
            auth: token,
        });

        const user = await octokit.request("GET /user");
        const username = user.data.login;

        const contributions = await fetchUserContributions(token, username);

        return {
            contributions,
            username,
        };
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        throw error;
    }
}

export async function getMonthlyActivity(range: string = "6") {
    try {
        // Get session to verify user is authenticated
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        if (!session) {
            throw new Error("Unauthorized");
        }

        // Get GitHub access token
        const token = await getGithubAccessToken();
        if (!token) {
            throw new Error("Access token not found");
        }

        // Initialize Octokit
        const octokit = new Octokit({
            auth: token,
        });

        // Get user's GitHub username
        const user = await octokit.request("GET /user");
        const username = user.data.login;

        // Calculate date limit
        const limitDate = new Date();
        // Reset time to start of day for accurate comparison
        limitDate.setHours(0, 0, 0, 0);

        let isDaily = false;

        if (range === "today") {
            isDaily = true;
            // limitDate is already today 00:00:00
        } else if (range === "week") {
            isDaily = true;
            limitDate.setDate(limitDate.getDate() - 7);
        } else if (range === "all") {
            isDaily = false; // "All time" usually looks better as monthly/yearly
            limitDate.setFullYear(2000); // Far back enough
        } else {
            const months = parseInt(range);
            limitDate.setMonth(limitDate.getMonth() - months);
            isDaily = months <= 1;
        }

        const fromDate = limitDate.toISOString();

        // Fetch data in parallel
        const [contributions, prs, reviews] = await Promise.all([
            fetchUserContributions(token, username),
            fetchUserPullRequests(token, username, fromDate),
            fetchUserCodeReviews(token, username, fromDate)
        ]);

        // Process contributions to get activity
        const activityMap = new Map<string, { total: number; days: Set<string>; prs: number; reviews: number; label: string; year: number }>();
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const shortMonthNames = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];

        // Helper to get info from date
        const getDateInfo = (dateStr: string) => {
            const date = new Date(dateStr);
            const year = date.getFullYear();
            const month = date.getMonth();
            const day = date.getDate();

            if (isDaily) {
                const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const label = `${shortMonthNames[month]} ${day}`;
                return { key, label, year };
            } else {
                const key = `${year}-${String(month + 1).padStart(2, "0")}`;
                const label = monthNames[month];
                return { key, label, year };
            }
        };

        // Helper to init entry
        const getOrInitEntry = (dateInfo: { key: string, label: string, year: number }) => {
            if (!activityMap.has(dateInfo.key)) {
                activityMap.set(dateInfo.key, {
                    total: 0,
                    days: new Set(),
                    prs: 0,
                    reviews: 0,
                    label: dateInfo.label,
                    year: dateInfo.year
                });
            }
            return activityMap.get(dateInfo.key)!;
        };

        // 1. Process Contributions (Calendar)
        contributions.weeks.forEach((week) => {
            week.contributionDays.forEach((day) => {
                const date = new Date(day.date);
                if (date >= limitDate) {
                    const info = getDateInfo(day.date);
                    if (day.contributionCount > 0) {
                        const entry = getOrInitEntry(info);
                        entry.total += day.contributionCount;
                        entry.days.add(day.date);
                    } else if (isDaily) {
                        // Ensure inactive days are also present for daily view
                        getOrInitEntry(info);
                    }
                }
            });
        });

        // 2. Process PRs
        prs.forEach((pr: any) => {
            const date = new Date(pr.createdAt);
            if (date >= limitDate) {
                const info = getDateInfo(pr.createdAt);
                getOrInitEntry(info).prs += 1;
            }
        });

        // 3. Process Reviews
        reviews.forEach((review: any) => {
            const date = new Date(review.occurredAt);
            if (date >= limitDate) {
                const info = getDateInfo(review.occurredAt);
                getOrInitEntry(info).reviews += 1;
            }
        });

        // Convert map to array and format
        let activityList: ActivityItem[] = Array.from(activityMap.entries())
            .map(([key, data]) => {
                return {
                    date: key,
                    year: data.year,
                    label: data.label, // mapped to monthName or generic label
                    totalContributions: data.total,
                    totalPRs: data.prs,
                    totalReviews: data.reviews,
                    days: data.days.size,
                };
            })
            .sort((a, b) => {
                // Sort by date key (String comparison works for ISO-like dates)
                return b.date.localeCompare(a.date);
            });

        // Only upsert stats if we are aggregating by MONTH (to avoid spamming DB with daily stats or messing up schema)
        // The MonthlyGithubStats model is designed for Monthly aggregation.
        // We will SKIP DB upsert for daily view for now, or just focus on returning the data for UI.
        if (!isDaily) {
            for (const stat of activityList) {
                await prisma.monthlyGithubStats.upsert({
                    where: {
                        userId_month: {
                            userId: session.user.id,
                            month: stat.date,
                        },
                    },
                    update: {
                        totalCommits: stat.totalContributions - stat.totalPRs - stat.totalReviews,
                        totalPRs: stat.totalPRs,
                        totalReviews: stat.totalReviews,
                    },
                    create: {
                        userId: session.user.id,
                        month: stat.date,
                        year: stat.year,
                        totalCommits: stat.totalContributions - stat.totalPRs - stat.totalReviews,
                        totalPRs: stat.totalPRs,
                        totalReviews: stat.totalReviews,
                    },
                });
            }
        }

        return activityList;
    } catch (error) {
        console.error("Error fetching activity:", error);
        throw error;
    }
}
