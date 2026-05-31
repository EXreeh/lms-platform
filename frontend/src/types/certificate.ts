export interface Certificate {
  id: string;
  studentId: string;
  courseId: string;
  certificateNumber: string;
  verificationCode: string;
  issuedAt: string;
  pdfUrl: string | null;
  student: { id: string; name: string; email: string };
  course: { id: string; title: string; slug: string; category: string; level: string };
}

export interface CertificateEligibility {
  eligible: boolean;
  totalLessons: number;
  completedLessons: number;
  totalQuizzes: number;
  passedQuizzes: number;
  lessonsComplete: boolean;
  quizzesPassed: boolean;
  alreadyIssued: boolean;
  certificateId?: string;
  reasons: string[];
}

export interface CertificateVerification {
  valid: boolean;
  message?: string;
  certificate?: Certificate;
}
