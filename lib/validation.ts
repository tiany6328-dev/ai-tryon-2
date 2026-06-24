export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return "只支持 JPG、PNG 或 WebP 图片。";
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return "图片不能超过 10MB。";
  }

  return null;
}

export function getSafeUploadName(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExtension = ["jpg", "jpeg", "png", "webp"].includes(extension) ? extension : "jpg";
  return `tryon/${crypto.randomUUID()}.${safeExtension}`;
}
