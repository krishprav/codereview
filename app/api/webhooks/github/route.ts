import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";
import prisma from "@/lib/db";

export async function GET() {
    return NextResponse.json({ message: "GitHub webhook endpoint" }, { status: 200 });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const eventType = req.headers.get("x-github-event");

        console.log(`Received GitHub webhook: ${eventType}`);

        if (eventType === "ping") {
            return NextResponse.json({ message: "Pong" }, { status: 200 });
        }

        // Forward event to Inngest for processing generic github events
        if (eventType === "push" || eventType === "pull_request" || eventType === "pull_request_review" || eventType === "pull_request_review_comment") {
            await inngest.send({
                name: `github/${eventType}`,
                data: body,
            });
        }

        // Logic for triggering AI Reviews
        if (eventType === "pull_request") {
            const action = body.action;
            if (action === "opened" || action === "synchronize" || action === "reopened") {
                const repoId = body.repository.id; // GitHub ID
                const prNumber = body.number;
                const repoFullName = body.repository.full_name;
                const [owner, repoName] = repoFullName.split("/");

                // Find repo in DB to get userId
                const repository = await prisma.repository.findUnique({
                    where: { githubId: BigInt(repoId) }
                });

                if (repository) {
                    await inngest.send({
                        name: "pr.review.requested",
                        data: {
                            owner: owner,
                            repo: repoName,
                            prNumber: prNumber,
                            userId: repository.userId
                        }
                    });
                    console.log(`Triggered reviews for ${repoFullName} PR #${prNumber}`);
                } else {
                    console.log(`Repository ${repoFullName} not found in DB. Skipping review.`);
                }
            }
        }

        return NextResponse.json({ message: "Received" }, { status: 200 });

    } catch (error) {
        console.error("Error processing webhook:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
