// Local healthcare knowledge base used by the AI assistant.
// NOTE: This is for informational guidance only and is NOT a medical diagnosis.

export const CONDITIONS = [
  {
    id: "common-cold",
    name: "Common Cold",
    keywords: ["runny nose", "sneezing", "congestion", "stuffy nose", "mild cough", "mild sore throat", "cold"],
    severity: "low",
    specialist: "General Physician",
    action: "self-care",
    advice:
      "A common cold usually clears up on its own in 7–10 days. Rest, drink plenty of fluids, and try steam inhalation for congestion. See a doctor if symptoms worsen or last beyond 10 days.",
  },
  {
    id: "influenza",
    name: "Influenza (Flu)",
    keywords: ["fever", "body ache", "body pain", "chills", "fatigue", "dry cough", "muscle pain", "flu"],
    severity: "medium",
    specialist: "General Physician",
    action: "book",
    advice:
      "Flu symptoms can last up to two weeks. Rest, hydrate, and use fever reducers like paracetamol. Consult a doctor if you have a high persistent fever, breathing difficulty, or are at high risk.",
  },
  {
    id: "migraine",
    name: "Migraine",
    keywords: ["throbbing headache", "headache one side", "migraine", "light sensitivity", "nausea with headache", "pulsating head pain"],
    severity: "medium",
    specialist: "Neurologist",
    action: "book",
    advice:
      "Migraines cause intense, often one-sided throbbing pain. Rest in a quiet, dark room and keep hydrated. Track your triggers and consult a neurologist if attacks are frequent or severe.",
  },
  {
    id: "tension-headache",
    name: "Tension Headache",
    keywords: ["dull headache", "tight band", "stress headache", "headache both sides", "scalp tenderness", "pressure in head"],
    severity: "low",
    specialist: "General Physician",
    action: "self-care",
    advice:
      "Tension headaches usually respond to rest, hydration, stress relief, and simple pain relievers. If they become frequent, a doctor can help identify triggers.",
  },
  {
    id: "sinusitis",
    name: "Sinusitis",
    keywords: ["sinus", "facial pain", "facial pressure", "thick nasal discharge", "congestion", "pain around eyes", "sinus headache"],
    severity: "medium",
    specialist: "ENT Specialist",
    action: "book",
    advice:
      "Sinusitis causes pressure around the nose, eyes, and forehead. Use saline rinses and steam, and rest. See an ENT specialist if symptoms persist beyond a week or are painful.",
  },
  {
    id: "strep-throat",
    name: "Strep Throat / Tonsillitis",
    keywords: ["sore throat", "painful swallowing", "swollen tonsils", "white patches throat", "throat pain", "hoarse voice"],
    severity: "medium",
    specialist: "ENT Specialist",
    action: "book",
    advice:
      "A bacterial throat infection may need antibiotics. Gargle warm salt water and take throat lozenges. Visit an ENT specialist, especially if you have a fever or white patches.",
  },
  {
    id: "allergies",
    name: "Seasonal Allergies",
    keywords: ["sneezing", "itchy eyes", "watery eyes", "allergy", "runny nose", "itchy nose", "hay fever"],
    severity: "low",
    specialist: "General Physician",
    action: "self-care",
    advice:
      "Allergies can be managed with antihistamines and avoiding triggers like dust or pollen. Keep windows closed on high-pollen days. See a doctor if symptoms are severe or persistent.",
  },
  {
    id: "asthma",
    name: "Asthma",
    keywords: ["wheezing", "shortness of breath", "chest tightness", "cough at night", "difficulty breathing", "asthma", "breathless"],
    severity: "high",
    specialist: "Pulmonologist",
    action: "book",
    advice:
      "Wheezing, chest tightness, and breathlessness may indicate asthma or airway issues. Use your reliever inhaler if you have one. Seek urgent care if breathing becomes very difficult or lips turn blue.",
  },
  {
    id: "gastroenteritis",
    name: "Gastroenteritis (Stomach Flu)",
    keywords: ["diarrhea", "stomach cramps", "abdominal cramps", "nausea", "vomiting", "loose stools", "stomach upset"],
    severity: "medium",
    specialist: "Gastroenterologist",
    action: "book",
    advice:
      "Stay hydrated with oral rehydration salts and small sips of water. Avoid dairy and spicy food. Consult a gastroenterologist if vomiting or diarrhea persists, or if you become severely dehydrated.",
  },
  {
    id: "acid-reflux",
    name: "Acid Reflux (GERD)",
    keywords: ["heartburn", "acid taste", "indigestion", "chest burning", "burping", "acid reflux", "regurgitation"],
    severity: "medium",
    specialist: "Gastroenterologist",
    action: "book",
    advice:
      "Avoid large meals, spicy food, and lying down right after eating. Elevate your head while sleeping. A gastroenterologist can help if heartburn is frequent or does not improve.",
  },
  {
    id: "gastric-ulcer",
    name: "Stomach Ulcer",
    keywords: ["stomach pain", "burning pain", "bloating", "nausea", "stomach burning", "pain after eating", "ulcer"],
    severity: "medium",
    specialist: "Gastroenterologist",
    action: "book",
    advice:
      "A burning stomach pain, especially a few hours after meals, may suggest a peptic ulcer. Avoid NSAIDs and alcohol. See a gastroenterologist for evaluation and treatment.",
  },
  {
    id: "appendicitis",
    name: "Appendicitis (Possible)",
    keywords: ["severe abdominal pain", "right lower pain", "sharp abdominal pain", "pain around navel", "abdominal pain", "loss of appetite"],
    severity: "urgent",
    specialist: "General Surgeon",
    action: "urgent",
    advice:
      "Severe, worsening abdominal pain that moves to the lower right side could be appendicitis. Do not eat, drink, or take painkillers. Seek emergency medical care immediately.",
  },
  {
    id: "uti",
    name: "Urinary Tract Infection",
    keywords: ["burning urination", "frequent urination", "urinary", "cloudy urine", "pelvic pain", "painful urination", "urine"],
    severity: "medium",
    specialist: "General Physician",
    action: "book",
    advice:
      "A burning sensation while urinating and frequent urges suggest a UTI. Drink plenty of water and avoid bladder irritants. See a doctor for a proper diagnosis, since UTIs can worsen.",
  },
  {
    id: "kidney-stones",
    name: "Kidney Stones",
    keywords: ["flank pain", "severe back pain", "blood in urine", "kidney stone", "pain urinating", "lower back pain"],
    severity: "high",
    specialist: "Urologist",
    action: "book",
    advice:
      "Severe cramping pain in the back or side with nausea may be kidney stones. Drink lots of water. Seek urgent care if you have a fever, inability to urinate, or unmanageable pain.",
  },
  {
    id: "lower-back-pain",
    name: "Lower Back Pain",
    keywords: ["back pain", "sciatica", "muscle strain", "lower back stiffness", "backache", "spinal pain"],
    severity: "low",
    specialist: "Orthopedic Surgeon",
    action: "book",
    advice:
      "Most back pain improves with gentle movement, heat, and good posture. See an orthopedic specialist if pain lasts more than a few weeks, travels down a leg, or follows an injury.",
  },
  {
    id: "osteoarthritis",
    name: "Osteoarthritis",
    keywords: ["joint pain", "knee pain", "stiffness in morning", "reduced mobility", "joint stiffness", "creaking joints", "arthritis"],
    severity: "medium",
    specialist: "Orthopedic Surgeon",
    action: "book",
    advice:
      "Joint pain and morning stiffness are common with osteoarthritis. Gentle exercise and weight management help. An orthopedic specialist can plan treatment including physiotherapy.",
  },
  {
    id: "dermatitis",
    name: "Skin Rash / Dermatitis",
    keywords: ["rash", "itchy skin", "red skin", "hives", "dry patches", "skin irritation", "irritated skin"],
    severity: "low",
    specialist: "Dermatologist",
    action: "book",
    advice:
      "Rashes can result from allergies, irritants, or infections. Keep the skin moisturized and avoid scratching. See a dermatologist if the rash spreads, blisters, or persists.",
  },
  {
    id: "conjunctivitis",
    name: "Conjunctivitis (Pink Eye)",
    keywords: ["red eye", "itchy eye", "eye discharge", "watery eye", "pink eye", "sticky eye", "eye redness"],
    severity: "low",
    specialist: "Ophthalmologist",
    action: "book",
    advice:
      "Pink eye causes redness, discharge, and irritation. Avoid touching your eyes and wash hands often. See an ophthalmologist if vision changes or symptoms last more than a few days.",
  },
  {
    id: "ear-infection",
    name: "Ear Infection",
    keywords: ["ear pain", "earache", "ear discharge", "hearing muffled", "ear infection", "pain in ear", "blocked ear"],
    severity: "medium",
    specialist: "ENT Specialist",
    action: "book",
    advice:
      "Ear pain and muffled hearing may indicate an infection. Keep the ear dry and avoid inserting anything into it. An ENT specialist can confirm the cause and prescribe treatment.",
  },
  {
    id: "anxiety",
    name: "Anxiety",
    keywords: ["anxiety", "nervousness", "racing heart", "panic", "restlessness", "worry", "stress"],
    severity: "medium",
    specialist: "Psychiatrist",
    action: "book",
    advice:
      "Anxiety can cause racing thoughts, restlessness, and physical symptoms. Practice deep breathing and limit caffeine. A psychiatrist can help with coping strategies if it affects daily life.",
  },
  {
    id: "depression",
    name: "Depression",
    keywords: ["sadness", "loss of interest", "low mood", "hopelessness", "depressed", "loss of motivation", "sleep problems"],
    severity: "high",
    specialist: "Psychiatrist",
    action: "book",
    advice:
      "Persistent low mood or loss of interest may be depression. Talk to someone you trust and consider professional support. A psychiatrist or counselor can help you feel better.",
  },
  {
    id: "hypertension",
    name: "High Blood Pressure (Hypertension)",
    keywords: ["high blood pressure", "hypertension", "dizziness", "blurred vision", "chest tightness", "bp"],
    severity: "high",
    specialist: "Cardiologist",
    action: "book",
    advice:
      "High blood pressure often has no symptoms. Reduce salt, exercise regularly, and monitor your readings. See a cardiologist to manage it and prevent complications.",
  },
  {
    id: "cardiac-chest-pain",
    name: "Chest Pain (Cardiac – Possible)",
    keywords: ["chest pain", "chest pressure", "pain in arm", "arm pain", "sweating", "jaw pain", "chest discomfort"],
    severity: "urgent",
    specialist: "Cardiologist",
    action: "urgent",
    advice:
      "Chest pain or pressure that spreads to the arm, jaw, or back could be a heart attack. Do not wait. Call emergency services or go to the nearest emergency department immediately.",
  },
  {
    id: "diabetes",
    name: "Diabetes (Possible)",
    keywords: ["excessive thirst", "frequent urination", "frequent peeing", "slow healing", "blurred vision", "sugar", "diabetes"],
    severity: "high",
    specialist: "Endocrinologist",
    action: "book",
    advice:
      "Increased thirst, urination, and fatigue can point to diabetes. Get a blood sugar test. An endocrinologist can confirm the diagnosis and plan diet and treatment.",
  },
  {
    id: "pneumonia",
    name: "Pneumonia (Possible)",
    keywords: ["high fever", "productive cough", "cough with mucus", "chest pain breathing", "breathlessness", "coughing"],
    severity: "high",
    specialist: "Pulmonologist",
    action: "urgent",
    advice:
      "A high fever with a bad cough and breathlessness may be pneumonia. Rest and hydrate, but seek medical care promptly, especially if breathing is labored or you feel confused.",
  },
  {
    id: "viral-fever",
    name: "Viral Fever / Flu-like Illness",
    keywords: ["fever", "cough", "body ache", "headache", "fatigue", "loss of taste", "loss of smell"],
    severity: "medium",
    specialist: "General Physician",
    action: "book",
    advice:
      "A viral fever with cough and fatigue usually improves with rest, fluids, and paracetamol. Monitor your temperature. See a doctor if the fever is high, prolonged, or you have trouble breathing.",
  },
  {
    id: "vertigo",
    name: "Vertigo / Dizziness",
    keywords: ["dizziness", "spinning sensation", "balance loss", "lightheaded", "vertigo", "unsteady"],
    severity: "medium",
    specialist: "ENT Specialist",
    action: "book",
    advice:
      "A spinning or lightheaded feeling can be vertigo. Sit down when dizzy and avoid sudden movements. An ENT specialist can identify inner-ear causes and offer treatment.",
  },
  {
    id: "anemia",
    name: "Anemia (Possible)",
    keywords: ["fatigue", "weakness", "pale skin", "shortness of breath", "dizziness", "low energy", "tiredness"],
    severity: "medium",
    specialist: "General Physician",
    action: "book",
    advice:
      "Persistent tiredness, pale skin, and breathlessness may suggest anemia. Eat iron-rich foods and get a blood test. A doctor can confirm and recommend supplements if needed.",
  },
];

