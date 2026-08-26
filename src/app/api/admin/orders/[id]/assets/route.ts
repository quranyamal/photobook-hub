import path from "node:path";
import type { Archiver, ZipOptions } from "archiver";
// archiver uses export=, require is necessary for bundler moduleResolution
// eslint-disable-next-line @typescript-eslint/no-require-imports
const createArchive = require("archiver") as (format: "zip", options?: ZipOptions) => Archiver;
import { requireAdmin } from "@/lib/require-admin";
import { db } from "@/server/db";
import {
  createRequestLogger,
  getRequestId,
  tagActiveSpan,
  logResponse,
} from "@/lib/request-logger";
import { env } from "@/config/env";

async function buildZip(
  photos: { storageKey: string; fileName: string }[],
  uploadDir: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = createArchive("zip", { zlib: { level: 6 } });
    const chunks: Buffer[] = [];
    archive.on("data", (chunk: Buffer) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);

    for (const photo of photos) {
      archive.file(path.join(uploadDir, photo.storageKey), {
        name: photo.fileName,
      });
    }

    archive.finalize();
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params;
  const requestId = getRequestId(request);
  const log = createRequestLogger(requestId, {
    method: "GET",
    path: `/api/admin/orders/${orderId}/assets`,
  });
  const start = Date.now();
  log.info("Incoming request");
  tagActiveSpan(requestId);

  const adminAuth = await requireAdmin();
  if (!adminAuth.ok) return adminAuth.response;

  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { id: true, orderNumber: true, items: { select: { photobookId: true } } },
    });

    if (!order) {
      logResponse(log, 404, start, { orderId });
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const photobookId = order.items[0]?.photobookId;
    if (!photobookId) {
      logResponse(log, 404, start, { orderId, reason: "no photobook" });
      return new Response(JSON.stringify({ error: "No photobook found for this order" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const pages = await db.photobookPage.findMany({
      where: { photobookId, photoId: { not: null } },
      select: { pageNumber: true, photoId: true },
      orderBy: { pageNumber: "asc" },
    });

    const photoIds = pages.map((p) => p.photoId as string);
    const photos = await db.photo.findMany({
      where: { id: { in: photoIds } },
      select: { id: true, storageKey: true, fileName: true },
    });

    const photoMap = new Map(photos.map((p) => [p.id, p]));
    const orderedPhotos = pages
      .map((p, i) => {
        const photo = photoMap.get(p.photoId as string);
        if (!photo) return null;
        return {
          storageKey: photo.storageKey,
          fileName: `page-${String(i + 1).padStart(3, "0")}-${photo.fileName}`,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    const uploadDir = env.UPLOAD_DIR ?? path.join(process.cwd(), ".uploads");
    const zipBuffer = await buildZip(orderedPhotos, uploadDir);

    logResponse(log, 200, start, { orderId, photoCount: orderedPhotos.length });
    return new Response(zipBuffer.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="order-${order.orderNumber}-assets.zip"`,
        "Content-Length": String(zipBuffer.byteLength),
      },
    });
  } catch (error) {
    const err = error as Error;
    logResponse(log, 500, start, { error: { message: err.message, stack: err.stack } });
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
