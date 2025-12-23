import { inngest } from "./client";
import prisma from "@/lib/db";
import { Octokit } from "octokit";
import { fetchUserContributions, fetchUserPullRequests, fetchUserCodeReviews } from "@/modules/github/lib/github";

export const helloWorld = inngest.createFunction(
    { id: "hello-world" },
    { event: "test/hello.world" },
    async ({ event, step }) => {
        await step.sleep("wait-a-moment", "1s");
        return { message: `Hello ${event.data.email}!` };
    },
);

export const syncGithubStats = inngest.createFunction(
    { id: "sync-github-stats" },
    { event: "app/github.sync" },
    async ({ event, step }) => {
        const { userId } = event.data;

        const token = await step.run("get-user-token", async () => {
            const account = await prisma.account.findFirst({
                where: {
                    userId: userId,
                    providerId: "github"
                }
            });
            if (!account?.accessToken) throw new Error("No github token found for user");
            return account.accessToken;
        });

        const user = await step.run("get-github-username", async () => {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: { accounts: true } // Or just fetch from user if we stored username? 
                // We don't store github login on User directly, usually it's in Account or we fetch it.
                // Let's fetch it from GitHub to be sure, or store it.
                // Using the token is safest.
            });
            const octokit = new Octokit({ auth: token });
            const { data } = await octokit.rest.users.getAuthenticated();
            return data.login;
        });

        // Fetch Data in parallel steps
        const contributions = await step.run("fetch-contributions", async () => {
            return await fetchUserContributions(token, user);
        });

        const prs = await step.run("fetch-prs", async () => {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            return await fetchUserPullRequests(token, user, sixMonthsAgo.toISOString());
        });

        const reviews = await step.run("fetch-reviews", async () => {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            return await fetchUserCodeReviews(token, user, sixMonthsAgo.toISOString());
        });

        // Process and Save
        await step.run("process-and-save-stats", async () => {
            const statsMap = new Map<string, { commits: number, prs: number, reviews: number }>();

            const getMonthKey = (dateStr: string) => {
                const d = new Date(dateStr);
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            };

            const initStat = (key: string) => {
                if (!statsMap.has(key)) statsMap.set(key, { commits: 0, prs: 0, reviews: 0 });
                return statsMap.get(key)!;
            };

            // 1. Process Contributions (Commits usually, but calendar includes other things. 
            // The calendar gives 'contributionCount'. This includes PRs/Issues too. 
            // But usually convenient for "activity". 
            // If we want strict commits, we need a different query or subtract others. 
            // For now, let's treat "contributionCount" as "Commits/Activity" metric.)
            contributions.weeks.forEach((week: any) => {
                week.contributionDays.forEach((day: any) => {
                    if (day.contributionCount > 0) {
                        const key = getMonthKey(day.date);
                        const stat = initStat(key);
                        stat.commits += day.contributionCount; // Using contribution count as the metric
                    }
                });
            });

            // 2. Process PRs
            prs.forEach((pr: any) => {
                const key = getMonthKey(pr.createdAt);
                const stat = initStat(key);
                stat.prs += 1;
            });

            // 3. Process Reviews
            reviews.forEach((review: any) => {
                const key = getMonthKey(review.occurredAt);
                const stat = initStat(key);
                stat.reviews += 1;
            });

            // Upsert to DB
            for (const [monthKey, stats] of statsMap.entries()) {
                const [yearStr, monthStr] = monthKey.split('-');
                await prisma.monthlyGithubStats.upsert({
                    where: {
                        userId_month: {
                            userId: userId,
                            month: monthKey
                        }
                    },
                    create: {
                        userId: userId,
                        month: monthKey,
                        year: parseInt(yearStr),
                        totalCommits: stats.commits,
                        totalPRs: stats.prs,
                        totalReviews: stats.reviews
                    },
                    update: {
                        totalCommits: stats.commits,
                        totalPRs: stats.prs,
                        totalReviews: stats.reviews
                    }
                });
            }
        });

        return { success: true, user };
    }
);

