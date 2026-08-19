import {
  checkSymptoms,
  findDoctors,
  getFAQs,
  getHealthTips,
  chatbotReply,
  buildSuggestion,
  DISCLAIMER,
} from "../services/aiAssistantService.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

const symptomCheck = async (req, res, next) => {
  try {
    const { symptoms } = req.body;

    if (!Array.isArray(symptoms) || symptoms.length === 0) {
      return sendError(res, 400, "Please provide at least one symptom");
    }

    const result = checkSymptoms(symptoms);
    const doctors = await findDoctors(result.specialist);

    return sendSuccess(res, 200, "Symptom check completed", {
      ...result,
      doctors,
      suggestion: buildSuggestion(result),
      disclaimer: DISCLAIMER,
    });
  } catch (error) {
    next(error);
  }
};

const chat = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || !String(message).trim()) {
      return sendError(res, 400, "Please provide a message");
    }

    const reply = await chatbotReply(message);
    return sendSuccess(res, 200, "Assistant reply", reply);
  } catch (error) {
    next(error);
  }
};

const faqs = async (req, res, next) => {
  try {
    const { q } = req.query;
    return sendSuccess(res, 200, "FAQs retrieved", getFAQs(q));
  } catch (error) {
    next(error);
  }
};

const healthTips = async (req, res, next) => {
  try {
    const { category } = req.query;
    return sendSuccess(res, 200, "Health tips retrieved", getHealthTips(category));
  } catch (error) {
    next(error);
  }
};

export { symptomCheck, chat, faqs, healthTips };
