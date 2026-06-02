"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { createPaymentOrder, verifyPayment } from "@/lib/payments-api";
import { openRazorpayCheckout } from "@/lib/razorpay";
import { formatApiError } from "@/lib/format-api-error";
import { isFreeCourse } from "@/types/course";
import { enrollInCourse } from "@/lib/courses-api";
import { ApiClientError } from "@/lib/api";

interface UseCoursePurchaseOptions {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  price: number;
  userName?: string;
  userEmail?: string;
  onFreeEnrollSuccess?: () => void;
  onPaidSuccess?: (courseSlug: string) => void;
  toastSuccess: (msg: string) => void;
  toastError: (msg: string) => void;
}

export function useCoursePurchase({
  courseId,
  courseSlug,
  courseTitle,
  price,
  userName,
  userEmail,
  onFreeEnrollSuccess,
  onPaidSuccess,
  toastSuccess,
  toastError,
}: UseCoursePurchaseOptions) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFreeEnroll = useCallback(async () => {
    setIsProcessing(true);
    try {
      await enrollInCourse(courseSlug);
      toastSuccess("Enrolled successfully!");
      onFreeEnrollSuccess?.();
      router.push(`/courses/${courseSlug}/learn`);
    } catch (err) {
      if (err instanceof ApiClientError && err.code === "ALREADY_ENROLLED") {
        toastSuccess("You are already enrolled in this course.");
        router.push(`/courses/${courseSlug}/learn`);
        return;
      }
      toastError(formatApiError(err, "Enrollment failed"));
    } finally {
      setIsProcessing(false);
    }
  }, [courseSlug, onFreeEnrollSuccess, router, toastError, toastSuccess]);

  const handlePurchase = useCallback(async () => {
    if (isFreeCourse(price)) {
      await handleFreeEnroll();
      return;
    }

    setIsProcessing(true);
    try {
      const orderRes = await createPaymentOrder(courseId);
      const { keyId, orderId, amount, currency } = orderRes.data;

      setIsProcessing(false);

      await openRazorpayCheckout({
        keyId,
        orderId,
        amount,
        currency,
        courseTitle,
        userName,
        userEmail,
        onSuccess: async (response) => {
          setIsProcessing(true);
          try {
            const verifyRes = await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toastSuccess("Payment successful! You're enrolled.");
            const slug = verifyRes.data.courseSlug || courseSlug;
            onPaidSuccess?.(slug);
            router.push(`/payment/success?course=${slug}`);
          } catch (err) {
            toastError(formatApiError(err, "Payment verification failed"));
            router.push(`/payment/failed?course=${courseSlug}`);
          } finally {
            setIsProcessing(false);
          }
        },
        onDismiss: () => {
          toastError("Payment cancelled");
        },
        onFailure: (message) => {
          toastError(message);
          router.push(`/payment/failed?course=${courseSlug}`);
        },
      });
    } catch (err) {
      toastError(formatApiError(err, "Could not start checkout"));
      setIsProcessing(false);
    }
  }, [
    courseId,
    courseSlug,
    courseTitle,
    handleFreeEnroll,
    onPaidSuccess,
    price,
    router,
    toastError,
    toastSuccess,
    userEmail,
    userName,
  ]);

  return { isProcessing, handlePurchase, handleFreeEnroll };
}
