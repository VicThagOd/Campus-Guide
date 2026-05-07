import { supabase } from "./supabaseClient";

export interface InitializeKorapayPaymentParams {
  amount: number;
  paymentType: "pdf" | "cbt";
  userId: string;
  email: string;
  name: string;
  course: string;
}

export async function initializeKorapayPayment(
  params: InitializeKorapayPaymentParams,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke("create-korapay-payment", {
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