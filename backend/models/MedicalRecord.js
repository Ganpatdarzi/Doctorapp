import mongoose from "mongoose";

const prescriptionItemSchema = new mongoose.Schema(
  {
    medicine: {
      type: String,
      required: [true, "Medicine name is required"],
      trim: true,
    },
    dosage: {
      type: String,
      default: "",
      trim: true,
    },
    frequency: {
      type: String,
      default: "",
      trim: true,
    },
    duration: {
      type: String,
      default: "",
      trim: true,
    },
    instructions: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: true }
);

const reportSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      default: "",
    },
    size: {
      type: Number,
      default: 0,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const followUpNoteSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, "Note is required"],
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const medicalRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Patient is required"],
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "Doctor is required"],
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },
    visitDate: {
      type: String,
      default: "",
    },
    diagnosis: {
      type: String,
      default: "",
      trim: true,
    },
    treatmentPlan: {
      type: String,
      default: "",
      trim: true,
    },
    prescriptions: {
      type: [prescriptionItemSchema],
      default: [],
    },
    prescriptionPdf: {
      type: {
        fileName: { type: String, default: "" },
        originalName: { type: String, default: "" },
        size: { type: Number, default: 0 },
      },
      default: null,
    },
    reports: {
      type: [reportSchema],
      default: [],
    },
    followUpNotes: {
      type: [followUpNoteSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

medicalRecordSchema.index({ userId: 1, createdAt: -1 });
medicalRecordSchema.index({ doctorId: 1, createdAt: -1 });
medicalRecordSchema.index({ appointmentId: 1 });
medicalRecordSchema.index({ doctorId: 1, userId: 1 });

const MedicalRecord = mongoose.model("MedicalRecord", medicalRecordSchema);

export default MedicalRecord;
