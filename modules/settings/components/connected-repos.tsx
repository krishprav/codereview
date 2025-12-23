"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trash2, ExternalLink, Github } from "lucide-react";
import { toast } from "sonner";
import { disconnectRepository, getConnectedRepositories } from "@/modules/repository/actions";
import Link from "next/link";

interface ConnectedRepo {
    id: string;
    name: string;
    fullName: string;
    description?: string;
    url: string;
    githubId: string;
    webhookId?: string;
    createdAt: Date;
}

export function ConnectedRepos() {
    const [repos, setRepos] = useState<ConnectedRepo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDisconnecting, setIsDisconnecting] = useState<string | null>(null);

    const fetchRepos = async () => {
        try {
            const result = await getConnectedRepositories();
            setRepos(result);
        } catch (error) {
            console.error("Error fetching connected repos:", error);
            toast.error("Failed to load connected repositories");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRepos();
    }, []);

    const handleDisconnect = async (repoId: string, githubId: string) => {
        setIsDisconnecting(repoId);
        try {
            await disconnectRepository(Number(githubId));

            setRepos(prev => prev.filter(r => r.id !== repoId));
            toast.success("Repository disconnected successfully");
        } catch (error) {
            toast.error("Failed to disconnect repository");
        } finally {
            setIsDisconnecting(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (repos.length === 0) {
        return (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                No repositories connected.
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {repos.map((repo) => (
                <Card key={repo.id}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-lg truncate">{repo.name}</CardTitle>
                            <Link href={repo.url} target="_blank" className="text-muted-foreground hover:text-foreground">
                                <ExternalLink className="h-4 w-4" />
                            </Link>
                        </div>
                        <CardDescription className="truncate">{repo.fullName}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button
                            variant="destructive"
                            size="sm"
                            className="w-full"
                            disabled={isDisconnecting === repo.id}
                            onClick={() => handleDisconnect(repo.id, repo.githubId)}
                        >
                            {isDisconnecting === repo.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Disconnect
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
