export type FeeStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";
export type FeePaymentProvider = "RAZORPAY" | "CASH" | "BANK_TRANSFER" | "UPI_MANUAL";
export type FeePaymentStatus =
  | "CREATED"
  | "ATTEMPTED"
  | "AUTHORIZED"
  | "CAPTURED"
  | "FAILED"
  | "REFUNDED"
  | "CANCELLED";
export type PaymentMode = "CASH" | "UPI" | "BANK_TRANSFER" | "CARD" | "OTHER";
export type BatchStatus = "ACTIVE" | "COMPLETED" | "CANCELLED" | "DELETED";
export type AccessType = "ADMIN_ASSIGNED" | "BATCH_ASSIGNED" | "FULL_FEE_PAID" | "TRIAL";
export type SalaryStatus = "PENDING" | "PAID" | "HOLD";
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
  title: string;
  description: string | null;
  currency: string;
  allowPartialPayments: boolean;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate: string | null;
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
  provider?: FeePaymentProvider;
  status?: FeePaymentStatus;
  paymentMode: PaymentMode | null;
  paymentMethod?: string | null;
  receiptNumber?: string | null;
  razorpayPaymentId?: string | null;
  paymentDate: string | null;
  paidAt?: string | null;
  note: string | null;
  recordedByName?: string;
  createdAt: string;
}

export interface FeeAnalytics {
  totalAssigned?: number;
  totalCollected: number;
  totalPending: number;
  overdueAmount?: number;
  overdueStudents: number;
  planCount: number;
}

export interface StudentFeeDashboard {
  totalFee: number;
  paidFee: number;
  pendingFee: number;
  minInstallmentAmount?: number;
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
  assignedCourses?: { id: string; title: string; slug: string }[];
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

export interface TeacherSalary {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  month: number;
  year: number;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  status: SalaryStatus;
  statusLabel?: string;
  paidAt: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherSalaryDashboard {
  currentMonth: TeacherSalary | null;
  history: TeacherSalary[];
}

export interface TeacherSalarySummary {
  month: number;
  year: number;
  totalThisMonth: number;
  paidSalary: number;
  pendingSalary: number;
  holdSalary: number;
  recordCount: number;
}

export type LiveClassStatus = "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
export type MeetingProvider = "ZOOM" | "GOOGLE_MEET" | "CUSTOM";
export type RecordingStatus = "ACTIVE" | "ARCHIVED" | "DELETED";

export interface LiveClassRecordingSummary {
  id: string;
  title: string;
  videoUrl: string;
  status: RecordingStatus;
  uploadedAt: string;
}

export interface LiveClass {
  id: string;
  batchId: string;
  batchName: string;
  batchStatus?: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  teacherId: string;
  teacherName: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  durationMinutes: number;
  duration: number;
  status: LiveClassStatus;
  meetingProvider?: MeetingProvider;
  meetingUrl?: string | null;
  joinUrl?: string | null;
  meetingId?: string | null;
  meetingPassword?: string | null;
  startUrl?: string | null;
  canJoin?: boolean;
  recordingCount?: number;
  recordings?: LiveClassRecordingSummary[];
  createdAt: string;
  updatedAt: string;
  /** @deprecated */
  liveUrl?: string | null;
}

export interface LiveClassJoinInfo {
  liveClassId: string;
  title: string;
  joinUrl: string;
  meetingUrl: string;
  meetingPassword?: string | null;
  meetingProvider?: MeetingProvider;
  startUrl?: string | null;
  meetingId?: string | null;
}

export interface LiveClassRecording {
  id: string;
  liveClassId: string;
  liveClassTitle: string;
  liveClassScheduledAt: string;
  batchId: string;
  batchName: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  teacherId: string;
  teacherName: string;
  title: string;
  description: string | null;
  videoUrl: string;
  videoStorageKey: string | null;
  videoStorageProvider: string | null;
  videoFileName: string | null;
  videoMimeType: string | null;
  videoSize: number | null;
  durationSeconds: number | null;
  status: RecordingStatus;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface LiveClassStats {
  upcoming: number;
  completed: number;
  today: number;
  totalRecordings: number;
}
