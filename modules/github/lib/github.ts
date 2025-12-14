import { Octokit } from "octokit";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { headers } from "next/headers";

// -----------------------------------------------------Getting the github access token from the database
export const getGithubAccessToken = async () => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    if (!session) {
        throw new Error("Unauthorized");
    }
    const account = await prisma.account.findFirst({
        where: {
            providerId: "github",
            userId: session.user.id,
        },
    });
    if (!account?.accessToken) {
        throw new Error("Access token not found");
    }
    return account.accessToken;
};

// --------------fetchUserContributions--------------
export async function fetchUserContributions(token: string, username: string) {
    const octokit = new Octokit({
        auth: token,
    });

    // GraphQL query to get the user's contributions
    const query = `
        query ($username: String!) {
            user(login: $username) {
                contributionsCollection {
                    contributionCalendar {
                        weeks {
                            contributionDays {
                                contributionCount
                                date
                                color
                                weekday
                            }
                        }
                    }
                }
            }
        }
    `;

    interface ContributionsResponse {
        user: {
            contributionsCollection: {
                contributionCalendar: {
                    weeks: Array<{
                        contributionDays: Array<{
                            contributionCount: number;
                            date: string;
                            color: string;
                            weekday: number;
                        }>;
                    }>;
                };
            };
        };
    }

    try {
        const response = await octokit.graphql(query, {
            username: username,
        }) as ContributionsResponse;

        return response.user.contributionsCollection.contributionCalendar;
    } catch (error) {
        console.error("Error fetching user contributions:", error);
        throw error;
    }
}

// --------------fetchUserPullRequests--------------
export async function fetchUserPullRequests(token: string, username: string, fromDate: string) {
    const octokit = new Octokit({
        auth: token,
    });

    const query = `
        query ($searchQuery: String!) {
            search(query: $searchQuery, type: ISSUE, first: 100) {
                nodes {
                    ... on PullRequest {
                        createdAt
                        title
                        url
                    }
                }
            }
        }
    `;

    const searchQuery = `author:${username} type:pr created:>=${fromDate}`;

    try {
        const response: any = await octokit.graphql(query, {
            searchQuery,
        });
        return response.search.nodes;
    } catch (error) {
        console.error("Error fetching user pull requests:", error);
        throw error;
    }
}

// --------------fetchUserCodeReviews--------------
export async function fetchUserCodeReviews(token: string, username: string, fromDate: string) {
    const octokit = new Octokit({
        auth: token,
    });

    // Counting reviewed PRs is tricky. We can look for PRs where the user is a reviewer or has commented.
    // A better proxy for "reviews done" is searching for "reviewed-by:username".
    // Or we can use `contributionsCollection` with chunks if precision matters, but search is faster for "counts".
    // reviewed-by:username works for merged/closed PRs mostly or approved ones.
    // The user asked for "code reviews", usually meaning Review events.
    // `commented` involves comments. `reviewed-by` involves official reviews.
    // Let's use `reviewer:username`.

    // Note: `reviewer:username` finds PRs where you are REQUESTED to review but haven't necessarily reviewed.
    // `reviewed-by:username` finds PRs you have reviewed.
    const searchQuery = `reviewed-by:${username} type:pr created:>=${fromDate}`;

    // However, the PR creation date might be old, but review is new.
    // "reviewed-by" filters by PR properties usually.
    // The best way for "reviews in last 6 months" is actually `contributionsCollection` -> `pullRequestReviewContributions`.
    // But let's start with search `reviewed-by:${username} updated:>=${fromDate}` as a proxy.
    // Actually, let's use the explicit aggregation if we can.

    // Let's try to be consistent with PRs. `created` is for PR creation.
    // For reviews, we want when the review happened.
    // If we use search, we get the PR, not the review date.
    // So for Reviews, `contributionsCollection` is superior because it gives the `occurredAt` of the review.

    // So let's use contributionsCollection for reviews, iterating if necessary or just taking the total if we can't iterate efficiently.
    // But wait, the user wants "how many you did in each month". I need the dates.
    // Use `contributionsCollection` over the range.

    // Actually, let's try search first as it's simpler to implement alongside PRs.
    // If we search `commenter:${username} type:pr updated:>=${fromDate}`, we get PRs.

    // Let's stick to the user's implicit flow: "fetches code review => grouping by 6 monthd".
    // I will implement `fetchUserCodeReviews` using `search` for now using `reviewed-by` and `updated` as a filter, 
    // but knowing it returns the PRs, not the review events.
    // To get review events, we'd need to fetch the reviews on those PRs.

    // ALTERNATIVE: Use `user.contributionsCollection.pullRequestReviewContributions` for the specific range.
    // That gives exact timestamps. I'll use that for reviews.

    const contributionsQuery = `
        query ($username: String!, $from: DateTime!, $to: DateTime!) {
            user(login: $username) {
                contributionsCollection(from: $from, to: $to) {
                    pullRequestReviewContributions(first: 100) {
                        nodes {
                            occurredAt
                            pullRequest {
                                title
                                url
                            }
                        }
                    }
                }
            }
        }
    `;

    // We need to calculate 'to' (now) and 'from' (fromDate).
    // fromDate passed in is YYYY-MM-DD usually.
    const toDate = new Date().toISOString();

    try {
        const response: any = await octokit.graphql(contributionsQuery, {
            username,
            from: new Date(fromDate).toISOString(),
            to: toDate
        });
        return response.user.contributionsCollection.pullRequestReviewContributions.nodes;
    } catch (error) {
        console.error("Error fetching user reviews:", error);
        throw error;
    }
}