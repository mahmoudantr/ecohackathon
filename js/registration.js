import { validateRegistration } from './registration-validation.mjs';
import { loadRegistrationConfig, readApiResponse } from './registration-api.js';
const form = document.querySelector('#registrationForm');
const status = document.querySelector('#registrationStatus');
const submit = document.querySelector('#submitRegistration');
const fields = ['fullName','email','phone','university','major','age','consent'];
let config;
let widget;
let token = '';
let sending = false;
function message(text, error = false) {
  status.hidden = !text;
  status.textContent = text;
  status.classList.toggle('is-error', error);
}
function updateSubmit() { submit.disabled = !config || (Boolean(config.turnstileSiteKey) && !token) || sending; }
function showErrors(errors) {
  fields.forEach(name => {
    const field = form.elements.namedItem(name);
    const error = document.querySelector(`#${name}Error`);
    error.textContent = errors[name] || '';
    if (errors[name]) {
      field.setAttribute('aria-invalid','true');
      field.setAttribute('aria-describedby', [name === 'phone' ? 'phoneHint' : name === 'age' ? 'ageHint' : '', `${name}Error`].filter(Boolean).join(' '));
    } else {
      field.removeAttribute('aria-invalid');
      field.setAttribute('aria-describedby', name === 'phone' ? 'phoneHint' : name === 'age' ? 'ageHint' : '');
    }
  });
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!config || sending) return;
  const data = Object.fromEntries(new FormData(form));
  data.consent = form.elements.consent.checked;
  const result = validateRegistration(data);
  showErrors(result.errors);
  if (!result.valid) { form.elements.namedItem(Object.keys(result.errors)[0]).focus(); return; }
  if (config.turnstileSiteKey && !token) { message('Please complete the security check, then try again.', true); return; }
  sending = true; updateSubmit(); submit.firstChild.textContent = 'Saving your details… ';
  message('Sending your details securely…');
  try {
    const response = await fetch(`${config.supabaseUrl}/functions/v1/register-interest`, {
      method:'POST', headers:{ 'Content-Type':'application/json', apikey:config.publishableKey },
      body:JSON.stringify({ ...result.values, website:data.website, captchaToken:token }), signal:AbortSignal.timeout(20000)
    });
    const body = await readApiResponse(response);
    if (body.saved !== true) throw new Error('Your registration could not be confirmed. Please try again.');
    form.reset(); form.hidden = true; message('');
    const success = document.querySelector('#registrationSuccess'); success.hidden = false; success.focus();
  } catch (error) {
    message(error.name === 'TimeoutError' ? 'The request timed out. Your details may have arrived; contact the team before sending again if you are unsure.' : error.message || 'Could not connect. Your submission has not been confirmed. Please try again.', true);
  } finally {
    sending = false; token = ''; submit.firstChild.textContent = 'Submit my interest ';
    if (window.turnstile && widget !== undefined) window.turnstile.reset(widget);
    updateSubmit();
  }
});
async function init() {
  try {
    config = await loadRegistrationConfig();
    if (!config) { message('Online registration is being connected. Your details have not been sent. Please contact info@ecohackathon.com for now.'); return; }
    message('Complete the form and security check to send your interest to the EcoHack team.');
    if (!config.turnstileSiteKey) { message('Complete the form to send your interest to the EcoHack organizing team.'); updateSubmit(); return; }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; script.async = true;
    script.onload = () => {
      widget = window.turnstile.render('#challenge', {
        sitekey: config.turnstileSiteKey, action:'ecohack-registration',
        callback:value => { token = value; updateSubmit(); },
        'expired-callback':() => { token = ''; updateSubmit(); },
        'error-callback':() => { token = ''; updateSubmit(); message('The security check could not load. Please check your connection and try again.', true); },
        theme:'light', size:'flexible'
      });
    };
    script.onerror = () => message('The security check is unavailable. Your details have not been sent. Please try again later.', true);
    document.head.append(script);
  } catch (error) { message(error.message || 'Registration is temporarily unavailable. Please contact the team.', true); }
}
init();
