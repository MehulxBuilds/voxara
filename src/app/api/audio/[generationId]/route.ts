import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ generationId: string }> },
) {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { generationId } = await params;

    const generation = await prisma.generation.findUnique({
        where: { id: generationId, orgId },
    });

    if (!generation) {
        return new Response("Not found", { status: 404 });
    }

    if (!generation.r2ObjectKey) {
        return new Response("Audio is not available yet", { status: 409 });
    }

    const signedUrl = await utapi.getSignedURL(generation.r2ObjectKey, {
        expiresIn: 3600
    });

    const audioResponse = await fetch(signedUrl?.url);

    if (!audioResponse.ok) {
        return new Response("Failed to fetch audio", { status: 500 });
    }

    return new Response(audioResponse.body, {
        headers: {
            "Content-Type": "audio/wav",
            "Cache-Control": "private, max-age=3600",
        },
    });
}