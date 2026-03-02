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

export const uploadUploadThingsVoiceFile = async (
    file: Buffer
) => {

    if (!file) {
        return {
            success: false,
            key: "",
        }
    }

    const response = await fetch("/api/uploadthing/upload", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ file }),
    });

    if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to upload file");
    }

    return response.json();
};