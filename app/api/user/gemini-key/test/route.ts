import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { apiKey } = await req.json();

        if (!apiKey || typeof apiKey !== "string") {
            return NextResponse.json({ error: "Invalid API key" }, { status: 400 });
        }

        // Test the API key by making a simple request
        try {
            const google = createGoogleGenerativeAI({ apiKey });
            await generateText({
                model: google("gemini-2.5-flash"),
                prompt: "Say 'test'"
            });

            return NextResponse.json({ success: true, message: "API key is valid!" });
        } catch (error: any) {
            console.error("API key test failed:", error);
            return NextResponse.json({
                error: "Invalid API key. Please check and try again."
            }, { status: 400 });
        }

    } catch (error) {
        console.error("Error testing API key:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
