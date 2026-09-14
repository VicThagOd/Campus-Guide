import { supabase } from "./supabaseClient";

const DEFAULT_BUCKET = "past-questions";
const DEFAULT_FOLDER = "pdf";

// Direct mapping from the 16 faculties to the exact PDF files available on Supabase
const FACULTY_PDF_MAP: Record<string, string[]> = {
  "agriculture": ["pdf/Medicine_and_Surgery.pdf", "pdf/Sciences.pdf"],
  "allied health sciences": ["pdf/Nursing.pdf", "pdf/Anatomy.pdf", "pdf/Physiology.pdf"],
  "basic medical sciences": ["pdf/Anatomy.pdf", "pdf/Physiology.pdf", "pdf/Medicine_and_Surgery.pdf"],
  "clinical sciences": ["pdf/Medicine_and_Surgery.pdf"],
  "communication and media studies": ["pdf/humanities-communication-and-media-studies.pdf", "pdf/humanities-communication-media-studies.pdf"],
  "computing": ["pdf/Computing.pdf"],
  "dentistry": ["pdf/Dentistry.pdf"],
  "education": ["pdf/humanities-communication-and-media-studies.pdf", "pdf/Social_Sciences.pdf"],
  "engineering": ["pdf/Engineering.pdf"],
  "humanities": ["pdf/humanities-communication-and-media-studies.pdf"],
  "law": ["pdf/Law.pdf"],
  "management sciences": ["pdf/Management_Sciences.pdf"],
  "pharmaceutical sciences": ["pdf/Pharmacy.pdf"],
  "school of science laboratory technology": ["pdf/SSLT.pdf"],
  "science": ["pdf/Sciences.pdf"],
  "social sciences": ["pdf/Social_Sciences.pdf"],
};

function slugifyCourse(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getPastQuestionsObjectPath(course: string): string {
  const safeCourse = course && course.trim() ? course.trim().toLowerCase() : "post-utme-candidate";
  const mapped = FACULTY_PDF_MAP[safeCourse];
  if (mapped && mapped.length > 0) {
    return mapped[0];
  }
  const slug = slugifyCourse(safeCourse);
  return `${DEFAULT_FOLDER}/${slug}.pdf`;
}

async function resolveObjectPathFromDb(course: string): Promise<string | null> {
  if (!course?.trim()) return null;

  const { data, error } = await supabase
    .from("pdf_files")
    .select("file_path")
    .ilike("title", course.trim())
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
  const normalizedCourse = (params.course || "").trim().toLowerCase();

  // Build candidate paths to try in priority order
  const candidatePaths: string[] = [];

  // 1. Try DB lookup first if available
  const dbPath = await resolveObjectPathFromDb(params.course);
  if (dbPath) candidatePaths.push(dbPath);

  // 2. Try explicit faculty PDF mappings
  const mappedPaths = FACULTY_PDF_MAP[normalizedCourse];
  if (mappedPaths) {
    mappedPaths.forEach((path) => {
      if (!candidatePaths.includes(path)) candidatePaths.push(path);
    });
  }

  // 3. Fallbacks with different naming conventions
  const courseSlug = slugifyCourse(params.course);
  const fallbacks = [
    `${DEFAULT_FOLDER}/${courseSlug}.pdf`,
    `${DEFAULT_FOLDER}/${params.course.trim()}.pdf`,
    `${DEFAULT_FOLDER}/${params.course.trim().replace(/\s+/g, "_")}.pdf`,
    `${DEFAULT_FOLDER}/${params.course.trim().replace(/\s+/g, "-")}.pdf`,
  ];

  fallbacks.forEach((fb) => {
    if (!candidatePaths.includes(fb)) candidatePaths.push(fb);
  });

  let lastError: any = null;

  for (const objectPath of candidatePaths) {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(objectPath, expiresIn);
    if (!error && data?.signedUrl) {
      const derivedName = objectPath.split("/").pop() || `${courseSlug}.pdf`;
      return { url: data.signedUrl, filename: derivedName };
    }
    lastError = error;
  }

  const reason = lastError ? ` (${lastError.message})` : "";
  throw new Error(`Could not generate download link for "${params.course}"${reason}`);
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
