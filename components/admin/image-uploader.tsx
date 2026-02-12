"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, X } from "lucide-react";
import Image from "next/image";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(
    async (files: FileList) => {
      setUploading(true);
      const supabase = createClient();
      const newUrls: string[] = [];

      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const path = `products/${fileName}`;

        const { error } = await supabase.storage
          .from("product-images")
          .upload(path, file);

        if (!error) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("product-images").getPublicUrl(path);
          newUrls.push(publicUrl);
        }
      }

      onChange([...images, ...newUrls]);
      setUploading(false);
    },
    [images, onChange]
  );

  function removeImage(index: number) {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      handleUpload(e.dataTransfer.files);
    }
  }

  return (
    <div className="space-y-3">
      {/* Preview */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((url, i) => (
            <div key={url} className="group relative">
              <div className="relative h-24 w-24 overflow-hidden rounded-lg border">
                <Image
                  src={url}
                  alt={`Product image ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[10px] text-white">
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors hover:border-primary/50"
      >
        <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {uploading ? "Uploading..." : "Drag images here or click to upload"}
        </p>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => e.target.files && handleUpload(e.target.files)}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={uploading}
          style={{ position: "relative" }}
        />
      </div>
    </div>
  );
}
