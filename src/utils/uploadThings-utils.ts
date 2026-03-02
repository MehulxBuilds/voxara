export const deleteUploadThingsVoiceFile = async (
    key: string | string[]
) => {
    const keys = Array.isArray(key) ? key : [key];

    const response = await fetch("/api/uploadthing/delete", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ keys }),
    });

    if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to delete file(s)");
    }

    return response.json();
};