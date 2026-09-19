// lib/flutterwavePayment.ts
import { supabase } from "./supabaseClient";

export interface TicketOrderItem {
  tierName: string;
  tierPrice: number;
  quantity: number;
  tierId?: string;
}

export interface InitializeFlutterwavePaymentParams {
  amount: number;
  paymentType: "pdf" | "cbt" | "ticket" | "inspection" | "tier" | "pageant";
  userId: string;
  email: string;
  name: string;
  course: string;
  eventId?: string;
  tierId?: string;
  tierName?: string;
  ticketPrice?: number;
  items?: TicketOrderItem[];
  accommodationId?: string;
  whatsappNumber?: string;
  contestantId?: string;
}

export async function initializeFlutterwavePayment(
  params: InitializeFlutterwavePaymentParams,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke("create-flutterwave-payment", {
    body: params,
  });

  if (error) {
    let message = error.message || "Unable to initialize payment.";
    if (error.context && typeof error.context.text === "function") {
      try {
        const bodyText = await error.context.text();
        if (bodyText) {
          message = bodyText;
        }
      } catch (_) {}
    }
    throw new Error(message);
  }

  const checkoutUrl = data?.checkoutUrl;
  if (!checkoutUrl || typeof checkoutUrl !== "string") {
    throw new Error("Payment link was not returned by the payment service.");
  }

  return checkoutUrl;
}
