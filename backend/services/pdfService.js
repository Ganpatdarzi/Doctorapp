import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { EMR_ROOT } from "../utils/emrUpload.js";

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

const formatShortDate = (value) => {
  if (!value) return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const formatDateTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const computeAge = (dob) => {
  if (!dob) return "";
  const d = new Date(dob);
  if (isNaN(d.getTime())) return "";
  let age = new Date().getFullYear() - d.getFullYear();
  const m = new Date().getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && new Date().getDate() < d.getDate())) age -= 1;
  return age > 0 && age < 130 ? age : "";
};

const generatePrescriptionPdf = ({ record, doctor, patient, appointment }) => {
  const dir = ensureDir(path.join(EMR_ROOT, "prescriptions"));
  const fileName = `rx-${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`;
  const filePath = path.join(dir, fileName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 42 });
    const stream = fs.createWriteStream(filePath);

    stream.on("finish", () => {
      resolve({
        fileName,
        filePath,
        originalName: `prescription-${(patient?.name || "patient").replace(/\s+/g, "-")}.pdf`,
        size: fs.statSync(filePath).size,
      });
    });
    stream.on("error", reject);
    doc.pipe(stream);

    const pageWidth = doc.page.width - doc.page.margins.left * 2;

    const drawHeader = () => {
      doc.rect(0, 0, doc.page.width, 92).fill("#e8f4f8");
      doc.fillColor("#0077b6").font("Helvetica-Bold").fontSize(22).text("DocBook", 42, 28);
      doc.fillColor("#0077b6").font("Helvetica").fontSize(11).text("Medical Prescription", 42, 58);
      doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(12).text(
        "PRESCRIPTION",
        doc.page.width - 42,
        28,
        { align: "right", width: pageWidth - 100 }
      );
      doc.fillColor("#888").font("Helvetica").fontSize(9).text(
        formatShortDate(record.visitDate || appointment?.date),
        doc.page.width - 42,
        48,
        { align: "right", width: pageWidth - 100 }
      );
    };

    const drawSectionTitle = (y, text) => {
      doc.fillColor("#0077b6").font("Helvetica-Bold").fontSize(11).text(text, 42, y);
      return y + 18;
    };

    drawHeader();

    let y = 116;

    doc.fillColor("#1a1a2e").font("Helvetica-Bold").fontSize(13).text("Doctor", 42, y);
    y += 18;
    doc.fillColor("#333").font("Helvetica").fontSize(10).text(`Dr. ${doctor?.name || ""}`, 42, y);
    if (doctor?.specialization) doc.text(`Specialization: ${doctor.specialization}`, 42, y + 14);
    if (doctor?.hospital) doc.text(`Hospital: ${doctor.hospital}`, 42, y + 28);
    if (doctor?.location) doc.text(`Location: ${doctor.location}`, 42, y + 42);
    if (doctor?.phone) doc.text(`Phone: ${doctor.phone}`, 42, y + 56);

    y += 86;

    doc.fillColor("#1a1a2e").font("Helvetica-Bold").fontSize(13).text("Patient", 42, y);
    y += 18;
    doc.fillColor("#333").font("Helvetica").fontSize(10).text(`${patient?.name || ""}`, 42, y);
    const patientAge = computeAge(patient?.dob);
    if (patientAge) doc.text(`Age: ${patientAge}`, 42, y + 14);
    if (patient?.dob) doc.text(`DOB: ${formatShortDate(patient.dob)}`, 42, patientAge ? y + 28 : y + 14);
    if (patient?.gender) doc.text(`Gender: ${patient.gender}`, 42, patientAge || patient?.dob ? y + 42 : y + 14);
    if (patient?.phone) doc.text(`Phone: ${patient.phone}`, 42, y + 56);

    y += 70;

    doc.rect(42, y, pageWidth, 1).fill("#e2e8f0");
    y += 16;

    y = drawSectionTitle(y, "Diagnosis");
    doc.fillColor("#333").font("Helvetica").fontSize(10).text(record.diagnosis || "Not specified", 42, y, {
      width: pageWidth,
      lineBreak: true,
    });

    y += Math.max(26, doc.heightOfString(record.diagnosis || "Not specified", { width: pageWidth }) + 12);

    y = drawSectionTitle(y, "Medications");
    const medicines = record.prescriptions || [];
    if (medicines.length === 0) {
      doc.fillColor("#888").font("Helvetica").fontSize(10).text("No medications prescribed.", 42, y);
      y += 24;
    } else {
      const startY = y;
      const colWidths = { medicine: 150, dosage: 90, frequency: 110, duration: 90, instructions: pageWidth - 150 - 90 - 110 - 90 };
      const cols = [
        { key: "medicine", label: "Medicine", w: colWidths.medicine },
        { key: "dosage", label: "Dosage", w: colWidths.dosage },
        { key: "frequency", label: "Frequency", w: colWidths.frequency },
        { key: "duration", label: "Duration", w: colWidths.duration },
        { key: "instructions", label: "Instructions", w: colWidths.instructions },
      ];

      let x = 42;
      doc.rect(42, y - 4, pageWidth, 22).fill("#f1f5f9");
      doc.fillColor("#0f172a").font("Helvetica-Bold").fontSize(9);
      cols.forEach((c) => {
        doc.text(c.label, x, y, { width: c.w });
        x += c.w;
      });
      y += 22;

      medicines.forEach((m, idx) => {
        x = 42;
        if (y > doc.page.height - 80) {
          doc.addPage();
          y = 42;
        }
        doc.fillColor("#444").font("Helvetica").fontSize(9);
        cols.forEach((c) => {
          doc.text(m[c.key] || "-", x, y, { width: c.w });
          x += c.w;
        });
        y += Math.max(16, doc.heightOfString(m.medicine || "-", { width: colWidths.medicine }) + 6);
        if (idx !== medicines.length - 1) {
          doc.rect(42, y - 5, pageWidth, 0.6).fill("#f1f5f9");
        }
      });

      y += 10;
      void startY;
    }

    if (record.treatmentPlan) {
      y += 10;
      if (y > doc.page.height - 120) {
        doc.addPage();
        y = 42;
      }
      y = drawSectionTitle(y, "Treatment Plan");
      doc.fillColor("#333").font("Helvetica").fontSize(10).text(record.treatmentPlan, 42, y, {
        width: pageWidth,
        lineBreak: true,
      });
      y += Math.max(26, doc.heightOfString(record.treatmentPlan, { width: pageWidth }) + 12);
    }

    if (record.followUpNotes && record.followUpNotes.length > 0) {
      if (y > doc.page.height - 140) {
        doc.addPage();
        y = 42;
      }
      y += 8;
      y = drawSectionTitle(y, "Follow-up Notes");
      doc.fillColor("#555").font("Helvetica").fontSize(9);
      record.followUpNotes.forEach((note) => {
        if (y > doc.page.height - 60) {
          doc.addPage();
          y = 42;
        }
        doc.text(`- ${note.text}${note.createdAt ? `  (${formatDateTime(note.createdAt)})` : ""}`, 42, y, {
          width: pageWidth,
          lineBreak: true,
        });
        y += Math.max(16, doc.heightOfString(note.text, { width: pageWidth }) + 6);
      });
    }

    doc.rect(42, doc.page.height - 60, pageWidth, 0.6).fill("#e2e8f0");
    doc.fillColor("#888").font("Helvetica").fontSize(8).text(
      `Generated by DocBook on ${formatShortDate(new Date())}. This prescription is issued by ${doctor?.name || "the doctor"}.`,
      42,
      doc.page.height - 50,
      { width: pageWidth }
    );

    doc.end();
  });
};

export { generatePrescriptionPdf };
