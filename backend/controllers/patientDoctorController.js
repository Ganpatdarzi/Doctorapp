import Doctor from "../models/Doctor.js";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

const getStats = async (req, res, next) => {
  try {
    const [totalDoctors, totalSpecializations, totalPatients, totalAppointments] =
      await Promise.all([
        Doctor.countDocuments({ isAvailable: true }),
        Doctor.distinct("specialization", { isAvailable: true }),
        User.countDocuments({ role: "user" }),
        Appointment.countDocuments(),
      ]);

    return sendSuccess(res, 200, "Statistics retrieved successfully", {
      totalDoctors,
      totalSpecializations: totalSpecializations.length,
      totalPatients,
      totalAppointments,
    });
  } catch (error) {
    next(error);
  }
};


const getAllDoctors = async (req, res, next) => {
  try {
    const {
      search,
      specialization,
      fee,
      experience,
      availability,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    let query = { isAvailable: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { specialization: { $regex: search, $options: "i" } },
      ];
    }

    if (specialization) {
      query.specialization = specialization;
    }

    if (fee) {
      const maxFee = Number(fee);
      query.fees = { $lte: maxFee };
    }

    if (experience) {
      const minExp = Number(experience);
      query.experience = { $gte: minExp };
    }

    if (availability) {
      query.availableDays = { $in: [availability] };
    }

    let sortOption = { createdAt: -1 };
    if (sort === "name") sortOption = { name: 1 };
    if (sort === "name-desc") sortOption = { name: -1 };
    if (sort === "experience") sortOption = { experience: -1 };
    if (sort === "experience-asc") sortOption = { experience: 1 };
    if (sort === "fees") sortOption = { fees: 1 };
    if (sort === "fees-desc") sortOption = { fees: -1 };
    if (sort === "rating") sortOption = { rating: -1 };

    const skip = (Number(page) - 1) * Number(limit);

    const [doctors, total] = await Promise.all([
      Doctor.find(query)
        .select("-password")
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      Doctor.countDocuments(query),
    ]);

    return sendSuccess(res, 200, "Doctors retrieved successfully", {
      doctors,
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

const getDoctorById = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select("-password");

    if (!doctor) {
      return sendError(res, 404, "Doctor not found");
    }

    return sendSuccess(res, 200, "Doctor retrieved successfully", doctor);
  } catch (error) {
    next(error);
  }
};

const getSpecializations = async (req, res, next) => {
  try {
    const specializations = await Doctor.distinct("specialization", {
      isAvailable: true,
    });
    return sendSuccess(res, 200, "Specializations retrieved", specializations);
  } catch (error) {
    next(error);
  }
};

export { getAllDoctors, getDoctorById, getSpecializations, getStats };
