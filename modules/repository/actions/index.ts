"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getGithubAccessToken } from "@/modules/github/lib/github";
import { Octokit } from "octokit";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { inngest } from "@/lib/inngest/client";

export async function getRepositories(page: number = 1, perPage: number = 10, search: string = "") {
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

        // Fetch connected repositories from DB to mark them
        const connectedRepos = await prisma.repository.findMany({
            where: {
                userId: session.user.id,
            },
            select: {
                githubId: true,
            },
        });

        const connectedRepoIds = new Set(connectedRepos.map((r) => r.githubId.toString()));

        let repos = [];
        let totalCount = 0;

        if (search) {
            const user = await octokit.request("GET /user");
            const username = user.data.login;

            const { data } = await octokit.rest.search.repos({
                q: `user:${username} ${search} sort:updated-desc`,
                per_page: perPage,
                page: page,
                // Add pushed to sort by push? or updated.
            });
            repos = data.items;
            totalCount = data.total_count;
        } else {
            const { data } = await octokit.rest.repos.listForAuthenticatedUser({
                sort: "updated",
                direction: "desc",
                visibility: "all",
                per_page: perPage,
                page: page,
            });
            repos = data;
        }

        const formattedRepos = repos.map((repo: any) => ({
            id: repo.id,
            name: repo.name,
            owner: repo.owner?.login || "",
            fullName: repo.full_name,
            description: repo.description,
            language: repo.language,
            stargazers_count: repo.stargazers_count,
            updated_at: repo.updated_at,
            html_url: repo.html_url,
            isConnected: connectedRepoIds.has(repo.id.toString()),
        }));

        return {
            repos: formattedRepos,
            hasMore: repos.length === perPage,
        };

    } catch (error) {
        console.error("Error fetching repositories:", error);
        throw error;
    }
}

export async function getConnectedRepositories() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        if (!session) {
            throw new Error("Unauthorized");
        }

        const repos = await prisma.repository.findMany({
            where: {
                userId: session.user.id,
            },
            orderBy: {
                createdAt: "desc",
            }
        });

        return repos.map(repo => ({
            ...repo,
            githubId: repo.githubId.toString(),
            webhookId: repo.webhookId?.toString()
        }));

    } catch (error) {
        console.error("Error fetching connected repositories:", error);
        return [];
    }
}

export async function connectRepository(repo: any) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        if (!session) {
            throw new Error("Unauthorized");
        }

        const token = await getGithubAccessToken();
        const octokit = new Octokit({ auth: token });

        // Ensure owner is string
        const owner = repo.owner || "";

        // Create Webhook
        // Use NEXT_PUBLIC_BETTER_AUTH_URL as base if APP_URL is not set, assuming they are same for now or localhost
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
        const webhookUrl = `${baseUrl}/api/webhooks/github`;

        let webhookId: bigint | null = null;

        try {
            const { data: hook } = await octokit.rest.repos.createWebhook({
                owner: owner,
                repo: repo.name,
                config: {
                    url: webhookUrl,
                    content_type: "json",
                    insecure_ssl: "0",
                    secret: process.env.GITHUB_WEBHOOK_SECRET
                },
                events: ["push", "pull_request", "pull_request_review_comment", "pull_request_review"]
            });
            webhookId = BigInt(hook.id);
        } catch (e: any) {
            console.error("Failed to create webhook:", e.response?.data || e.message);
            if (e.response?.data?.errors?.some((err: any) => err.message === 'Hook already exists on this repository')) {
                // Find the existing hook
                try {
                    const { data: hooks } = await octokit.rest.repos.listWebhooks({
                        owner: owner,
                        repo: repo.name,
                    });
                    const existingHook = hooks.find(h => h.config.url === webhookUrl);
                    if (existingHook) {
                        webhookId = BigInt(existingHook.id);
                    }
                } catch (listErr: any) {
                    console.error("Failed to find existing webhook:", listErr.message);
                }
            }
        }

        await prisma.repository.upsert({
            where: {
                githubId: BigInt(repo.id)
            },
            create: {
                userId: session.user.id,
                githubId: BigInt(repo.id),
                name: repo.name,
                owner: owner,
                fullName: repo.fullName || repo.full_name,
                url: repo.html_url || repo.url,
                webhookId: webhookId
            },
            update: {
                webhookId: webhookId
            }
        });



        await inngest.send({
            name: "repository.connected",
            data: {
                repo: repo.name,
                owner: owner,
                userId: session.user.id
            }
        });

        revalidatePath("/dashboard/settings");

        return { success: true };
    } catch (error) {
        console.error("Error connecting repository:", error);
        throw error;
    }
}

export async function disconnectRepository(githubId: number) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        if (!session) {
            throw new Error("Unauthorized");
        }

        const repo = await prisma.repository.findUnique({
            where: {
                githubId: BigInt(githubId),
            },
        });

        if (!repo) {
            throw new Error("Repository not connected");
        }

        // Delete Webhook if exists
        if (repo.webhookId) {
            const token = await getGithubAccessToken();
            const octokit = new Octokit({ auth: token });
            try {
                await octokit.rest.repos.deleteWebhook({
                    owner: repo.owner,
                    repo: repo.name,
                    hook_id: Number(repo.webhookId)
                });
            } catch (e) {
                console.warn("Failed to delete webhook from GitHub (might be already deleted):", e);
            }
        }

        await prisma.repository.delete({
            where: {
                githubId: BigInt(githubId),
            },
        });

        revalidatePath("/dashboard/settings");

        return { success: true };
    } catch (error) {
        console.error("Error disconnecting repository:", error);
        throw error;
    }
}
