import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, Shield, Clock, GitBranch } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Merge Wisely" width={32} height={32} className="rounded" />
            <span className="text-xl font-semibold">Merge Wisely</span>
          </div>
          <Link href="/login">
            <Button variant="outline">Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 border rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Code Reviews
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Code Reviews That
            <span className="block mt-2">Actually Help</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Get instant, intelligent PR reviews powered by AI. Catch bugs, improve code quality,
            and ship faster with actionable feedback on every pull request.
          </p>

          <div className="flex gap-4 justify-center pt-4">
            <Link href="/login">
              <Button size="lg" className="gap-2">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="https://github.com/krishprav/codereview" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline">
                View on GitHub
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="p-6 rounded-lg bg-background border hover:shadow-lg transition-shadow">
              <div className="h-10 w-10 rounded border flex items-center justify-center mb-4">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Get comprehensive code reviews in seconds. No more waiting days for feedback.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-lg bg-background border hover:shadow-lg transition-shadow">
              <div className="h-10 w-10 rounded border flex items-center justify-center mb-4">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI-Powered Insights</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Advanced AI understands your codebase context for relevant, actionable suggestions.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-lg bg-background border hover:shadow-lg transition-shadow">
              <div className="h-10 w-10 rounded border flex items-center justify-center mb-4">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Security First</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Catch security vulnerabilities and code smells before they reach production.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-lg bg-background border hover:shadow-lg transition-shadow">
              <div className="h-10 w-10 rounded border flex items-center justify-center mb-4">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold mb-2">One-Click Apply</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Apply suggested fixes directly from GitHub with inline code suggestions.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-lg bg-background border hover:shadow-lg transition-shadow">
              <div className="h-10 w-10 rounded border flex items-center justify-center mb-4">
                <GitBranch className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Git Integration</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Seamlessly integrates with your existing GitHub workflow. No configuration needed.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-lg bg-background border hover:shadow-lg transition-shadow">
              <div className="h-10 w-10 rounded border flex items-center justify-center mb-4">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Free to Use</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Bring your own API key. No subscriptions, no limits, complete control.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold">
              Ready to Merge Wisely?
            </h2>
            <p className="text-lg text-muted-foreground">
              Start getting AI-powered code reviews in under 2 minutes
            </p>
            <Link href="/login">
              <Button size="lg" className="gap-2">
                Get Started Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 Merge Wisely. Built by{" "}
              <a href="https://github.com/krishprav" target="_blank" rel="noopener noreferrer" className="hover:underline">
                @krishprav
              </a>
            </p>
            <div className="flex gap-6 text-sm">
              <a href="https://github.com/krishprav/codereview" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
