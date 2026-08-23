import fs from "node:fs/promises";
import path from "node:path";
import { env } from "@/config/env";

const EXT_TO_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key } = await params;
  const baseDir = env.UPLOAD_DIR ?? path.join(process.cwd(), ".uploads");
  const filePath = path.join(baseDir, ...key);

  // Prevent path traversal: resolved path must stay inside baseDir
  const resolved = path.resolve(filePath);
  const resolvedBase = path.resolve(baseDir);
  if (!resolved.startsWith(resolvedBase + path.sep)) {
    return new Response(null, { status: 400 });
  }

  try {
    const data = await fs.readFile(resolved);
    const ext = path.extname(resolved).toLowerCase();
    const contentType = EXT_TO_MIME[ext] ?? "application/octet-stream";
    return new Response(data, { headers: { "Content-Type": contentType } });
  } catch {
    return new Response(null, { status: 404 });
  }
}
