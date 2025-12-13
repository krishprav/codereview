"use client"
import { signIn } from '@/lib/auth-client'
import { GithubIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

const LoginUI = () => {
    const [isLoading, setIsLoading] = useState(false);

    const handleSignIn = async () => {
        setIsLoading(true);
        try {
            await signIn.social({
                provider: 'github',
            });
        } catch (error) {
            console.error('Sign in error:', error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-8 shadow-sm">
                <div className="space-y-2 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        Welcome
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Sign in with GitHub to continue
                    </p>
                </div>
                <Button
                    onClick={handleSignIn}
                    disabled={isLoading}
                    className="w-full"
                    size="lg"
                >
                    {isLoading ? (
                        <>
                            <GithubIcon className="h-4 w-4 animate-pulse" />
                            Signing in...
                        </>
                    ) : (
                        <>
                            <GithubIcon className="h-4 w-4" />
                            Sign in with GitHub
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}

export default LoginUI