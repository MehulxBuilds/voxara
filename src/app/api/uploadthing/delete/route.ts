import { NextResponse } from "next/server";
import { deleteUploadThingFile } from "../core";

export async function POST(req: Request) {
  const { keys } = await req.json();

  if (!keys) {
    return NextResponse.json(
      { error: "Missing file key(s)" },
      { status: 400 }
    );
  }

  await deleteUploadThingFile(keys);

  return NextResponse.json({ success: true });
}