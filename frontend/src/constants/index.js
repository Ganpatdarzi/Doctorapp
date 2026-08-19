export const APPOINTMENT_STATUSES = [
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'rejected', label: 'Rejected' },
]

export const APPOINTMENT_STATUS_MAP = APPOINTMENT_STATUSES.reduce(
  (acc, s) => {
    acc[s.key] = s.label
    return acc
  },
  {}
)

export const MY_APPOINTMENT_TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'rejected', label: 'Rejected' },
]

export const SPECIALIZATION_ICONS = {
  'General Physician': '🩺',
  Cardiologist: '❤️',
  Dermatologist: '🧴',
  Pediatrician: '👶',
  Neurologist: '🧠',
  Orthopedic: '🦴',
  'Orthopedic Surgeon': '🦴',
  Gynecologist: '🌸',
  Urologist: '💧',
  'ENT Specialist': '👂',
  Ophthalmologist: '👁️',
  Psychiatrist: '🧘',
  Gastroenterologist: '🫁',
  Endocrinologist: '🧪',
  Rheumatologist: '🦴',
  Nephrologist: '🫘',
  Anesthesiologist: '💤',
  Radiologist: '🩻',
  Oncologist: '🎗️',
  'General Surgeon': '🩺',
  Pulmonologist: '🫁',
}

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export const DAY_SHORT_MAP = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
}

export const LIMIT = 9
