import Doctor from "../models/Doctor.js";
import { CONDITIONS, FAQs, HEALTH_TIPS } from "../data/healthKnowledge.js";

const STOPWORDS = new Set([
  "what", "how", "why", "when", "where", "who", "can", "do", "does", "i", "you",
  "me", "my", "your", "the", "a", "an", "is", "are", "am", "be", "to", "of",
  "in", "on", "for", "with", "about", "and", "or", "but", "please", "like",
  "want", "would", "should", "could", "tell", "know", "have", "has", "get",
  "give", "show", "find", "need",
]);

const DISCLAIMER =
  "This guidance is for informational purposes only and is not a medical diagnosis. Always consult a qualified doctor.";

const SEVERITY_ORDER = { low: 1, medium: 2, high: 3, urgent: 4 };

const SEVERITY_META = {
  low: {
    label: "Low",
    urgency: "Routine",
    suggestion:
      "This can usually be managed with self-care. Book a routine appointment within the next 1–2 weeks if symptoms persist.",
  },
  medium: {
    label: "Medium",
    urgency: "Soon",
    suggestion:
      "You should book an appointment within the next 3–5 days so the condition does not worsen.",
  },
  high: {
    label: "High",
    urgency: "Urgent",
    suggestion:
      "Please book an appointment as soon as possible (within 24–48 hours) for proper evaluation.",
  },
  urgent: {
    label: "Urgent",
    urgency: "Emergency",
    suggestion:
      "This needs immediate medical attention. Do not wait for a routine appointment — go to an emergency department now.",
  },
};

const normalize = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const distinctSpecialists = (conditions) => {
  const seen = new Set();
  const result = [];
  for (const c of conditions) {
    if (c.specialist && !seen.has(c.specialist)) {
      seen.add(c.specialist);
      result.push(c.specialist);
    }
  }
  return result;
};

const matchCondition = (condition, symptoms) => {
  const matchedKeywords = [];
  let keywordHits = 0;
  for (const s of symptoms) {
    for (const keyword of condition.keywords) {
      if (s.includes(keyword) || keyword.includes(s)) {
        matchedKeywords.push(keyword);
        keywordHits++;
      }
    }
  }
  if (keywordHits === 0) return null;
  return {
    ...condition,
    matchedKeywords: [...new Set(matchedKeywords)],
    keywordHits,
  };
};

const checkSymptoms = (symptoms) => {
  const cleaned = [
    ...new Set(
      symptoms
        .map((s) => normalize(s))
        .filter((s) => s.length >= 2)
    ),
  ];

  if (cleaned.length === 0) {
    return {
      matchedSymptoms: [],
      conditions: [],
      severity: null,
      specialist: null,
      action: null,
      summaryText: "I couldn't pick up any specific symptoms. Could you describe them in a little more detail?",
    };
  }

  const scored = CONDITIONS.map((c) => matchCondition(c, cleaned))
    .filter(Boolean)
    .sort((a, b) => {
      if (a.keywordHits !== b.keywordHits) return b.keywordHits - a.keywordHits;
      return SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
    });

  const conditions = scored.slice(0, 3).map((c) => ({
    id: c.id,
    name: c.name,
    severity: c.severity,
    severityLabel: SEVERITY_META[c.severity].label,
    specialist: c.specialist,
    action: c.action,
    advice: c.advice,
    matchedKeywords: c.matchedKeywords,
  }));

  const overallSeverity = scored.reduce(
    (acc, c) => Math.max(acc, SEVERITY_ORDER[c.severity]),
    0
  );
  const severityKey =
    Object.keys(SEVERITY_ORDER).find((k) => SEVERITY_ORDER[k] === overallSeverity) ||
    "low";
  const specialist = distinctSpecialists(conditions)[0] || null;
  const action = conditions.some((c) => c.action === "urgent")
    ? "urgent"
    : conditions.some((c) => c.action === "book")
    ? "book"
    : "self-care";

  const names = conditions.map((c) => c.name).join(", ");
  let summaryText =
    cleaned.length === 1
      ? `Based on "${cleaned[0]}", the closest matches are: ${names}.`
      : `Based on the symptoms you described (${cleaned.join(", ")}), the closest matches are: ${names}.`;
  summaryText += ` ${SEVERITY_META[severityKey].suggestion}`;

  return {
    matchedSymptoms: cleaned,
    conditions,
    severity: severityKey,
    severityLabel: SEVERITY_META[severityKey].label,
    urgency: SEVERITY_META[severityKey].urgency,
    suggestion: SEVERITY_META[severityKey].suggestion,
    specialist,
    action,
    summaryText,
  };
};

const findDoctors = async (specialist, limit = 4) => {
  if (!specialist) return [];
  const terms = specialist
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((t) => t.length > 1);

  const doctors = await Doctor.find({ isAvailable: true })
    .select(
      "_id name specialization fees experience rating image location hospital isOnline"
    )
    .lean();

  const primary = doctors.filter((d) => {
    const spec = (d.specialization || "").toLowerCase();
    return terms.some((t) => spec.includes(t));
  });

  if (primary.length > 0) {
    return primary
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit);
  }

  const fallback = doctors.filter((d) => {
    const spec = (d.specialization || "").toLowerCase();
    return spec.includes("general") || spec.includes("physician");
  });

  return fallback.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, limit);
};

