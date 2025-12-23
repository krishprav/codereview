import { pineconeIndex } from "@/lib/pinecone";
import { embed } from "ai";
import { google } from "@ai-sdk/google";

export async function generateEmbedding(text: string) {
    const { embedding } = await embed({
        model: google.textEmbeddingModel("text-embedding-004"),
        value: text,
    });
    return embedding;
}

export async function indexCodebase(repoId: string, files: { path: string; content: string }[]) {
    const vectors = [];

    console.log(`Indexing ${files.length} files for repo ${repoId}...`);

    for (const file of files) {
        // Simple chunking: take first 8000 chars for now. 
        // In a real app, we'd use a smarter chunker/splitter.
        const content = `File: ${file.path}\n\n${file.content}`;
        const truncatedContent = content.slice(0, 8000);

        try {
            const embedding = await generateEmbedding(truncatedContent);

            // Sanitize path for ID
            const safePath = file.path.replace(/[^a-zA-Z0-9-_]/g, '_');

            vectors.push({
                id: `${repoId}-${safePath}`,
                values: embedding,
                metadata: {
                    repoId,
                    path: file.path,
                    content: truncatedContent // Store content for RAG retrieval
                }
            });
        } catch (e) {
            console.error(`Failed to embed ${file.path}:`, e);
        }
    }

    if (vectors.length > 0) {
        const batchSize = 100;
        for (let i = 0; i < vectors.length; i += batchSize) {
            const batch = vectors.slice(i, i + batchSize);
            await pineconeIndex.upsert(batch);
            console.log(`Upserted batch ${Math.floor(i / batchSize) + 1}`);
        }
    }

    console.log("Indexing complete");
}

export async function retrieveContext(query: string, repoId: string, topK: number = 5) {
    try {
        const embedding = await generateEmbedding(query);

        const results = await pineconeIndex.query({
            vector: embedding,
            filter: { repoId },
            topK,
            includeMetadata: true
        });

        return results.matches.map(match => match.metadata?.content as string).filter(Boolean);
    } catch (error) {
        console.error("Error retrieving context:", error);
        return [];
    }
}
