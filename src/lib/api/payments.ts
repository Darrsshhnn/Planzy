/**
 * Mock payment gateway. Swap for Razorpay / Stripe checkout later;
 * the UI only depends on this function's signature.
 */
import type { PaymentMethod } from "@/lib/types";

export interface PaymentResult {
  reference: string;
  paidAt: number;
}

export async function processPayment(input: {
  amount: number;
  method: PaymentMethod;
}): Promise<PaymentResult> {
  await new Promise((resolve) => setTimeout(resolve, 1600));
  const reference = `PLZ-${input.method.toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  return { reference, paidAt: Date.now() };
}

export const CONVENIENCE_FEE = 20;
