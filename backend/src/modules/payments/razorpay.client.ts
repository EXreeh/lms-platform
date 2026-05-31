import Razorpay from "razorpay";
import { env, isRazorpayConfigured } from "../../config/env.js";
import { ApiError } from "../../utils/api-error.js";

let client: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (!isRazorpayConfigured) {
    throw ApiError.internal("Payment gateway is not configured");
  }
  if (!client) {
    client = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID!,
      key_secret: env.RAZORPAY_KEY_SECRET!,
    });
  }
  return client;
}

export function getRazorpayKeyId(): string {
  if (!env.RAZORPAY_KEY_ID) {
    throw ApiError.internal("Payment gateway is not configured");
  }
  return env.RAZORPAY_KEY_ID;
}
