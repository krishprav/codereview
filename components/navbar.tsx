"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, FolderGit2, FileText, Settings, LogOut, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Repository", href: "/dashboard/repository", icon: FolderGit2 },
    { name: "Reviews", href: "/dashboard/reviews", icon: FileText },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Navbar() {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const { data: session } = authClient.useSession();

    const handleSignOut = async () => {
        await authClient.signOut();
        router.push("/login");
    };

    return (
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <Image src="/logo.png" alt="Merge Wisely" width={28} height={28} className="rounded" />
                        <span className="font-semibold text-lg hidden sm:inline">Merge Wisely</span>
                    </Link>

                    {/* Navigation */}
                    <nav className="flex items-center gap-1">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                            const Icon = item.icon;

                            return (
                                <Link key={item.name} href={item.href}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`gap-2 ${isActive
                                                ? "bg-muted text-foreground"
                                                : "text-muted-foreground hover:text-foreground"
                                            }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span className="hidden md:inline">{item.name}</span>
                                    </Button>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right section */}
                    <div className="flex items-center gap-2">
                        {/* Theme Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        >
                            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                        </Button>

                        {/* User Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={session?.user.image || ""} alt={session?.user.name || ""} />
                                        <AvatarFallback>{session?.user.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <div className="flex items-center justify-start gap-2 p-2">
                                    <div className="flex flex-col space-y-1 leading-none">
                                        {session?.user.name && <p className="font-medium text-sm">{session.user.name}</p>}
                                        {session?.user.email && (
                                            <p className="text-xs text-muted-foreground">{session.user.email}</p>
                                        )}
                                    </div>
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </div>
    );
}
