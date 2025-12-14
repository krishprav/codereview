
import { RepositoryList } from "@/modules/repository/ui/RepositoryList";

export default function RepositoryPage() {
    return (
        <div className="space-y-6">
            <div>
                 <h2 className="text-3xl font-bold tracking-tight">Repositories</h2>
                 <p className="text-muted-foreground">
                    Connect your GitHub repositories to track their stats.
                 </p>
            </div>
            <RepositoryList />
        </div>
    );
}
