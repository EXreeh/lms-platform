"use client";

import { useCallback, useState } from "react";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { createFeePaymentOrder, verifyFeePayment } from "@/lib/fee-payments-api";
import { formatApiError } from "@/lib/format-api-error";
import type { FeePlan } from "@/types/institute";

interface UseFeePaymentOptions {
  plan: FeePlan;
  userName?: string;
  userEmail?: string;
  onSuccess?: (receiptNumber: string | null, paymentId: string) => void;
  onError?: (message: string) => void;
}

export function useFeePayment({
  plan,
  userName,
  userEmail,
  onSuccess,
  onError,
}: UseFeePaymentOptions) {
  const [paying, setPaying] = useState(false);
  const [payAmount, setPayAmount] = useState(
    plan.allowPartialPayments ? String(plan.pendingAmount) : String(plan.pendingAmount),
  );

  const startPayment = useCallback(async () => {
    const amount = plan.allowPartialPayments ? Number(payAmount) : plan.pendingAmount;
    if (!Number.isFinite(amount) || amount <= 0) {
      onError?.("Enter a valid payment amount");
      return;
    }
    if (amount > plan.pendingAmount) {
      onError?.("Amount exceeds pending balance");
      return;
    }

    setPaying(true);
    try {
      const orderRes = await createFeePaymentOrder(plan.id, amount);
      const order = orderRes.data;

      await openRazorpayCheckout({
        keyId: order.razorpayKeyId,
        orderId: order.orderId,
        amount: order.amount,
        currency: order.currency,
        description: order.feeTitle,
        userName: userName ?? order.student.name,
        userEmail: userEmail ?? order.student.email,
        onSuccess: async (response) => {
          try {
            const verifyRes = await verifyFeePayment({
              feePlanId: plan.id,
              amount,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            onSuccess?.(verifyRes.data.receiptNumber, verifyRes.data.payment.id);
          } catch (err) {
            onError?.(formatApiError(err, "Payment verification failed"));
          } finally {
            setPaying(false);
          }
        },
        onDismiss: () => setPaying(false),
        onFailure: (message) => {
          setPaying(false);
          onError?.(message);
        },
      });
    } catch (err) {
      setPaying(false);
      onError?.(formatApiError(err, "Could not start payment"));
    }
  }, [payAmount, plan, userName, userEmail, onSuccess, onError]);

  return { paying, payAmount, setPayAmount, startPayment };
}
