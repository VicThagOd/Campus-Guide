import { supabase } from "./supabaseClient";

const DEFAULT_BUCKET = "past-questions";
const DEFAULT_FOLDER = "pdf";

function slugifyCourse(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getPastQuestionsObjectPath(course: string): string {
  const safeCourse = course && course.trim() ? course : "post-utme-candidate";
  const slug = slugifyCourse(safeCourse);
  return `${DEFAULT_FOLDER}/${slug}.pdf`;
}

async function resolveObjectPathFromDb(course: string): Promise<string | null> {
  const normalized = course?.trim();
  if (!normalized) return null;

  // Uses the table you created: public.pdf_files(title, file_path, ...)
  // RLS must allow authenticated SELECT on this table.
  const { data, error } = await supabase
    .from("pdf_files")
    .select("file_path")
    .ilike("title", normalized)
    .limit(1)
    .maybeSingle();

  if (error || !data?.file_path) {
    return null;
  }

  return String(data.file_path);
}

export async function createPastQuestionsDownloadUrl(params: {
  course: string;
  bucket?: string;
  expiresInSeconds?: number;
}): Promise<{ url: string; filename: string }> {
  const bucket = params.bucket || DEFAULT_BUCKET;
  const expiresIn = params.expiresInSeconds ?? 60 * 10;
  const objectPath = (await resolveObjectPathFromDb(params.course)) ?? getPastQuestionsObjectPath(params.course);

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(objectPath, expiresIn);
  if (error || !data?.signedUrl) {
    const reason = error ? ` (${error.message})` : "";
    throw new Error(`Could not generate download link for "${params.course}" at ${bucket}/${objectPath}${reason}`);
  }

  const fallbackName = `${slugifyCourse(params.course)}.pdf`;
  const derivedName = objectPath.split("/").pop() || fallbackName;
  return { url: data.signedUrl, filename: derivedName };
}

export function triggerBrowserDownload(url: string, filename: string): void {
  // Fetch the file as a blob first, then trigger download
  // This works for cross-origin URLs (like Supabase signed URLs)
  fetch(url)
    .then((response) => response.blob())
    .then((blob) => {
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    })
    .catch(() => {
      // Fallback: just open in new tab
      window.open(url, "_blank", "noopener,noreferrer");
    });
}