export const FAQs = [
  {
    id: "book-appointment",
    category: "Appointments",
    question: "How do I book an appointment with a doctor?",
    answer:
      "Go to the 'All Doctors' page, choose a doctor, and click 'Book Appointment'. Select your preferred date, time slot, consultation type (in-clinic or video), and payment method, then confirm.",
  },
  {
    id: "payment-methods",
    category: "Payments",
    question: "What payment methods are accepted?",
    answer:
      "You can pay online securely via card through Stripe, or choose to pay at the clinic in cash or by card when you visit.",
  },
  {
    id: "reschedule",
    category: "Appointments",
    question: "Can I reschedule my appointment?",
    answer:
      "Yes. Open 'My Appointments', choose the appointment, and select Reschedule to pick a new date and time slot, subject to doctor availability.",
  },
  {
    id: "cancel-refund",
    category: "Payments",
    question: "What happens if I cancel an appointment?",
    answer:
      "You can cancel pending or confirmed appointments from 'My Appointments'. If you paid online, the refund is processed automatically for eligible cancellations.",
  },
  {
    id: "video-consultation",
    category: "Appointments",
    question: "How do video consultations work?",
    answer:
      "When booking, choose 'Video Call' as the consultation type. After the doctor confirms, a 'Join Video Call' button appears. You'll enter a secure online meeting room at the scheduled time.",
  },
  {
    id: "consultation-fees",
    category: "Payments",
    question: "How much is the consultation fee?",
    answer:
      "The consultation fee is set by each doctor and shown on their profile and the booking page. It is clearly displayed before you confirm your appointment.",
  },
  {
    id: "medical-records",
    category: "Records",
    question: "How do I view my medical records and prescriptions?",
    answer:
      "Log in and open 'Medical Records' from the navigation menu. You can view your prescriptions, reports, and download PDFs shared by your doctor.",
  },
  {
    id: "payment-history",
    category: "Payments",
    question: "How do I see my payment history and receipts?",
    answer:
      "Open 'Payments' from the navigation menu. You'll find all your transactions and can download a receipt for each payment.",
  },
  {
    id: "doctor-availability",
    category: "Doctors",
    question: "What if my preferred doctor is not available?",
    answer:
      "You can filter doctors by specialization on the 'All Doctors' page, or use the AI Symptom Checker to get a recommendation for the right specialist.",
  },
  {
    id: "data-security",
    category: "Account",
    question: "Is my personal and health information secure?",
    answer:
      "Yes. Your account is protected with secure authentication, and your medical records are only visible to you and the doctors who treat you.",
  },
  {
    id: "clinic-visit",
    category: "Appointments",
    question: "What should I bring to a clinic visit?",
    answer:
      "Bring a valid ID, your appointment reference, any current prescriptions, and past test reports or medical history that may be relevant.",
  },
  {
    id: "prescription",
    category: "Records",
    question: "How do I get a prescription after a consultation?",
    answer:
      "After your consultation, your doctor can add a medical record with a prescription. It appears under 'Medical Records' where you can also download the prescription PDF.",
  },
  {
    id: "account-issues",
    category: "Account",
    question: "How do I update my profile or contact details?",
    answer:
      "Open 'Profile' from the navigation menu to update your name, phone number, address, and other details.",
  },
  {
    id: "emergency",
    category: "General",
    question: "Can this app handle emergencies?",
    answer:
      "No. This platform is for routine and scheduled consultations only. If you have a medical emergency, call your local emergency number or go to the nearest emergency department immediately.",
  },
];

