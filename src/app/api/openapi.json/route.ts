import { NextResponse } from "next/server";
import { buildOpenApiDocument } from "@/server/openapi";

export function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const origin = `${url.protocol}//${url.host}`;
    const baseUrl = `${origin}/api/rest`;
    const doc = buildOpenApiDocument(baseUrl);
    return NextResponse.json(doc);
  } catch (err: any) {
    // Return error in JSON to aid debugging in Swagger UI
    return NextResponse.json(
      { error: err?.message || "Failed to generate OpenAPI document" },
      { status: 500 }
    );
  }
}
