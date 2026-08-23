import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { storage } from "@/server/storage";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { PhotoUploadZone } from "./_components/photo-upload-zone";
import { PhotoGrid } from "./_components/photo-grid";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const project = await db.project.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      title: true,
      status: true,
      photos: {
        select: {
          id: true,
          fileName: true,
          storageKey: true,
          mimeType: true,
        },
        orderBy: { uploadedAt: "asc" },
      },
    },
  });

  if (!project) notFound();

  const photos = project.photos.map((p) => ({
    id: p.id,
    fileName: p.fileName,
    mimeType: p.mimeType,
    url: storage.getUrl(p.storageKey),
  }));

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/projects"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Projects
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mt-2">
          {project.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {photos.length} {photos.length === 1 ? "photo" : "photos"}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Upload photos</h2>
        <PhotoUploadZone projectId={project.id} />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Photos</h2>
        <PhotoGrid projectId={project.id} photos={photos} />
      </section>
    </div>
  );
}
