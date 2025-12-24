"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ApiKeySettings({ initialApiKey }: { initialApiKey?: string | null }) {
    const [apiKey, setApiKey] = useState(initialApiKey || "");
    const [showKey, setShowKey] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    const handleTest = async () => {
        if (!apiKey.trim()) {
            toast.error("Please enter an API key first");
            return;
        }

        setIsTesting(true);
        try {
            const res = await fetch("/api/user/gemini-key/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ apiKey })
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("✅ API key is valid!");
            } else {
                toast.error(data.error || "Invalid API key");
            }
        } catch (error) {
            toast.error("Failed to test connection");
        } finally {
            setIsTesting(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/user/gemini-key", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ apiKey: apiKey.trim() || null })
            });

            if (res.ok) {
                toast.success("API key saved successfully!");
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to save API key");
            }
        } catch (error) {
            toast.error("Failed to save API key");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>AI Configuration</CardTitle>
                <CardDescription>
                    Configure your Gemini API key for AI-powered code reviews
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="apiKey">Gemini API Key</Label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Input
                                id="apiKey"
                                type={showKey ? "text" : "password"}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Enter your Gemini API key..."
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Don't have a key?{" "}
                        <a
                            href="https://aistudio.google.com/api-keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                            Get Free API Key
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleTest}
                        disabled={isTesting || !apiKey.trim()}
                    >
                        {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Test Connection
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
