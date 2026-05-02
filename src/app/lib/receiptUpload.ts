import { supabase } from "./supabaseClient";
import { testConfig } from "./appState";

export interface UploadReceiptParams {
  userId: string;
  email: string;
  name: string;
  course: string;
  paymentType: "pdf" | "cbt";
  file: File;
}

export interface UploadReceiptResult {
  success: boolean;
  error?: string;
}

export async function uploadReceipt(params: UploadReceiptParams): Promise<UploadReceiptResult> {
  const { userId, email, name, course, paymentType, file } = params;

  // Validate file type
  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";

  if (!isImage && !isPdf) {
    return { success: false, error: "Only image files (JPG, PNG) or PDF receipts are accepted." };
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: "File is too large. Maximum size is 5MB." };
  }

  // Upload to Supabase Storage
  const fileExt = file.name.split(".").pop();
  const filePath = `${userId}/${paymentType}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("receipts")
    .upload(filePath, file, { upsert: false });

  if (uploadError) {
    return { success: false, error: "Failed to upload receipt. Please try again." };
  }

  // Get public URL (signed URL since bucket is private)
  const { data: urlData } = await supabase.storage
    .from("receipts")
    .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days

  if (!urlData?.signedUrl) {
    return { success: false, error: "Failed to process receipt URL. Please try again." };
  }

  // Insert receipt record
  const amount = paymentType === "pdf" ? testConfig.pdfPrice : testConfig.liveTestPrice;

  const { error: insertError } = await supabase.from("receipts").insert({
    user_id: userId,
    email,
    name,
    course,
    payment_type: paymentType,
    amount,
    file_url: urlData.signedUrl,
    file_type: isImage ? "image" : "pdf",
    status: "pending",
  });

  if (insertError) {
    return { success: false, error: "Failed to submit receipt. Please try again." };
  }

  return { success: true };
}
