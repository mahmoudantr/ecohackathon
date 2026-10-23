const text = value => typeof value === 'string' ? value.trim().replace(/\s+/gu, ' ') : '';
export function validateRegistration(input) {
  const values = {
    fullName: text(input.fullName), email: text(input.email).toLowerCase(),
    phone: text(input.phone).replace(/[\s().-]/gu, '').replace(/^00/, '+'),
    university: text(input.university), major: text(input.major),
    age: typeof input.age === 'number' ? input.age : typeof input.age === 'string' && /^\d+$/u.test(input.age.trim()) ? Number(input.age) : NaN,
    consent: input.consent === true
  };
  const errors = {};
  for (const [name, label, max] of [['fullName','your full name',120],['university','your university',160],['major','your major',160]]) {
    if (values[name].length < 2 || values[name].length > max) errors[name] = `Enter ${label} (2–${max} characters).`;
  }
  if (values.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(values.email)) errors.email = 'Enter a valid email address.';
  if (!/^\+[1-9]\d{7,14}$/u.test(values.phone)) errors.phone = 'Include your country code, for example +201012345678.';
  if (!Number.isInteger(values.age) || values.age < 1 || values.age > 120) errors.age = 'Enter your age in whole years (1–120).';
  if (!values.consent) errors.consent = 'Please agree to the use of your details before submitting.';
  return { values, errors, valid: Object.keys(errors).length === 0 };
}
