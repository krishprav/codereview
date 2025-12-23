import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default async function ReviewDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return <div>Unauthorized</div>;
    }

    const review = await prisma.review.findUnique({
        where: { id },
        include: { repository: true }
    });

    if (!review) {
        return notFound();
    }

    // Authorization check: ensure user owns the repo
    if (review.repository.userId !== session.user.id) {
        return <div>Unauthorized</div>;
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <Link href="/dashboard/reviews" className="text-sm font-medium hover:underline text-muted-foreground">
                    &larr; Back to Reviews
                </Link>
                <div className="flex gap-2">
                    <Link href={review.prUrl} target="_blank" className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium">
                        View on GitHub
                    </Link>
                </div>
            </div>

            <div className="space-y-2">
                <h1 className="text-3xl font-bold">{review.prTitle}</h1>
                <p className="text-muted-foreground">
                    Review for PR #{review.prNumber} in {review.repository.fullName}
                </p>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none border rounded-lg p-6 bg-card">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{review.review}</ReactMarkdown>
            </div>
        </div>
    );
}
