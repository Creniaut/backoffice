export const MAX_IMAGE_BYTES = 5242880;

export const IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

const EXTENSIONS: Record<(typeof IMAGE_TYPES)[number], string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

function isImageType(type: string): type is (typeof IMAGE_TYPES)[number] {
  return (IMAGE_TYPES as readonly string[]).includes(type);
}

export function validateImage(file: File): string | null {
  if (!isImageType(file.type)) {
    return "Format non pris en charge : PNG, JPEG, WebP ou GIF.";
  }
  if (file.size > MAX_IMAGE_BYTES) return "Image trop lourde : 5 Mo maximum.";
  return null;
}

export function imageExtension(file: File): string {
  return isImageType(file.type) ? EXTENSIONS[file.type] : "bin";
}
