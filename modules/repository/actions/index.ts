"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getGithubAccessToken } from "@/modules/github/lib/github";
import { Octokit } from "octokit";
import { headers } from "next/headers";

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

        // Fetch repositories from GitHub
        // searching is a bit different. listForAuthenticatedUser doesn't support generic search query well (it lists YOUR repos).
        // If search is provided, we might need `octokit.rest.search.repos`.
        // However, usually "list my repos" with a client-side filter or a search endpoint is different.
        // The user asked for "search box with filter". If it's a filter on the fetched list, we can do it client side?
        // But "Infinite Scrolling fetching" usually implies server side pagination.
        // GitHub `listForAuthenticatedUser` doesn't have a `q` parameter. 
        // We can use `octokit.rest.search.repos` with `user:${username} ${search}` if search is present.

        let repos = [];
        let totalCount = 0; // Search api gives total count. List api doesn't easily (maybe link header).

        if (search) {
            const user = await octokit.request("GET /user"); // Need username for search context or just use `user:@me`? `user:@me` might not work in search query string.
            const username = user.data.login;

            const { data } = await octokit.rest.search.repos({
                q: `user:${username} ${search} sort:updated-desc`,
                per_page: perPage,
                page: page,
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
            // For list, passing totalCount is hard without fetching all or checking headers. 
            // We can assume there are more if we got a full page.
            // Infinite scroll usually just needs "next page exists".
        }

        const formattedRepos = repos.map((repo: any) => ({
            id: repo.id,
            name: repo.name,
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
            hasMore: repos.length === perPage, // Rough check
        };

    } catch (error) {
        console.error("Error fetching repositories:", error);
        throw error;
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

        await prisma.repository.create({
            data: {
                userId: session.user.id,
                githubId: BigInt(repo.id),
                name: repo.name,
                owner: repo.owner?.login || "", // Github repo object has owner
                fullName: repo.fullName,
                url: repo.html_url,
            },
        });

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

        await prisma.repository.delete({
            where: {
                githubId: BigInt(githubId),
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Error disconnecting repository:", error);
        throw error;
    }
}
