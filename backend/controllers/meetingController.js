import Appointment from "../models/Appointment.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { JITSI_DOMAIN } from "../utils/meetingUtil.js";

const getId = (doc) => doc?._id?.toString() || doc?.toString();

const canAccessMeeting = (appointment, req) => {
  if (req.userRole === "admin") return true;
  if (req.userRole === "doctor") {
    return getId(appointment.doctorId) === req.user._id.toString();
  }
  if (req.userRole === "user") {
    return getId(appointment.userId) === req.user._id.toString();
  }
  return false;
};

const getMeeting = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate("doctorId", "name specialization image")
      .populate("userId", "name email image");

    if (!appointment) {
      return sendError(res, 404, "Appointment not found");
    }
    if (!canAccessMeeting(appointment, req)) {
      return sendError(res, 403, "Not authorized to join this meeting");
    }
    if (appointment.meetingType !== "video") {
      return sendError(res, 400, "This appointment is not a video consultation");
    }
    if (!appointment.meetingRoom) {
      return sendError(res, 400, "The meeting has not been created yet");
    }

    return sendSuccess(res, 200, "Meeting retrieved", {
      appointment,
      meeting: {
        provider: appointment.meetingProvider || "jitsi",
        room: appointment.meetingRoom,
        domain: JITSI_DOMAIN,
      },
    });
  } catch (error) {
    next(error);
  }
};

const recordMeetingEvent = async (req, res, next) => {
  try {
    const { event, joinedAt } = req.body;

    if (!["join", "leave"].includes(event)) {
      return sendError(res, 400, "Event must be 'join' or 'leave'");
    }

    const appointment = await Appointment.findById(req.params.appointmentId);
    if (!appointment) {
      return sendError(res, 404, "Appointment not found");
    }
    if (!canAccessMeeting(appointment, req)) {
      return sendError(res, 403, "Not authorized to record this meeting");
    }
    if (appointment.meetingType !== "video") {
      return sendError(res, 400, "This appointment is not a video consultation");
    }

    const role = req.userRole === "doctor" ? "doctor" : "patient";

    if (event === "join") {
      appointment.meetingHistory.push({
        role,
        joinedAt: joinedAt ? new Date(joinedAt) : new Date(),
        leftAt: null,
        duration: 0,
      });
    } else {
      const lastOpen = appointment.meetingHistory
        .slice()
        .reverse()
        .find((h) => h.role === role && !h.leftAt);
      if (lastOpen) {
        lastOpen.leftAt = new Date();
        lastOpen.duration = Math.max(
          0,
          Math.round((lastOpen.leftAt - lastOpen.joinedAt) / 1000)
        );
      }
    }

    await appointment.save();

    return sendSuccess(res, 200, "Meeting event recorded", appointment.meetingHistory);
  } catch (error) {
    next(error);
  }
};

export { getMeeting, recordMeetingEvent };
