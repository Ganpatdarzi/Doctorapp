import mongoose from "mongoose";
import Review from "../models/Review.js";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

const recomputeDoctorRating = async (doctorId) => {
  const [result] = await Review.aggregate([
    { $match: { doctorId: new mongoose.Types.ObjectId(doctorId) } },
    {
      $group: {
        _id: null,
        avg: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const rating = result ? Math.round(result.avg * 10) / 10 : 0;
  const count = result ? result.count : 0;

  await Doctor.findByIdAndUpdate(doctorId, { rating, reviews: count });
  return { rating, count };
};

const hasCompletedAppointment = async (userId, doctorId) => {
  const appointment = await Appointment.findOne({
    userId,
    doctorId,
    status: "completed",
  });
  return Boolean(appointment);
};

const createReview = async (req, res, next) => {
  try {
    const { doctorId, rating, comment, appointmentId } = req.body;

    if (!doctorId) {
      return sendError(res, 400, "Doctor ID is required");
    }

    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return sendError(res, 400, "Rating must be between 1 and 5");
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return sendError(res, 404, "Doctor not found");
    }

    if (!(await hasCompletedAppointment(req.user._id, doctorId))) {
      return sendError(
        res,
        403,
        "You can only review a doctor after a completed appointment"
      );
    }

    const update = {
      doctorId,
      userId: req.user._id,
      rating: ratingNum,
      comment: (comment || "").trim().slice(0, 1000),
    };
    if (appointmentId) update.appointmentId = appointmentId;

    const review = await Review.findOneAndUpdate(
      { doctorId, userId: req.user._id },
      update,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).populate("userId", "name image");

    await recomputeDoctorRating(doctorId);

    return sendSuccess(res, 200, "Review submitted successfully", review);
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return sendError(res, 404, "Review not found");
    }

    if (review.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 403, "Not authorized to delete this review");
    }

    const doctorId = review.doctorId;
    await review.deleteOne();
    await recomputeDoctorRating(doctorId);

    return sendSuccess(res, 200, "Review deleted successfully");
  } catch (error) {
    next(error);
  }
};

const getDoctorReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const doctorId = req.params.doctorId;
    const total = await Review.countDocuments({ doctorId });

    const reviews = await Review.find({ doctorId })
      .populate("userId", "name image")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const summary = await Review.aggregate([
      { $match: { doctorId: new mongoose.Types.ObjectId(doctorId) } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);

    return sendSuccess(res, 200, "Reviews retrieved", {
      reviews,
      summary: summary[0]
        ? {
            average: Math.round(summary[0].avg * 10) / 10,
            count: summary[0].count,
          }
        : { average: 0, count: 0 },
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getMyReviewForDoctor = async (req, res, next) => {
  try {
    const doctorId = req.params.doctorId;
    const [review, canReview] = await Promise.all([
      Review.findOne({ doctorId, userId: req.user._id }).populate(
        "userId",
        "name image"
      ),
      hasCompletedAppointment(req.user._id, doctorId),
    ]);

    return sendSuccess(res, 200, "Review status retrieved", {
      review,
      canReview,
    });
  } catch (error) {
    next(error);
  }
};

export { createReview, deleteReview, getDoctorReviews, getMyReviewForDoctor };
