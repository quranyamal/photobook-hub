"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Photo = {
  id: string;
  fileName: string;
  mimeType: string;
  url: string;
};

export function PhotoGrid({
  projectId,
  photos,
}: {
  projectId: string;
  photos: Photo[];
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (photoId: string) => {
    setDeleting(photoId);
    try {
      await fetch(`/api/projects/${projectId}/photos/${photoId}`, {
        method: "DELETE",
      });
      router.refresh();
    } finally {
      setDeleting(null);
    }
  };

  if (photos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No photos yet. Upload some above.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {photos.map((photo) => (
        <div key={photo.id} className="space-y-1.5">
          <div className="aspect-square overflow-hidden rounded-lg bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={photo.fileName}
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-xs text-muted-foreground truncate">{photo.fileName}</p>
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={() => handleDelete(photo.id)}
            disabled={deleting === photo.id}
          >
            <Trash2 />
            {deleting === photo.id ? "Deleting…" : "Delete"}
          </Button>
        </div>
      ))}
    </div>
  );
}
