import { auth } from "@/lib/auth";
import { db } from "@/server/db";
import { storage } from "@/server/storage";
import { redirect, notFound } from "next/navigation";
import { EditorClient } from "./_components/editor-client";

export default async function EditorPage({
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
      photos: { select: { id: true }, orderBy: { uploadedAt: "asc" } },
      photobook: {
        select: {
          id: true,
          size: true,
          coverType: true,
          pageCount: true,
          pages: {
            select: {
              id: true,
              pageNumber: true,
              photoId: true,
            },
            orderBy: { pageNumber: "asc" },
          },
        },
      },
    },
  });

  if (!project) notFound();

  let photobookWithPhotos = null;
  if (project.photobook) {
    const photoDetails = await db.photo.findMany({
      where: { projectId: id },
      select: { id: true, storageKey: true, fileName: true },
    });
    const photoDetailMap = new Map(
      photoDetails.map((p) => [
        p.id,
        { id: p.id, fileName: p.fileName, url: storage.getUrl(p.storageKey) },
      ])
    );

    photobookWithPhotos = {
      ...project.photobook,
      pages: project.photobook.pages.map((page) => ({
        ...page,
        photo: page.photoId ? (photoDetailMap.get(page.photoId) ?? null) : null,
      })),
    };
  }

  return (
    <EditorClient
      projectId={project.id}
      projectTitle={project.title}
      photoCount={project.photos.length}
      photobook={photobookWithPhotos}
    />
  );
}
