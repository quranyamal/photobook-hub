"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

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
        <div
          key={photo.id}
          className="relative aspect-square overflow-hidden rounded-lg bg-muted"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.url}
            alt={photo.fileName}
            className="w-full h-full object-cover"
          />
          {/* Gradient + filename */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)",
              padding: "6px 8px",
            }}
          >
            <p className="text-white text-xs truncate">{photo.fileName}</p>
          </div>
          {/* Delete button — GPU layer promoted so it always renders above the img */}
          <button
            onClick={() => handleDelete(photo.id)}
            disabled={deleting === photo.id}
            aria-label={`Delete ${photo.fileName}`}
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 24,
              height: 24,
              borderRadius: 6,
              border: "none",
              cursor: deleting === photo.id ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.9)",
              color: "#dc2626",
              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              transform: "translateZ(0)",
              zIndex: 50,
              opacity: deleting === photo.id ? 0.5 : 1,
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
