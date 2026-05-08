// lib/credoPayment.ts
import { supabase } from "./supabaseClient";

export interface InitializeCredoPaymentParams {
  amount: number;
  paymentType: "pdf" | "cbt";
  userId: string;
  email: string;
  name: string;
  course: string;
}

export async function initializeCredoPayment(
  params: InitializeCredoPaymentParams,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke("create-credo-payment", {
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