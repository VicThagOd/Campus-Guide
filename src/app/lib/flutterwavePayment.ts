// lib/flutterwavePayment.ts
import { supabase } from "./supabaseClient";

export interface InitializeFlutterwavePaymentParams {
  amount: number;
  paymentType: "pdf" | "cbt" | "ticket" | "inspection";
  userId: string;
  email: string;
  name: string;
  course: string;
  eventId?: string;
  tierName?: string;
  ticketPrice?: number;
  accommodationId?: string;
  whatsappNumber?: string;
}

export async function initializeFlutterwavePayment(
  params: InitializeFlutterwavePaymentParams,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke("create-flutterwave-payment", {
    body: params,
  });

  if (error) {
    throw new Error(error.message || "Unable to initialize payment.");
  }

  const checkoutUrl = data?.checkoutUrl;
  if (!checkoutUrl || typeof checkoutUrl !== "string") {
    throw new Error("Payment link was not returned by the payment service.");
  }

  return checkoutUrl;
}
