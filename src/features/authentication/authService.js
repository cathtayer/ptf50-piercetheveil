import { supabase } from "../../services/supabase";

// NOTE: Supabase requires email confirmation by default. For development you can turn it off in
// Dashboard > Authentication > Sign In / Providers > Email > "Confirm email".

export async function signUp({ email, password, fullName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }, // the DB trigger copies this into profiles
  });
  if (error) throw error;
  return data; // data.session is null when email confirmation is required
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

// Customers can only change full_name and phone (role is locked in the database).
export async function updateProfile(userId, { fullName, phone }) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone })
    .eq("id", userId)
    .select("id, full_name, phone, role")
    .single();
  if (error) throw error;
  return data;
}
