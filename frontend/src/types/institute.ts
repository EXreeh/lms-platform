export type FeeStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE";
export type PaymentMode = "CASH" | "UPI" | "BANK_TRANSFER" | "CARD" | "OTHER";
export type BatchStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
export type MessageType =
  | "GENERAL"
  | "FEE_REMINDER"
  | "CLASS_UPDATE"
  | "ASSIGNMENT"
  | "ANNOUNCEMENT";

export interface FeePlan {
  id: string;
  studentId: string;
  courseId: string | null;
  batchId: string | null;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate: string;
  status: FeeStatus;
  accessGranted: boolean;
  lifetimeAccess: boolean;
  accessLabel: string;
  createdAt: string;
  updatedAt: string;
  student?: { id: string; name: string; email: string };
  course?: { id: string; title: string; slug: string } | null;
  batch?: { id: string; name: string } | null;
  payments?: FeePayment[];
}

export interface FeePayment {
  id: string;
  amount: number;
  paymentMode: PaymentMode;
  paymentDate: string;
  note: string | null;
  recordedByName?: string;
  createdAt: string;
}

export interface FeeAnalytics {
  totalCollected: number;
  totalPending: number;
  overdueStudents: number;
  planCount: number;
}

export interface StudentFeeDashboard {
  totalFee: number;
  paidFee: number;
  pendingFee: number;
  plans: FeePlan[];
  reminders: {
    id: string;
    feePlanId: string;
    message: string;
    reminderDate: string;
    status: string;
  }[];
}

export interface Batch {
  id: string;
  name: string;
  description: string | null;
  courseId: string | null;
  teacherId: string | null;
  startDate: string;
  endDate: string | null;
  timing: string | null;
  daysOfWeek: string | null;
  status: BatchStatus;
  createdAt: string;
  updatedAt: string;
  course?: { id: string; title: string; slug: string } | null;
  teacher?: { id: string; name: string; email: string } | null;
  studentCount: number;
  liveClassCount?: number;
  students: {
    id: string;
    studentId: string;
    joinedAt: string;
    name: string;
    email: string;
    accessStatus?: string;
  }[];
}

export interface MessageItem {
  id: string;
  subject: string;
  content: string;
  type: MessageType;
  batchId: string | null;
  batchName?: string;
  feePlanId?: string | null;
  createdAt: string;
  readAt: string | null;
  isRead: boolean;
  sender: { id: string; name: string; email: string; role: string };
  recipientCount: number;
  recipients?: { id: string; name: string; email: string; role: string; readAt: string | null }[];
}

export interface LiveClass {
  id: string;
  batchId: string;
  batchName: string;
  teacherId: string;
  teacherName: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  duration: number;
  status: string;
  meetingUrl: string | null;
  createdAt: string;
  joinMessage: string;
}
