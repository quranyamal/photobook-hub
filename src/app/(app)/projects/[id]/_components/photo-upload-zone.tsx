"use client";

import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type UploadState = {
  uid: string;
  name: string;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
};

export function PhotoUploadZone({ projectId }: { projectId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const updateUpload = (uid: string, patch: Partial<UploadState>) =>
    setUploads((prev) => prev.map((u) => (u.uid === uid ? { ...u, ...patch } : u)));

  const uploadFile = useCallback(
    (file: File) => {
      const uid = crypto.randomUUID();
      setUploads((prev) => [
        ...prev,
        { uid, name: file.name, progress: 0, status: "uploading" },
      ]);

      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          updateUpload(uid, { progress: Math.round((e.loaded / e.total) * 100) });
        }
      };

      xhr.onload = () => {
        if (xhr.status === 201) {
          updateUpload(uid, { progress: 100, status: "done" });
          router.refresh();
        } else {
          let error = "Upload failed";
          try {
            error = (JSON.parse(xhr.responseText) as { error?: string }).error ?? error;
          } catch {
            // keep default message
          }
          updateUpload(uid, { status: "error", error });
        }
      };

      xhr.onerror = () => {
        updateUpload(uid, { status: "error", error: "Network error" });
      };

      xhr.open("POST", `/api/projects/${projectId}/photos`);
      xhr.send(formData);
    },
    [projectId, router]
  );

  const handleFiles = (files: FileList | File[]) => {
    Array.from(files).forEach(uploadFile);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <div
        className={`rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
          isDragOver ? "border-primary bg-primary/5" : "border-border"
        }`}
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
      >
        <p className="text-sm text-muted-foreground mb-3">
          Drag and drop photos here, or
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          Browse files
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          JPEG or PNG · max 20 MB per file
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {uploads.length > 0 && (
        <ul className="space-y-2">
          {uploads.map((u) => (
            <li key={u.uid} className="flex items-center gap-3 text-sm">
              <span className="truncate flex-1 min-w-0">{u.name}</span>
              {u.status === "uploading" && (
                <div className="w-24 h-1.5 shrink-0 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-150"
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
              )}
              {u.status === "done" && (
                <span className="text-xs text-green-600 shrink-0">Done</span>
              )}
              {u.status === "error" && (
                <span className="text-xs text-destructive shrink-0">{u.error}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
