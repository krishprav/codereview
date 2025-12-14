"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRepositories, connectRepository, disconnectRepository } from "../actions";
import { useState, useEffect } from "react";
import { toast } from "sonner"; 

export function useRepositories() {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const queryClient = useQueryClient();

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error
    } = useInfiniteQuery({
        queryKey: ["repositories", debouncedSearch], // Use debounced value
        queryFn: ({ pageParam = 1 }) => getRepositories(pageParam as number, 10, debouncedSearch),
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.hasMore ? allPages.length + 1 : undefined;
        },
        initialPageParam: 1,
    });

    const connectMutation = useMutation({
        mutationFn: connectRepository,
        onSuccess: () => {
            toast.success("Repository connected successfully");
            queryClient.invalidateQueries({ queryKey: ["repositories"] });
        },
        onError: (error) => {
            toast.error("Failed to connect repository");
            console.error(error);
        }
    });

    const disconnectMutation = useMutation({
        mutationFn: disconnectRepository,
        onSuccess: () => {
            toast.success("Repository disconnected successfully");
            queryClient.invalidateQueries({ queryKey: ["repositories"] });
        },
        onError: (error) => {
            toast.error("Failed to disconnect repository");
            console.error(error);
        }
    });

    return {
        repositories: data?.pages.flatMap((page) => page.repos) || [],
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error,
        search,
        setSearch,
        connectRepo: connectMutation.mutate,
        disconnectRepo: disconnectMutation.mutate,
        isConnecting: connectMutation.isPending,
        isDisconnecting: disconnectMutation.isPending,
    };
}
