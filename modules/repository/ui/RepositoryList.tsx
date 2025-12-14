"use client";

import { useRepositories } from "../hooks/useRepositories";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useEffect, useRef } from "react";
import { Loader2, Star, ExternalLink } from "lucide-react";
import Link from "next/link";

export const RepositoryList = () => {
    const { 
        repositories, 
        fetchNextPage, 
        hasNextPage, 
        isFetchingNextPage, 
        isLoading, 
        search, 
        setSearch,
        connectRepo,
        disconnectRepo,
        isConnecting,
        isDisconnecting
    } = useRepositories();

    const observerTarget = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [observerTarget, hasNextPage, fetchNextPage]);

    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-2">
                <Input 
                    placeholder="Search repositories..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            {isLoading && repositories.length === 0 ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {repositories.map((repo: any) => (
                        <Card key={repo.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-lg truncate max-w-[80%]">
                                        {repo.name}
                                    </CardTitle>
                                    <Link href={repo.html_url} target="_blank" className="text-muted-foreground hover:text-primary">
                                        <ExternalLink className="h-4 w-4" />
                                    </Link>
                                </div>
                                <CardDescription className="line-clamp-2 h-10">
                                    {repo.description || "No description"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 rounded-full bg-primary mr-1" />
                                        {repo.language || "Unknown"}
                                    </div>
                                    <div className="flex items-center">
                                        <Star className="h-4 w-4 mr-1" />
                                        {repo.stargazers_count}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                {repo.isConnected ? (
                                    <Button 
                                        variant="outline" 
                                        className="w-full"
                                        onClick={() => disconnectRepo(repo.id)}
                                        disabled={isDisconnecting}
                                    >
                                        Disconnect
                                    </Button>
                                ) : (
                                    <Button 
                                        className="w-full"
                                        onClick={() => connectRepo(repo)}
                                        disabled={isConnecting}
                                    >
                                        Connect
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
            
            <div ref={observerTarget} className="h-10 flex justify-center items-center">
                {isFetchingNextPage && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
            </div>
        </div>
    );
}
