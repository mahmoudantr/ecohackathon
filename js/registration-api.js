export async function loadRegistrationConfig() {
  const response = await fetch('registration-config.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Registration configuration is unavailable. Please try again later.');
  const config = await response.json();
  if (!config.enabled) return null;
  const url = new URL(config.supabaseUrl);
  if (url.protocol !== 'https:' || !/^[a-z0-9-]+\.supabase\.co$/u.test(url.hostname) || url.pathname !== '/') throw new Error('Registration connection is not ready. Please contact the team.');
  if (!config.publishableKey) throw new Error('Registration connection is incomplete. Please contact the team.');
  return { ...config, supabaseUrl: url.origin };
}
export async function readApiResponse(response) {
  let body;
  try { body = await response.json(); } catch { throw new Error('The service returned an unexpected response. Your request could not be confirmed.'); }
  if (!response.ok) {
    const error = new Error(body.message || body.error_description || 'The request could not be completed. Please try again.');
    error.status = response.status;
    throw error;
  }
  return body;
}
