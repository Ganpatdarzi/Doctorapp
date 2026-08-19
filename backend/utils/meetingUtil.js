import crypto from "crypto";

const JITSI_DOMAIN = "meet.jit.si";

const generateMeetingRoom = () => {
  const random = crypto.randomBytes(6).toString("hex");
  return `dah-video-${Date.now().toString(36)}-${random}`;
};

export { JITSI_DOMAIN, generateMeetingRoom };
