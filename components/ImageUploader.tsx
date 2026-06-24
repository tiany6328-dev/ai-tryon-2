"use client";

import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { validateImageFile } from "@/lib/validation";

type ImageUploaderProps = {
  title: string;
  description: string;
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
};

export function ImageUploader({
  title,
  description,
  file,
  onChange,
  disabled = false
}: ImageUploaderProps) {
  const inputId = useId();
  const [error, setError] = useState("");

  const previewUrl = useMemo(() => {
    return file ? URL.createObjectURL(file) : "";
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;
    setError("");

    if (!selectedFile) {
      onChange(null);
      return;
    }

    const validationError = validateImageFile(selectedFile);

    if (validationError) {
      setError(validationError);
      event.target.value = "";
      onChange(null);
      return;
    }

    onChange(selectedFile);
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-neutral-950">{title}</h2>
        <p className="mt-1 text-sm text-neutral-600">{description}</p>
      </div>

      <label
        htmlFor={inputId}
        className={`group relative flex aspect-[4/5] cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed bg-white/78 shadow-sm transition ${
          disabled
            ? "cursor-not-allowed border-neutral-200 opacity-65"
            : "border-neutral-300 hover:border-neutral-900 hover:bg-white"
        }`}
      >
        {previewUrl ? (
          <>
            <Image src={previewUrl} alt={title} fill className="object-cover" unoptimized />
            <button
              type="button"
              aria-label="移除图片"
              disabled={disabled}
              onClick={(event) => {
                event.preventDefault();
                onChange(null);
              }}
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/92 text-neutral-900 shadow-sm transition hover:bg-neutral-950 hover:text-white disabled:pointer-events-none"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="flex max-w-[14rem] flex-col items-center px-6 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-neutral-950 text-white shadow-sm">
              <ImagePlus className="h-5 w-5" />
            </span>
            <span className="mt-4 text-sm font-medium text-neutral-950">点击选择图片</span>
            <span className="mt-1 text-xs leading-5 text-neutral-500">JPG、PNG、WebP，不超过 10MB</span>
          </div>
        )}

        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={disabled}
          onChange={handleFileChange}
          className="sr-only"
        />
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
