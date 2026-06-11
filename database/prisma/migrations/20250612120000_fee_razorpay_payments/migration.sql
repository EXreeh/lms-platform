-- Fee payment enums
CREATE TYPE "FeePaymentProvider" AS ENUM ('RAZORPAY', 'CASH', 'BANK_TRANSFER', 'UPI_MANUAL');
CREATE TYPE "FeePaymentStatus" AS ENUM ('CREATED', 'ATTEMPTED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- FeeStatus: add CANCELLED
ALTER TYPE "FeeStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';

-- FeePlan extensions
ALTER TABLE "fee_plans" ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT 'Institute Fee';
ALTER TABLE "fee_plans" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "fee_plans" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'INR';
ALTER TABLE "fee_plans" ADD COLUMN IF NOT EXISTS "allow_partial_payments" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "fee_plans" ADD COLUMN IF NOT EXISTS "created_by_id" TEXT;
ALTER TABLE "fee_plans" ALTER COLUMN "due_date" DROP NOT NULL;

ALTER TABLE "fee_plans"
  ADD CONSTRAINT "fee_plans_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- FeePayment restructure
ALTER TABLE "fee_payments" ADD COLUMN IF NOT EXISTS "student_id" TEXT;
ALTER TABLE "fee_payments" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'INR';
ALTER TABLE "fee_payments" ADD COLUMN IF NOT EXISTS "provider" "FeePaymentProvider" NOT NULL DEFAULT 'CASH';
ALTER TABLE "fee_payments" ADD COLUMN IF NOT EXISTS "status" "FeePaymentStatus" NOT NULL DEFAULT 'CAPTURED';
ALTER TABLE "fee_payments" ADD COLUMN IF NOT EXISTS "razorpay_order_id" TEXT;
ALTER TABLE "fee_payments" ADD COLUMN IF NOT EXISTS "razorpay_payment_id" TEXT;
ALTER TABLE "fee_payments" ADD COLUMN IF NOT EXISTS "razorpay_signature" TEXT;
ALTER TABLE "fee_payments" ADD COLUMN IF NOT EXISTS "payment_method" TEXT;
ALTER TABLE "fee_payments" ADD COLUMN IF NOT EXISTS "receipt_number" TEXT;
ALTER TABLE "fee_payments" ADD COLUMN IF NOT EXISTS "paid_at" TIMESTAMP(3);
ALTER TABLE "fee_payments" ADD COLUMN IF NOT EXISTS "failure_reason" TEXT;
ALTER TABLE "fee_payments" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
ALTER TABLE "fee_payments" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill student_id and paid_at from existing rows
UPDATE "fee_payments" fp
SET
  "student_id" = p."student_id",
  "paid_at" = COALESCE(fp."paid_at", fp."payment_date"),
  "provider" = CASE fp."payment_mode"::text
    WHEN 'CASH' THEN 'CASH'::"FeePaymentProvider"
    WHEN 'UPI' THEN 'UPI_MANUAL'::"FeePaymentProvider"
    WHEN 'BANK_TRANSFER' THEN 'BANK_TRANSFER'::"FeePaymentProvider"
    WHEN 'CARD' THEN 'RAZORPAY'::"FeePaymentProvider"
    ELSE 'CASH'::"FeePaymentProvider"
  END,
  "status" = 'CAPTURED'::"FeePaymentStatus"
FROM "fee_plans" p
WHERE fp."fee_plan_id" = p."id" AND fp."student_id" IS NULL;

ALTER TABLE "fee_payments" ALTER COLUMN "student_id" SET NOT NULL;
ALTER TABLE "fee_payments" ALTER COLUMN "payment_mode" DROP NOT NULL;
ALTER TABLE "fee_payments" ALTER COLUMN "payment_date" DROP NOT NULL;
ALTER TABLE "fee_payments" ALTER COLUMN "recorded_by_id" DROP NOT NULL;

ALTER TABLE "fee_payments"
  ADD CONSTRAINT "fee_payments_student_id_fkey"
  FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "fee_payments_razorpay_order_id_key" ON "fee_payments"("razorpay_order_id");
CREATE UNIQUE INDEX IF NOT EXISTS "fee_payments_razorpay_payment_id_key" ON "fee_payments"("razorpay_payment_id");
CREATE UNIQUE INDEX IF NOT EXISTS "fee_payments_receipt_number_key" ON "fee_payments"("receipt_number");
CREATE INDEX IF NOT EXISTS "fee_payments_student_id_status_idx" ON "fee_payments"("student_id", "status");
CREATE INDEX IF NOT EXISTS "fee_payments_status_created_at_idx" ON "fee_payments"("status", "created_at");

-- PaymentAttempt table
CREATE TABLE IF NOT EXISTS "payment_attempts" (
  "id" TEXT NOT NULL,
  "fee_plan_id" TEXT NOT NULL,
  "student_id" TEXT NOT NULL,
  "provider" "FeePaymentProvider" NOT NULL DEFAULT 'RAZORPAY',
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "status" "FeePaymentStatus" NOT NULL DEFAULT 'CREATED',
  "razorpay_order_id" TEXT NOT NULL,
  "razorpay_payment_id" TEXT,
  "error_code" TEXT,
  "error_description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "payment_attempts_razorpay_order_id_key" ON "payment_attempts"("razorpay_order_id");
CREATE UNIQUE INDEX IF NOT EXISTS "payment_attempts_razorpay_payment_id_key" ON "payment_attempts"("razorpay_payment_id");
CREATE INDEX IF NOT EXISTS "payment_attempts_fee_plan_id_created_at_idx" ON "payment_attempts"("fee_plan_id", "created_at");
CREATE INDEX IF NOT EXISTS "payment_attempts_student_id_status_idx" ON "payment_attempts"("student_id", "status");

ALTER TABLE "payment_attempts"
  ADD CONSTRAINT "payment_attempts_fee_plan_id_fkey"
  FOREIGN KEY ("fee_plan_id") REFERENCES "fee_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payment_attempts"
  ADD CONSTRAINT "payment_attempts_student_id_fkey"
  FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
