import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  endpoint: `https://${process.env.B2_ENDPOINT}`,
  region: process.env.B2_REGION || "us-east-005",
  credentials: {
    accessKeyId: process.env.B2_KEY_ID || "",
    secretAccessKey: process.env.B2_APP_KEY || "",
  },
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.B2_BUCKET_NAME || "Nabra-AI-System";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  // Audio types for voice notes
  "audio/webm",
  "audio/mpeg",
  "audio/ogg",
  "audio/mp4",
  "audio/wav",
  "audio/m4a",
  "audio/aac",
  // Video types
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  "video/mpeg",
]);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB" }, { status: 400 });
    }

    const timestamp = Date.now();
    const sanitizedFileName = file.name.replaceAll(/[^a-zA-Z0-9.-]/g, "_");
    const key = `uploads/${session.user.id}/${timestamp}-${sanitizedFileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    return NextResponse.json({
      success: true,
      url: `/api/files/${key}`,
      filename: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
