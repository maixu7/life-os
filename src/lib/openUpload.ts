import type { UploadCat } from "@/components/UploadSheet";

// Opens the upload screen (kept tiny so pages don't load the whole upload sheet to show its button).
export const openUpload = (cat?: UploadCat) => window.dispatchEvent(new CustomEvent("lifeos-upload", { detail: cat ?? null }));
