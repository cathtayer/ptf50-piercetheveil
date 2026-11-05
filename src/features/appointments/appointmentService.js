import { supabase } from "../../services/supabase";

/* ---------------- customer ---------------- */

export async function listServices() {
  const { data, error } = await supabase
    .from("services")
    .select("id, name, price, duration_minutes, piercing_type_id")
    .eq("is_active", true)
    .order("price");
  if (error) throw error;
  return data;
}

// Open slots with remaining capacity. Pass Date objects or ISO strings.
export async function getAvailableSlots(from, to) {
  const { data, error } = await supabase.rpc("get_available_slots", {
    p_from: new Date(from).toISOString(),
    p_to: new Date(to).toISOString(),
  });
  if (error) throw error;
  return data;
}

// Creates a PENDING request. Returns the new appointment id.
export async function requestAppointment({ serviceId, slotId, notes }) {
  const { data, error } = await supabase.rpc("request_appointment", {
    p_service_id: serviceId,
    p_slot_id: slotId,
    p_notes: notes ?? null,
  });
  if (error) throw error;
  return data;
}

export async function listMyAppointments() {
  const { data, error } = await supabase
    .from("appointments")
    .select("id, status, notes, created_at, services(name, price, duration_minutes), availability_slots(starts_at, ends_at)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data; // RLS already limits this to the signed-in customer
}

export async function cancelMyAppointment(id) {
  const { error } = await supabase.rpc("cancel_my_appointment", { p_id: id });
  if (error) throw error;
}

/* ---------------- admin ---------------- */

export async function listAllAppointments({ status } = {}) {
  let q = supabase
    .from("appointments")
    .select(
      "id, status, notes, created_at, profiles(full_name, phone), services(name, price), availability_slots(starts_at, ends_at)"
    )
    .order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

// action: 'approve' | 'reject' | 'reschedule' | 'complete' | 'cancel' | 'no_show'
export async function adminUpdateAppointment(id, action, { newSlotId, note } = {}) {
  const { error } = await supabase.rpc("admin_update_appointment", {
    p_id: id,
    p_action: action,
    p_new_slot_id: newSlotId ?? null,
    p_note: note ?? null,
  });
  if (error) throw error;
}

export async function getAppointmentEvents(appointmentId) {
  const { data, error } = await supabase
    .from("appointment_events")
    .select("id, old_status, new_status, note, created_at")
    .eq("appointment_id", appointmentId)
    .order("created_at");
  if (error) throw error;
  return data;
}

/* ---------------- admin: schedule management ---------------- */

export async function listSlots(from, to) {
  const { data, error } = await supabase
    .from("availability_slots")
    .select("*")
    .gte("starts_at", new Date(from).toISOString())
    .lt("starts_at", new Date(to).toISOString())
    .order("starts_at");
  if (error) throw error;
  return data;
}

export async function createSlot({ startsAt, endsAt, capacity = 1 }) {
  const { data, error } = await supabase
    .from("availability_slots")
    .insert({ starts_at: new Date(startsAt).toISOString(), ends_at: new Date(endsAt).toISOString(), capacity })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setSlotBlocked(slotId, isBlocked) {
  const { error } = await supabase.from("availability_slots").update({ is_blocked: isBlocked }).eq("id", slotId);
  if (error) throw error;
}

/* ---------------- admin: service management ---------------- */

export async function listAllServices() {
  const { data, error } = await supabase.from("services").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function createService(service) {
  const { data, error } = await supabase.from("services").insert(service).select().single();
  if (error) throw error;
  return data;
}

export async function updateService(id, changes) {
  const { data, error } = await supabase.from("services").update(changes).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

// ADD these two functions to the end of src/features/appointments/appointmentService.js
// (no new imports needed; `supabase` is already imported at the top of that file)

/* ---------------- admin: service management (lookup) ---------------- */

export async function listPiercingTypes() {
  const { data, error } = await supabase.from("piercing_types").select("id, name").order("name");
  if (error) throw error;
  return data;
}

/* ---------------- admin: customers ---------------- */

// Customer profiles plus visit stats (visits = COMPLETED appointments).
// RLS lets admins read all profiles and appointments; customers would only see themselves.
export async function listCustomers() {
  const [profilesRes, apptsRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, phone").eq("role", "customer").order("full_name"),
    supabase.from("appointments").select("status, profiles(id), availability_slots(starts_at)"),
  ]);
  if (profilesRes.error) throw profilesRes.error;
  if (apptsRes.error) throw apptsRes.error;

  const one = (v) => (Array.isArray(v) ? v[0] : v);
  const stats = new Map(); // profileId -> { visits, lastVisit }
  for (const a of apptsRes.data) {
    const pid = one(a.profiles)?.id;
    if (!pid || a.status !== "COMPLETED") continue;
    const startsAt = one(a.availability_slots)?.starts_at ?? null;
    const s = stats.get(pid) ?? { visits: 0, lastVisit: null };
    s.visits += 1;
    if (startsAt && (!s.lastVisit || startsAt > s.lastVisit)) s.lastVisit = startsAt;
    stats.set(pid, s);
  }

  return profilesRes.data.map((p) => ({
    ...p,
    visits: stats.get(p.id)?.visits ?? 0,
    lastVisit: stats.get(p.id)?.lastVisit ?? null,
  }));
}
