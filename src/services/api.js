// Shared helpers for every *Service.js file.

// Turn database/RPC errors into messages safe to show on screen.
export function toUserMessage(error) {
  if (!error) return "";
  const m = error.message || "";
  if (error.code === "23505") return "You already have a request for this slot.";
  if (m.includes("Slot is full")) return "Sorry, that time slot was just taken. Please pick another.";
  if (m.includes("Slot not available") || m.includes("New slot not available"))
    return "That time slot is no longer available.";
  if (m.includes("Service not available")) return "That service is not available right now.";
  if (m.includes("Admins only")) return "You do not have permission to do that.";
  if (m.includes("Invalid status change")) return "That change isn't allowed for this appointment's current status.";
  if (m.includes("Invalid login credentials")) return "Incorrect email or password.";
  if (m.includes("already registered")) return "An account with this email already exists.";
  if (m.includes("permission denied") || m.includes("row-level security"))
    return "You do not have permission to do that.";
  return m || "Something went wrong. Please try again.";
}

// Timestamps are stored in UTC; always DISPLAY in Philippine time.
export function formatManila(iso, opts = { dateStyle: "medium", timeStyle: "short" }) {
  return new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", ...opts }).format(new Date(iso));
}
