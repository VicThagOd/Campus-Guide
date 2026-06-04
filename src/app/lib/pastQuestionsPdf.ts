import { supabase } from "./supabaseClient";

const DEFAULT_BUCKET = "past-questions";
const DEFAULT_FOLDER = "pdf";

// Courses that share the same PDF as another course
const COURSE_ALIASES: Record<string, string> = {
  "allied health sciences": "nursing",
};

function slugifyCourse(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function resolveCourseAlias(course: string): string {
  const normalized = course.trim().toLowerCase();
  return COURSE_ALIASES[normalized] ?? course;
}

export function getPastQuestionsObjectPath(course: string): string {
  const safeCourse = course && course.trim() ? course : "post-utme-candidate";
  const resolved = resolveCourseAlias(safeCourse);
  const slug = slugifyCourse(resolved);
  return `${DEFAULT_FOLDER}/${slug}.pdf`;
}

async function resolveObjectPathFromDb(course: string): Promise<string | null> {
  const normalized = resolveCourseAlias(course?.trim());
  if (!normalized) return null;

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
      window.open(url, "_blank", "noopener,noreferrer");
    });
}
