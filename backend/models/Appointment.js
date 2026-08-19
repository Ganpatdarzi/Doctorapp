import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
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
    date: {
      type: String,
      required: [true, "Appointment date is required"],
    },
    timeSlot: {
      type: String,
      required: [true, "Time slot is required"],
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled", "rejected"],
      default: "pending",
    },
    consultationFee: {
      type: Number,
      default: 0,
    },
    cancellationReason: {
      type: String,
      default: "",
    },
    doctorNotes: {
      type: String,
      default: "",
    },
    patientNotes: {
      type: String,
      default: "",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded", "free", "failed"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["online", "clinic"],
      default: "clinic",
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },
    meetingType: {
      type: String,
      enum: ["clinic", "video"],
      default: "clinic",
    },
    meetingProvider: {
      type: String,
      enum: ["jitsi"],
      default: "jitsi",
    },
    meetingRoom: {
      type: String,
      default: "",
    },
    meetingHistory: [
      {
        role: {
          type: String,
          enum: ["patient", "doctor"],
        },
        joinedAt: {
          type: Date,
          default: null,
        },
        leftAt: {
          type: Date,
          default: null,
        },
        duration: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

appointmentSchema.index({ doctorId: 1, date: 1, timeSlot: 1 });
appointmentSchema.index({ userId: 1, createdAt: -1 });
appointmentSchema.index({ userId: 1, status: 1, createdAt: -1 });
appointmentSchema.index({ date: 1 });
appointmentSchema.index({ status: 1, date: 1 });

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