import { getRepoFileContents, getPullRequestDiff, postReviewComment } from "@/modules/github/lib/github";
import { indexCodebase, retrieveContext } from "@/modules/ai/lib/rag";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export const indexRepo = inngest.createFunction(
    { id: "index-repo" },
    { event: "repository.connected" },
    async ({ event, step }) => {
        const { owner, repo, userId } = event.data;

        const files = await step.run("fetch-files", async () => {
            const account = await prisma.account.findFirst({
                where: {
                    userId: userId,
                    providerId: "github"
                }
            });

            if (!account?.accessToken) {
                throw new Error("No GitHub access token found");
            }

            return await getRepoFileContents(account.accessToken, owner, repo);
        });

        await step.run("index-codebase", async () => {
            await indexCodebase(`${owner}/${repo}`, files);
        });

        return { success: true, indexedFiles: files.length };
    }
);

export const generateReview = inngest.createFunction(
    { id: "generate-review", concurrency: 5 },
    { event: "pr.review.requested" },
    async ({ event, step }) => {
        const { owner, repo, prNumber, userId } = event.data;

        // 1. Fetch PR Data & Token
        const { diff, title, description, token, repositoryId } = await step.run("fetch-pr-data", async () => {
            const account = await prisma.account.findFirst({
                where: { userId: userId, providerId: "github" }
            });
            if (!account?.accessToken) throw new Error("No GitHub access token found");

            const repository = await prisma.repository.findFirst({
                where: { owner, name: repo }
            });
            if (!repository) throw new Error("Repository not found in DB");

            const data = await getPullRequestDiff(account.accessToken, owner, repo, prNumber);
            return { ...data, token: account.accessToken, repositoryId: repository.id };
        });

        // 2. Retrieve Context (RAG)
        const context = await step.run("retrieve-context", async () => {
            // Use title + description for semantic search
            const query = `${title}\n${description}`;
            return await retrieveContext(query, `${owner}/${repo}`);
        });

        // 3. Generate AI Review
        const review = await step.run("generate-ai-review", async () => {
            const prompt = `You are an expert code reviewer. Analyze the following pull request and provide a detailed, constructive code review.

PR Title: ${title}
PR Description: ${description || "No description provided"}

Context from Codebase:
${context.join("\n\n")}

Code Changes:
\`\`\`diff
${diff}
\`\`\`

Please provide:
1. **Walkthrough**: A file-by-file explanation of the changes.
2. **Sequence Diagram**: A Mermaid JS sequence diagram visualizing the flow of the changes (if applicable). Use \`\`\`mermaid ... \`\`\` block. **IMPORTANT**: Ensure the Mermaid syntax is valid. Do not use special characters (like quotes, braces, parentheses) inside Note text or labels as it breaks rendering. Keep the diagram simple.
3. **Summary**: Brief overview.
4. **Strengths**: What's done well.
5. **Issues**: Bugs, security concerns, code smells.
6. **Suggestions**: Specific code improvements.
7. **Poem**: A short, creative poem summarizing the changes at the very end.

Format your response in markdown.`;

            // Using gemini-2.5-flash as requested
            const { text } = await generateText({
                model: google("gemini-2.5-flash"),
                prompt: prompt
            });
            return text;
        });

        // 4. Post Comment to GitHub
        await step.run("post-comment", async () => {
            await postReviewComment(token, owner, repo, prNumber, review);
        });

        // 5. Save to Database
        await step.run("save-review", async () => {
            await prisma.review.create({
                data: {
                    repositoryId: repositoryId,
                    prNumber,
                    prTitle: title,
                    prUrl: `https://github.com/${owner}/${repo}/pull/${prNumber}`,
                    review,
                    status: "completed",
                },
            });
        });

        return { success: true };
    }
);
