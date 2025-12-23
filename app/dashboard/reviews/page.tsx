import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { headers } from "next/headers";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default async function ReviewsPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return <div>Unauthorized</div>;
    }

    const reviews = await prisma.review.findMany({
        where: {
            repository: {
                userId: session.user.id
            }
        },
        include: {
            repository: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">AI Code Reviews</h1>
            </div>

            <div className="rounded-md border">
                <div className="p-4">
                    {reviews.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            No reviews generated yet. Connect a repository and open a PR to get started.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reviews.map((review) => (
                                <div key={review.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Link href={review.prUrl} target="_blank" className="font-semibold hover:underline flex items-center gap-1">
                                                {review.repository.fullName} #{review.prNumber}
                                            </Link>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${review.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {review.status}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium">{review.prTitle}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Generated {formatDistanceToNow(new Date(review.createdAt))} ago
                                        </p>
                                    </div>
                                    <Link href={`/dashboard/reviews/${review.id}`} className="text-sm font-medium text-primary hover:underline">
                                        View Details
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
