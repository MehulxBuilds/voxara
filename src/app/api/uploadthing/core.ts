import { currentUser } from "@clerk/nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { UTApi } from "uploadthing/server";

const f = createUploadthing();
const utapi = new UTApi();

export const ourFileRouter = {

    VoiceUpload: f({
        audio: {
            maxFileSize: "64MB",
            maxFileCount: 1
        },
    })
        .middleware(async () => {
            const user = await currentUser();
            if (!user?.id) {
                throw new UploadThingError("Unauthorized");
            }
            return { user };
        })
        .onUploadComplete(async ({ file }) => {
            return { fileKey: file.key, fileType: file.type }
        }),

} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

export async function deleteUploadThingFile(
  keys: string | string[]
) {
  if (!keys || (Array.isArray(keys) && keys.length === 0)) {
    throw new Error("Missing file key(s)");
  }

  // Normalize to array
  const fileKeys = Array.isArray(keys) ? keys : [keys];

  await utapi.deleteFiles(fileKeys);

  return { success: true };
}