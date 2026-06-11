"use client";

import { useCallback, useMemo, useState } from "react";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { createFeePaymentOrder, verifyFeePayment } from "@/lib/fee-payments-api";
import {
  defaultPayAmount,
  isValidInstallmentAmount,
  validateInstallmentAmount,
} from "@/lib/fee-installments";
import { formatApiError } from "@/lib/format-api-error";
import type { FeePlan } from "@/types/institute";

interface UseFeePaymentOptions {
  plan: FeePlan;
  userName?: string;
  userEmail?: string;
  onSuccess?: (amount: number, receiptNumber: string | null, paymentId: string) => void;
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
  const [payAmount, setPayAmount] = useState(String(defaultPayAmount(plan.pendingAmount)));

  const amountNum = Number(payAmount);
  const validationError = useMemo(
    () =>
      plan.pendingAmount > 0 ? validateInstallmentAmount(plan.pendingAmount, amountNum) : null,
    [plan.pendingAmount, amountNum],
  );
  const canPay = plan.pendingAmount > 0 && isValidInstallmentAmount(plan.pendingAmount, amountNum);

  const startPayment = useCallback(async () => {
    const amount = amountNum;
    const err = validateInstallmentAmount(plan.pendingAmount, amount);
    if (err) {
      onError?.(err);
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
            onSuccess?.(amount, verifyRes.data.receiptNumber, verifyRes.data.payment.id);
          } catch (verifyErr) {
            onError?.(formatApiError(verifyErr, "Payment verification failed"));
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
  }, [amountNum, plan, userName, userEmail, onSuccess, onError]);

  return {
    paying,
    payAmount,
    setPayAmount,
    startPayment,
    validationError,
    canPay,
  };
}
