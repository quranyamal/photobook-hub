"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SIZE_CONFIG,
  COVER_CONFIG,
  getTotalPriceCents,
  formatPrice,
} from "@/config/pricing";
import type { CoverType, PhotobookSize } from "@/generated/prisma/enums";

type Photo = {
  id: string;
  fileName: string;
  url: string;
};

type Page = {
  id: string;
  pageNumber: number;
  photoId: string | null;
  photo: Photo | null;
};

type Photobook = {
  id: string;
  size: PhotobookSize;
  coverType: CoverType;
  pageCount: number;
  pages: Page[];
};

type Props = {
  projectId: string;
  projectTitle: string;
  photoCount: number;
  photobook: Photobook | null;
};

export function EditorClient({
  projectId,
  projectTitle,
  photoCount,
  photobook: initialPhotobook,
}: Props) {
  const router = useRouter();
  const [photobook, setPhotobook] = useState<Photobook | null>(initialPhotobook);
  const [size, setSize] = useState<PhotobookSize>(initialPhotobook?.size ?? "A4");
  const [coverType, setCoverType] = useState<CoverType>(
    initialPhotobook?.coverType ?? "SOFTCOVER"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when server refreshes props (e.g. after router.refresh() post-creation)
  useEffect(() => {
    setPhotobook(initialPhotobook);
  }, [initialPhotobook]);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/photobook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Failed to create photobook");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/photobook`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size, coverType }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Failed to update photobook");
        return;
      }
      setPhotobook((prev) => prev ? { ...prev, size, coverType } : prev);
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = formatPrice(getTotalPriceCents(size, coverType));

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/projects/${projectId}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← {projectTitle}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight mt-2">Photobook Editor</h1>
      </div>

      {/* Step 1 — Configure */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">
          {photobook ? "Options" : "Step 1 — Choose options"}
        </h2>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Size</p>
          <div className="flex flex-wrap gap-2">
            {(["A4", "A5", "SQUARE"] as PhotobookSize[]).map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                  size === s
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                <span className="font-medium">{SIZE_CONFIG[s].label}</span>
                <span className="ml-1.5 text-xs opacity-70">
                  {SIZE_CONFIG[s].description}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Cover type</p>
          <div className="flex flex-wrap gap-2">
            {(["SOFTCOVER", "HARDCOVER"] as CoverType[]).map((c) => (
              <button
                key={c}
                onClick={() => setCoverType(c)}
                className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                  coverType === c
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                {COVER_CONFIG[c].label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm font-medium">
          Total: <span className="text-base">{totalPrice}</span>
        </p>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {!photobook ? (
          photoCount === 0 ? (
            <p className="text-sm text-muted-foreground">
              Upload photos to your project before creating a photobook.
            </p>
          ) : (
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? "Creating…" : `Create photobook (${photoCount} pages)`}
            </Button>
          )
        ) : (
          <Button variant="outline" onClick={handleUpdateOptions} disabled={loading}>
            {loading ? "Saving…" : "Save options"}
          </Button>
        )}
      </section>

      {/* Step 2 — Preview */}
      {photobook && (
        <section className="space-y-4">
          <h2 className="text-base font-semibold">Preview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {photobook.pages.map((page) => {
              const ratio = SIZE_CONFIG[photobook.size].aspectRatio;
              return (
                <div key={page.id} className="space-y-1">
                  <div
                    className="relative w-full overflow-hidden rounded-lg border bg-muted"
                    style={{ paddingBottom: `${(1 / ratio) * 100}%` }}
                  >
                    {page.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={page.photo.url}
                        alt={page.photo.fileName}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
                        Blank
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Page {page.pageNumber}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Card size="sm" className="flex-1">
              <CardHeader>
                <CardTitle>{SIZE_CONFIG[photobook.size].label} · {COVER_CONFIG[photobook.coverType].label}</CardTitle>
                <CardDescription>
                  {photobook.pageCount} pages · {totalPrice}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/checkout/${photobook.id}`}>
                  <Button className="w-full">Proceed to order</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}
