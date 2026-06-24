import { NextResponse, type NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const STORAGE_ROOT = process.env.LOCAL_UPLOAD_DIR || path.join(process.cwd(), "storage");

function resolveUploadPath(key: string) {
  const storageRoot = path.resolve(STORAGE_ROOT);
  const filePath = path.resolve(storageRoot, key);

  if (!filePath.startsWith(`${storageRoot}${path.sep}`)) {
    return null;
  }

  return filePath;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params;
    const key = path.join("/");

    if (!key.startsWith("uploads/")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const filePath = resolveUploadPath(key);
    if (!filePath) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const [buffer, metadata] = await Promise.all([
      readFile(filePath),
      readFile(`${filePath}.meta.json`, "utf8")
        .then((value) => JSON.parse(value) as { contentType?: string })
        .catch(() => null),
    ]);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": metadata?.contentType || "application/octet-stream",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("File fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 });
  }
}
