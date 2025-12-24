import { getUserProfile } from "@/modules/settings/actions";
import { ProfileForm } from "@/modules/settings/components/profile-form";
import { ConnectedRepos } from "@/modules/settings/components/connected-repos";
import { ApiKeySettings } from "@/modules/settings/components/api-key-settings";
import { Separator } from "@/components/ui/separator";

export default async function SettingsPage() {
    const user = await getUserProfile();

    if (!user) {
        return <div>Unauthorized</div>;
    }

    return (
        <div className="space-y-6 p-10 pb-16 md:block">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account settings and connected repositories.
                </p>
            </div>
            <Separator className="my-6" />
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="-mx-4 lg:w-1/5">
                    {/* Sidebar Navigation could go here if we had more settings tabs */}
                    <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
                        <a href="#profile" className="justify-start rounded-md bg-muted p-2 hover:bg-muted/80 font-medium">Profile</a>
                        <a href="#ai" className="justify-start rounded-md p-2 hover:bg-muted font-medium">AI Config</a>
                        <a href="#repos" className="justify-start rounded-md p-2 hover:bg-muted font-medium">Repositories</a>
                    </nav>
                </aside>
                <div className="flex-1 lg:max-w-4xl space-y-10">
                    <section id="profile">
                        <ProfileForm user={user} />
                    </section>

                    <Separator />

                    <section id="ai" className="space-y-4">
                        <ApiKeySettings initialApiKey={user.geminiApiKey} />
                    </section>

                    <Separator />

                    <section id="repos" className="space-y-4">
                        <div>
                            <h3 className="text-lg font-medium">Connected Repositories</h3>
                            <p className="text-sm text-muted-foreground">
                                Manage the repositories you have connected to this dashboard.
                            </p>
                        </div>
                        <ConnectedRepos />
                    </section>
                </div>
            </div>
        </div>
    );
}
