import jsPDF from "jspdf";
import {
  generateTestResultPDF as originalGeneratePDF,
  generateBulkTestResultsPDF as originalGenerateBulkPDF,
} from "../../../src/lib/pdfGenerator";

interface TestResult {
  studentName: string;
  email: string;
  testTitle: string;
  score: number;
  totalQuestions: number;
  startTime: string;
  endTime: string;
  answers: Record<string, unknown>;
}

export const generateTestResultPDF = originalGeneratePDF;
export const generateBulkTestResultsPDF = originalGenerateBulkPDF;

export const getPDFBlob = (result: TestResult): Blob => {
  const doc = generateTestResultPDF(result);
  return doc.output("blob");
};

/**
 * Mobile-safe file download and sharing handler.
 * In a native WebView, <a download> does not trigger native file saving.
 * This override uses navigator.share / Web Share API with File objects when available,
 * allowing candidates to save to Device Storage, Google Drive, or share via WhatsApp/Email.
 */
export const downloadTestResultPDF = async (result: TestResult) => {
  const doc = generateTestResultPDF(result);
  const fileName = `${result.studentName.replace(/\s+/g, "_")}_${result.testTitle.replace(/\s+/g, "_")}_Result.pdf`;

  try {
    const blob = doc.output("blob");
    const file = new File([blob], fileName, { type: "application/pdf" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "CBT Exam Result Slip",
        text: `Result slip for ${result.studentName} - ${result.testTitle}`,
      });
      return;
    }
  } catch (shareErr) {
    console.info("[PDF Override] Share sheet dismissed or unsupported:", shareErr);
  }

  // Fallback to standard doc.save
  doc.save(fileName);
};

export const downloadBulkTestResultsPDF = async (results: TestResult[]) => {
  const doc = generateBulkTestResultsPDF(results);
  const fileName = `CBT_All_Results_${new Date().toISOString().split("T")[0]}.pdf`;

  try {
    const blob = doc.output("blob");
    const file = new File([blob], fileName, { type: "application/pdf" });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: "CBT Complete Report",
        text: `Complete report with ${results.length} test results`,
      });
      return;
    }
  } catch (shareErr) {
    console.info("[PDF Override] Share sheet dismissed or unsupported:", shareErr);
  }

  // Fallback to standard doc.save
  doc.save(fileName);
};
