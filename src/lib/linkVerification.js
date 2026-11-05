// Client-side checks for the Join Gym form.
//
// These only stop obviously invalid input from being submitted. The authoritative
// match (name + phone against the gym's member record, and the account link) is
// performed by the join-gym backend function — a browser comparison is never
// proof of identity.
export function normalizePersonName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

export function normalizePhoneInput(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  // Keep a leading + and digits only; spaces, dashes and brackets are formatting.
  const plus = raw.startsWith("+") ? "+" : "";
  return plus + raw.replace(/\D/g, "");
}

export function validateMemberLink({ phone, fullName }) {
  const errors = {};
  const fullNameValue = normalizePersonName(fullName);
  const phoneValue = normalizePhoneInput(phone);

  if (!fullNameValue) errors.fullName = "Enter your full name as registered by your gym.";
  else if (fullNameValue.length < 2) errors.fullName = "Enter your full name as registered by your gym.";
  else if (!/[a-z]/i.test(fullNameValue)) errors.fullName = "Enter the name your gym registered for you.";

  if (!phoneValue) errors.phone = "Enter the phone number your gym registered for you.";
  else if (!phoneValue.startsWith("+")) errors.phone = "Choose your country, then enter the full phone number.";
  else if (phoneValue.replace(/\D/g, "").length < 7) errors.phone = "That phone number looks too short.";

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    phone: phoneValue,
    fullName: fullNameValue,
  };
}