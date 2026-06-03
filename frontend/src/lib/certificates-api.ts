import type { Certificate, CertificateEligibility, CertificateVerification } from "@/types/certificate";
import { apiUrl } from "./constants";
import { getAuthToken } from "./auth-storage";
import { apiRequest } from "./api";

export function checkCertificateEligibility(courseId: string) {
  return apiRequest<{ success: boolean; data: CertificateEligibility }>(
    `/certificates/eligibility/${courseId}`,
    { auth: true },
  );
}

export function fetchCertificateByCourse(courseId: string) {
  return apiRequest<{ success: boolean; data: { certificate: Certificate | null } }>(
    `/certificates/course/${courseId}`,
    { auth: true },
  );
}

export function fetchMyCertificates() {
  return apiRequest<{ success: boolean; data: { certificates: Certificate[] } }>(
    "/certificates/mine",
    { auth: true },
  );
}

export function generateCertificate(courseId: string) {
  return apiRequest<{ success: boolean; data: { certificate: Certificate } }>(
    `/certificates/generate/${courseId}`,
    { method: "POST", auth: true },
  );
}

export function verifyCertificate(code: string) {
  return apiRequest<{ success: boolean; data: CertificateVerification }>(
    `/certificates/verify/${encodeURIComponent(code)}`,
  );
}

export async function downloadCertificate(certificateId: string, filename: string) {
  const token = getAuthToken();
  const res = await fetch(apiUrl(`/certificates/${certificateId}/download`), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { message?: string }).message ?? "Download failed");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
