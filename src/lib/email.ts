// Email sending via SendByte (https://sendbyte.io).
// Stub for now: no API key configured, so sends are silently skipped.
// Wire the real SendByte HTTP endpoint here when the key is available.

const SENDBYTE_API_KEY = import.meta.env.VITE_SENDBYTE_API_KEY as string | undefined;

export function isEmailConfigured(): boolean {
  return Boolean(SENDBYTE_API_KEY);
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  if (!isEmailConfigured()) {
    console.info("[email] SendByte not configured, skipping:", message.subject);
    return;
  }
  // TODO: POST to the SendByte transactional email endpoint with SENDBYTE_API_KEY.
  throw new Error("SendByte integration not wired yet");
}
