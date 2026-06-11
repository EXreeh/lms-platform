declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: { error?: RazorpayError }) => void) => void;
}

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayError {
  description?: string;
  reason?: string;
}

const SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
let scriptPromise: Promise<void> | null = null;

export function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Razorpay requires browser"));
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay")));
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout"));
    document.body.appendChild(script);
  });

  return scriptPromise;
}

export interface OpenCheckoutParams {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  userName?: string;
  userEmail?: string;
  onSuccess: (response: RazorpaySuccessResponse) => void | Promise<void>;
  onDismiss?: () => void;
  onFailure?: (message: string) => void;
}

export async function openRazorpayCheckout(params: OpenCheckoutParams) {
  await loadRazorpayScript();
  if (!window.Razorpay) throw new Error("Razorpay unavailable");

  const rzp = new window.Razorpay({
    key: params.keyId,
    amount: params.amount,
    currency: params.currency,
    name: "CognitiaX AI",
    description: params.description,
    order_id: params.orderId,
    prefill: { name: params.userName, email: params.userEmail },
    theme: { color: "#166534" },
    handler: (response) => {
      void params.onSuccess(response);
    },
    modal: {
      ondismiss: () => params.onDismiss?.(),
    },
  });

  rzp.on("payment.failed", (response) => {
    params.onFailure?.(response.error?.description ?? response.error?.reason ?? "Payment failed");
  });

  rzp.open();
}
