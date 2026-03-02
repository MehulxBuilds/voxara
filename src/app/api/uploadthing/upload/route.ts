import { NextResponse } from "next/server";
import { uploadUploadThingFile } from "../core";

export async function POST(req: Request) {
    const { file } = await req.json();

    if (!file) {
        return NextResponse.json(
            { error: "Missing file" },
            { status: 400 }
        );
    }

    const res = await uploadUploadThingFile(file);

    return NextResponse.json({ success: true, key: res?.key || "" });
}