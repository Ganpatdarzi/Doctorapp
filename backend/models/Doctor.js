import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Doctor name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    image: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    gender: {
      type: String,
      default: "",
      enum: ["", "Male", "Female", "Other"],
    },
    dob: {
      type: String,
      default: "",
    },
    specialization: {
      type: String,
      required: [true, "Specialization is required"],
      trim: true,
    },
    education: {
      type: String,
      default: "",
    },
    experience: {
      type: Number,
      required: [true, "Experience is required"],
      min: 0,
    },
    fees: {
      type: Number,
      required: [true, "Consultation fee is required"],
      min: 0,
    },
    location: {
      type: String,
      default: "",
    },
    hospital: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    about: {
      type: String,
      default: "",
    },
    languages: {
      type: [String],
      default: [],
    },
    availableDays: {
      type: [String],
      default: [],
    },
    availableSlots: {
      type: [String],
      default: [],
    },
    workingHours: {
      type: {
        start: { type: String, default: "09:00" },
        end: { type: String, default: "17:00" },
      },
      default: { start: "09:00", end: "17:00" },
    },
    breakTimings: {
      type: [{ start: String, end: String }],
      default: [],
    },
    blockedDates: {
      type: [String],
      default: [],
    },
    appointmentDuration: {
      type: Number,
      default: 30,
      min: 5,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: {
      type: Number,
      default: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

doctorSchema.index({ specialization: 1 });
doctorSchema.index({ isAvailable: 1, specialization: 1 });
doctorSchema.index({ name: "text", specialization: "text" });

const Doctor = mongoose.model("Doctor", doctorSchema);

export default Doctor;
