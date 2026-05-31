import PDFDocument from "pdfkit";
import type { CertificateWithRelations } from "./certificates.helpers.js";

export function buildCertificatePdf(cert: CertificateWithRelations): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 50 });

  const w = doc.page.width;
  const h = doc.page.height;

  // Border
  doc.rect(30, 30, w - 60, h - 60).lineWidth(2).strokeColor("#166534").stroke();
  doc.rect(38, 38, w - 76, h - 76).lineWidth(0.5).strokeColor("#ca8a04").stroke();

  // Header
  doc.fontSize(14).fillColor("#166534").text("COGNITIAX AI", 0, 55, { align: "center" });
  doc.fontSize(10).fillColor("#666").text("Learning Management Platform", 0, 72, { align: "center" });

  doc.moveDown(2);
  doc.fontSize(28).fillColor("#1a1a1a").text("Certificate of Completion", 0, 120, {
    align: "center",
  });

  doc.fontSize(12).fillColor("#555").text("This certifies that", 0, 175, { align: "center" });

  const studentName = `${cert.student.firstName} ${cert.student.lastName}`.trim();
  doc.fontSize(26).fillColor("#166534").text(studentName, 0, 200, { align: "center" });

  doc.fontSize(12).fillColor("#555").text("has successfully completed", 0, 245, { align: "center" });

  doc.fontSize(20).fillColor("#1a1a1a").text(cert.course.title, 0, 270, { align: "center" });

  doc.fontSize(10).fillColor("#777").text(
    `${cert.course.category} · ${cert.course.level}`,
    0,
    300,
    { align: "center" },
  );

  doc.fontSize(10).fillColor("#555").text(
    `Issued ${cert.issuedAt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    0,
    h - 120,
    { align: "center" },
  );

  doc.fontSize(9).fillColor("#888").text(`Certificate No: ${cert.certificateNumber}`, 60, h - 85);
  doc.text(`Verify: ${cert.verificationCode}`, w - 220, h - 85);

  doc.end();
  return doc;
}
