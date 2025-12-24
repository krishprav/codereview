import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/db";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

// Test API key endpoint
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

            // If we get here, the key works
            // Now save it to the database
            await prisma.user.update({
                where: { id: session.user.id },
                data: { geminiApiKey: apiKey }
            });

            return NextResponse.json({ success: true });
        } catch (error: any) {
            console.error("API key validation failed:", error);
            return NextResponse.json({
                error: error.message || "Invalid API key"
            }, { status: 400 });
        }

    } catch (error) {
        console.error("Error saving API key:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
