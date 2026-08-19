import multer from "multer";
import path from "path";
import fs from "fs";

export const EMR_ROOT = path.join(path.resolve(), "medical-files");

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

const createStorage = (folder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = ensureDir(path.join(EMR_ROOT, folder));
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
    },
  });

const reportFileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|jpeg|jpg|png|webp|gif|doc|docx|txt|xls|xlsx/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype.replace(/^application\/vnd\./, ""));
  if (extname) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only PDF, image, Word, Excel and text files are allowed"
      ),
      false
    );
  }
};

const pdfFileFilter = (req, file, cb) => {
  const extname = path.extname(file.originalname).toLowerCase() === ".pdf";
  const mimetype = file.mimetype === "application/pdf";
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed for prescriptions"), false);
  }
};

const uploadReports = multer({
  storage: createStorage("reports"),
  fileFilter: reportFileFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
});

const uploadPrescriptionPdf = multer({
  storage: createStorage("prescriptions"),
  fileFilter: pdfFileFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
});

export { uploadReports, uploadPrescriptionPdf };