const buildSuggestion = (result) => ({
  severity: result.severity,
  severityLabel: result.severityLabel,
  urgency: result.urgency,
  suggestion: result.suggestion,
  specialist: result.specialist,
  action: result.action,
});

  const getFAQs = (query) => {
    const q = normalize(query);
    if (!q) return FAQs;
    const words = q
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w));
    if (words.length === 0) return [];
    const scored = FAQs.map((faq) => {
      const qText = faq.question.toLowerCase();
      const aText = faq.answer.toLowerCase();
      let score = 0;
      for (const w of words) {
        if (qText.includes(w)) score += 3;
        else if (aText.includes(w)) score += 1;
      }
      return { faq, score };
    })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.map((x) => x.faq);
  };

const getHealthTips = (category) => {
  if (!category) {
    return [...HEALTH_TIPS].sort(() => Math.random() - 0.5).slice(0, 4);
  }
  const key = normalize(category);
  const tips = HEALTH_TIPS.filter(
    (t) => t.category.toLowerCase() === key || t.title.toLowerCase().includes(key)
  );
  return tips.length > 0 ? tips : HEALTH_TIPS.slice(0, 4);
};

const GREETING_RE = /^(hi|hello|hey|good (morning|afternoon|evening)|namaste|hii|hiii)\b/;
const THANKS_RE = /(thank you|thanks|thx|thanku)/;
const HELP_RE = /(what can you do|help|how do you work|features)/;
const BOOK_RE = /(book|appointment|schedule|consultation|slot)/;
const TIP_RE = /(tip|tips|advice|health tip|suggest)/;

const extractSymptoms = (message) => {
  const msg = normalize(message);
  const allKeywords = CONDITIONS.flatMap((c) => c.keywords);
  const found = [];
  for (const keyword of allKeywords) {
    if (msg.includes(keyword)) found.push(keyword);
  }
  const unique = found.sort((a, b) => b.length - a.length);
  const result = [];
  for (const term of unique) {
    if (!result.some((r) => r.includes(term))) result.push(term);
  }
  return result;
};

const chatbotReply = async (message) => {
  const msg = normalize(message);

  if (!msg) {
    return {
      type: "intro",
      text: "Hi! I'm your DocBook health assistant. I can check symptoms, recommend a doctor, answer questions, and share health tips. How can I help you today?",
    };
  }

  const symptoms = extractSymptoms(msg);
  if (symptoms.length > 0) {
    const result = checkSymptoms(symptoms);
    const doctors = await findDoctors(result.specialist);
    const severityNote =
      result.severity === "urgent"
        ? " ⚠️ Please treat this as an emergency and seek care immediately."
        : "";
    return {
      type: "symptom-check",
      text: `${result.summaryText}${severityNote}\n\n${DISCLAIMER}`,
      data: {
        matchedSymptoms: result.matchedSymptoms,
        conditions: result.conditions,
        severity: result.severity,
        severityLabel: result.severityLabel,
        suggestion: result.suggestion,
        specialist: result.specialist,
        doctors,
      },
    };
  }

  if (GREETING_RE.test(msg)) {
    return {
      type: "intro",
      text: "Hello! 👋 I'm here to help. You can describe your symptoms, ask about doctors, or ask me questions about appointments and payments. What would you like to do?",
    };
  }

  if (THANKS_RE.test(msg)) {
    return {
      type: "general",
      text: "You're welcome! Stay healthy. 😊 Is there anything else I can help you with?",
    };
  }

  if (HELP_RE.test(msg)) {
    return {
      type: "general",
      text: "Here's what I can do:\n\n• 🩺 Check your symptoms and suggest the right specialist\n• 🧑‍⚕️ Recommend doctors based on symptoms\n• 📅 Help you understand booking and payments\n• ❓ Answer frequently asked questions\n• 💡 Share daily health tips\n\nJust describe your symptoms, or ask me a question!",
    };
  }

  if (TIP_RE.test(msg) && !msg.includes("appointment")) {
    const tips = getHealthTips();
    const tip = tips[0];
    return {
      type: "tip",
      text: `💡 Health tip: ${tip.title}\n\n${tip.tip}`,
    };
  }

  const specialistMatch = CONDITIONS.find(
    (c) => c.specialist && msg.includes(c.specialist.toLowerCase())
  );
  if (specialistMatch) {
    const doctors = await findDoctors(specialistMatch.specialist);
    return {
      type: "booking",
      text: `You can book a ${specialistMatch.specialist} through the All Doctors page. Here are doctors who match your need:`,
      data: { doctors, specialist: specialistMatch.specialist },
    };
  }

  const faqs = getFAQs(msg);
  if (faqs.length > 0) {
    return {
      type: "faq",
      text: `❓ ${faqs[0].question}\n\n${faqs[0].answer}`,
    };
  }

  if (BOOK_RE.test(msg)) {
    return {
      type: "booking",
      text: "To book an appointment:\n\n1. Go to 'All Doctors'.\n2. Pick a doctor and tap 'Book Appointment'.\n3. Choose a date, time, consultation type (in-clinic or video), and payment method.\n\nYou can also run a symptom check and I'll recommend the right specialist for you.",
    };
  }

  if (msg.includes("doctor")) {
    return {
      type: "doctors",
      text: "You can browse all our doctors on the 'All Doctors' page, or run a symptom check so I can recommend the right specialist for you.",
    };
  }

  return {
    type: "general",
    text: "I'm not sure I understood that. Try describing your symptoms (e.g., 'I have a headache and fever'), asking about appointments, or type 'help' to see what I can do.",
  };
};

export {
  checkSymptoms,
  findDoctors,
  getFAQs,
  getHealthTips,
  chatbotReply,
  buildSuggestion,
  DISCLAIMER,
  SEVERITY_META,
};
