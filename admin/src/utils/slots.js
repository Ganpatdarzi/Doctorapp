const toMinutes = (time) => {
  if (!time) return 0
  const match = String(time).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
  if (!match) return 0
  let hours = parseInt(match[1], 10)
  const mins = parseInt(match[2], 10)
  const period = match[3]
  if (period) {
    const isPM = period.toUpperCase() === 'PM'
    if (isPM && hours !== 12) hours += 12
    if (!isPM && hours === 12) hours = 0
  }
  return hours * 60 + mins
}

const to12Hour = (minutes) => {
  const h24 = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  const period = h24 >= 12 ? 'PM' : 'AM'
  let h = h24 % 12
  if (h === 0) h = 12
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`
}

export const generateSlots = (start, end, duration, breaks = []) => {
  const slots = []
  const startM = toMinutes(start)
  const endM = toMinutes(end)
  const safeDuration = Math.max(parseInt(duration, 10) || 30, 5)
  if (!startM && endM === 0) return slots
  for (let t = startM; t + safeDuration <= endM; t += safeDuration) {
    const slotStart = t
    const slotEnd = t + safeDuration
    const inBreak = breaks.some(
      (b) => b.start && b.end && slotStart < toMinutes(b.end) && slotEnd > toMinutes(b.start)
    )
    if (!inBreak) slots.push(to12Hour(slotStart))
  }
  return slots
}

export const sortTimeSlots = (slots) => {
  return [...slots].sort((a, b) => toMinutes(a) - toMinutes(b))
}
