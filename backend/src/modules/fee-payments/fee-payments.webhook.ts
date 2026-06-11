import type { Request, Response } from "express";
import crypto from "node:crypto";
import { env } from "../../config/env.js";
import { processRazorpayWebhook } from "./fee-payments.service.js";

export async function razorpayWebhookHandler(req: Request, res: Response): Promise<void> {
  const signature = req.headers["x-razorpay-signature"];
  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    res.status(503).json({ success: false, message: "Webhook not configured" });
    return;
  }
  if (typeof signature !== "string") {
    res.status(400).json({ success: false, message: "Missing signature" });
    return;
  }

  const rawBody = req.body as Buffer;
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  if (expected !== signature) {
    res.status(400).json({ success: false, message: "Invalid webhook signature" });
    return;
  }

  try {
    const payload = JSON.parse(rawBody.toString("utf8")) as {
      event: string;
      payload: Parameters<typeof processRazorpayWebhook>[0]["payload"];
    };
    await processRazorpayWebhook(payload);
    res.status(200).json({ success: true });
  } catch {
    res.status(200).json({ success: true });
  }
}
