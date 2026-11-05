// Pure validation helpers for the customer booking path.
// No Supabase calls and no React here, so they are easy to test and reuse.

export const MAX_NOTES_LENGTH = 500;

const isBlank = (value) =>
  value === null || value === undefined || String(value).trim() === "";

// Trim notes. Missing notes become an empty string.
export function normalizeNotes(notes) {
  if (notes === null || notes === undefined) return "";
  return String(notes).trim();
}

export function validateNotes(notes) {
  if (normalizeNotes(notes).length > MAX_NOTES_LENGTH) {
    return { ok: false, message: `Notes must be ${MAX_NOTES_LENGTH} characters or fewer.` };
  }
  return { ok: true };
}

// A booking can only target a slot that starts after `now`.
export function validateSlotStart(startsAt, now = new Date()) {
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) {
    return { ok: false, message: "That time slot is not valid. Please pick another." };
  }
  if (start.getTime() <= new Date(now).getTime()) {
    return { ok: false, message: "That time has already passed. Please pick a future time." };
  }
  return { ok: true };
}

// Validates a booking request before it is sent to the request_appointment RPC.
// `slotStartsAt` is optional: when given, the slot must start in the future.
// The database still makes the final decision on availability.
export function validateAppointmentRequest(
  { serviceId, slotId, notes, slotStartsAt } = {},
  now = new Date(),
) {
  if (isBlank(serviceId)) return { ok: false, message: "Please choose a service." };
  if (isBlank(slotId)) return { ok: false, message: "Please choose an available time." };

  const notesCheck = validateNotes(notes);
  if (!notesCheck.ok) return notesCheck;

  if (slotStartsAt !== undefined && slotStartsAt !== null) {
    const startCheck = validateSlotStart(slotStartsAt, now);
    if (!startCheck.ok) return startCheck;
  }

  return { ok: true };
}
