import { randomUUID } from "node:crypto";
import { UTApi } from "uploadthing/server";
import { Buffer } from "node:buffer";

const utapi = new UTApi();

export const uploadAudiofile = async (fileBuffer: Buffer) => {
    const blob = new Blob([new Uint8Array(fileBuffer)], { type: "audio/wav" });
    const fileName = `audio-${randomUUID()}.wav`;
    const audioFile = new File([blob], fileName, {
        type: "audio/wav",
    });
    const uploadedFile = await utapi.uploadFiles([audioFile]);

    return {
        success: true,
        key: uploadedFile?.[0].data?.key,
    }
};

export const deleteAudioFile = async (keys: string | string[]) => {
    if (!keys || (Array.isArray(keys) && keys.length === 0)) {
        throw new Error("Missing file key(s)");
    }

    // Normalize to array
    const fileKeys = Array.isArray(keys) ? keys : [keys];

    await utapi.deleteFiles(fileKeys);

    return { success: true };
}