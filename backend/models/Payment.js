import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "PKR",
    },
    paymentMethod: {
      type: String,
      enum: ["online", "clinic"],
      required: true,
    },
    provider: {
      type: String,
      enum: ["stripe", "demo", "clinic"],
      default: "stripe",
    },
    providerPaymentId: {
      type: String,
      default: "",
    },
    checkoutSessionId: {
      type: String,
      default: "",
    },
    receiptUrl: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paidAt: Date,
    amountEdited: {
      previousAmount: Number,
      editedAt: Date,
      editedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reason: { type: String, default: "" },
    },
    refund: {
      refundId: { type: String, default: "" },
      amount: { type: Number, default: 0 },
      reason: { type: String, default: "" },
      status: { type: String, enum: ["", "pending", "succeeded", "failed"], default: "" },
      refundedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ doctorId: 1, createdAt: -1 });
paymentSchema.index({ appointmentId: 1 });
paymentSchema.index({ checkoutSessionId: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