export const HEALTH_TIPS = [
  {
    id: "hydration",
    category: "General",
    title: "Stay Hydrated",
    tip: "Drink around 8 glasses of water a day. Dehydration causes fatigue, headaches, and poor concentration.",
  },
  {
    id: "diet",
    category: "Nutrition",
    title: "Eat a Balanced Diet",
    tip: "Include fruits, vegetables, whole grains, and lean protein. Limit processed foods, sugar, and excess salt.",
  },
  {
    id: "exercise",
    category: "Fitness",
    title: "Move Every Day",
    tip: "Aim for at least 30 minutes of moderate activity, 5 days a week — brisk walking counts.",
  },
  {
    id: "sleep",
    category: "General",
    title: "Prioritize Sleep",
    tip: "Adults need 7–8 hours of quality sleep. Keep a consistent schedule and limit screens before bed.",
  },
  {
    id: "hygiene",
    category: "General",
    title: "Wash Your Hands",
    tip: "Frequent hand washing with soap for at least 20 seconds is one of the best ways to prevent infections.",
  },
  {
    id: "screen-time",
    category: "Lifestyle",
    title: "Limit Screen Time",
    tip: "Take a 20-second break every 20 minutes, and look at something 20 feet away to reduce eye strain.",
  },
  {
    id: "stress",
    category: "Mental Health",
    title: "Manage Stress",
    tip: "Try deep breathing, short walks, or mindfulness for 5 minutes a day. Stress affects both mind and body.",
  },
  {
    id: "sun-protection",
    category: "General",
    title: "Protect Your Skin",
    tip: "Use sunscreen with SPF 30+ even on cloudy days, and wear a hat during peak sun hours.",
  },
  {
    id: "checkups",
    category: "Prevention",
    title: "Don't Skip Checkups",
    tip: "Regular health checkups catch problems early. Monitor your blood pressure and blood sugar annually.",
  },
  {
    id: "sugar",
    category: "Nutrition",
    title: "Cut Down on Sugar",
    tip: "Swap sugary drinks for water. Excess sugar increases the risk of diabetes and heart disease.",
  },
  {
    id: "smoking",
    category: "Lifestyle",
    title: "Avoid Tobacco & Excess Alcohol",
    tip: "Quitting smoking and limiting alcohol dramatically lowers your risk of many chronic diseases.",
  },
  {
    id: "posture",
    category: "Lifestyle",
    title: "Watch Your Posture",
    tip: "Keep your screen at eye level and take standing breaks to protect your neck and lower back.",
  },
];
