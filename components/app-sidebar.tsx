"use client";
import { Github, BookOpen, Settings, LogOut, DollarSign, Moon, Sun, MessageSquareCode } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { useTheme } from "next-themes";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

export const AppSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  if (!session) return null;

  const user = session?.user;
  const userName = user?.name || "GUEST"
  const userImage = user?.image;
  const userInitials = userName.split(" ").map((name) => name[0]).join("").toUpperCase().slice(0, 2);

  const navigationItem = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: BookOpen,
    },
    {
      title: "Repository",
      url: "/dashboard/repository",
      icon: Github,
    },
    {
      title: "Reviews",
      url: "/dashboard/reviews",
      icon: MessageSquareCode,
    },
    {
      title: "Subscription",
      url: "/dashboard/subscription",
      icon: DollarSign,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: Settings,
    },
    {
      title: "Logout",
      icon: LogOut,
      isAction: true,
    },
  ]

  const isActive = (url: string) => {
    return pathname === url || pathname.startsWith(url + "/");
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex flex-col gap-4 px-2 py-6">
          <div className="flex items-center gap-4 px-3 py-4 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent/70 transition-colors">
            <Avatar className="h-12 w-12 shrink-0">
              <AvatarImage src={userImage || undefined} alt={userName} />
              <AvatarFallback className="bg-sidebar-primary text-primary-foreground">
                {userInitials || <Github className="w-6 h-6" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground tracking-wide">Connected Account</p>
              <p className=" text-sm font-medium text-sidebar-foreground/90">@{userName}</p>
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3 py-6 flex-col gap-1">
        <div className="mb-2">
          <p className="text-xs font-semibold text-sidebar-foreground/60 px-3 mb-3 uppercase tracking-wide">Menu</p>
        </div>
        <SidebarMenu className="gap-2">
          {
            navigationItem.map((item) => {
              const Icon = item.icon;
              const handleClick = item.isAction ? () => {
                if (item.title === "Logout") {
                  signOut({
                    fetchOptions: {
                      onSuccess: () => {
                        router.push('/login')
                      }
                    }
                  });
                }
              } : undefined;

              if (item.isAction) {
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      onClick={handleClick}
                      className="h-11 px-4 rounded-lg transition-all duration-200 hover:bg-sidebar-accent/60 text-sidebar-foreground w-full"
                    >
                      <div className="flex items-center gap-3">
                        {Icon && <Icon className="w-5 h-5 shrink-0" />}
                        <span className="text-sm font-medium">{item.title}</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} className={`h-11 px-4 rounded-lg transition-all duration-200 ${item.url && isActive(item.url) ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" : "hover:bg-sidebar-accent/60 text-sidebar-foreground"}`}>
                    <Link href={item.url || "#"} className="flex items-center gap-3">
                      {Icon && <Icon className="w-5 h-5 shrink-0" />}
                      <span className="text-sm font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })
          }
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        <SidebarMenuButton
          tooltip={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-11 px-4 rounded-lg transition-all duration-200 hover:bg-sidebar-accent/60 text-sidebar-foreground w-full"
        >
          <div className="flex items-center gap-3">
            {theme === "dark" ? (
              <>
                <Sun className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">Dark Mode</span>
              </>
            )}
          </div>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  )
}