import { loadRegistrationConfig, readApiResponse } from './registration-api.js';
const status = document.querySelector('#adminStatus');
const loginPanel = document.querySelector('#loginPanel');
const dashboard = document.querySelector('#dashboard');
const loginForm = document.querySelector('#loginForm');
const logoutButton = document.querySelector('#logout');
const pageSize = 50;
let config, token, expiresAt, refreshToken;
let page = 0, total = 0, rows = [], query = '', requestId = 0, searchTimer;
function message(text, error = false) { status.textContent = text; status.hidden = !text; status.classList.toggle('is-error', error); }
function clearSession() {
  ++requestId; token = undefined; refreshToken = undefined; expiresAt = undefined; rows = []; page = 0; total = 0;
  document.querySelector('#registrationRows').replaceChildren();
  document.querySelector('#registrationSearch').value = ''; query = '';
  loginForm.reset(); document.querySelector('#setupCodeForm').reset(); document.querySelector('#passwordForm').reset(); document.querySelector('#passwordPanel').hidden = true; loginPanel.hidden = false; dashboard.hidden = true; logoutButton.hidden = true;
}
async function authRequest(path, body) {
  return readApiResponse(await fetch(`${config.supabaseUrl}/auth/v1/${path}`, {
    method:'POST', headers:{ apikey:config.publishableKey, 'Content-Type':'application/json' }, body:JSON.stringify(body), signal:AbortSignal.timeout(20000)
  }));
}
function applySession(session) { token = session.access_token; refreshToken = session.refresh_token; expiresAt = Date.now() + session.expires_in * 1000; }
async function ensureSession() {
  if (!token) throw new Error('Please sign in again.');
  if (Date.now() >= expiresAt - 30000) applySession(await authRequest('token?grant_type=refresh_token', { refresh_token:refreshToken }));
}
async function authorizedFetch(path) {
  await ensureSession();
  const response = await fetch(`${config.supabaseUrl}/rest/v1/${path}`, { headers:{ apikey:config.publishableKey, Authorization:`Bearer ${token}`, Prefer:'count=exact' }, cache:'no-store', signal:AbortSignal.timeout(20000) });
  const body = await readApiResponse(response);
  return { body, range:response.headers.get('content-range') };
}
async function loadRows() {
  const id = ++requestId;
  document.querySelector('#exportRows').disabled = true;
  document.querySelector('#nextPage').disabled = true; document.querySelector('#previousPage').disabled = true;
  message('Loading registrations…');
  const params = new URLSearchParams({ select:'id,created_at,full_name,email,phone,university,major,age', order:'created_at.desc,id.desc', limit:String(pageSize), offset:String(page * pageSize) });
  const term = query.replace(/[^\p{L}\p{N}@ +_-]/gu,'').trim();
  if (term) params.set('or',`(full_name.ilike.*${term}*,email.ilike.*${term}*,university.ilike.*${term}*,major.ilike.*${term}*)`);
  try {
    const { body, range } = await authorizedFetch(`registrations?${params}`);
    if (id !== requestId) return;
    if (!Array.isArray(body)) throw new Error('The registration data could not be read.');
    rows = body; total = Number(range?.split('/')[1]) || 0;
    const container = document.querySelector('#registrationRows'); container.replaceChildren();
    rows.forEach(row => {
      const tr = document.createElement('tr');
      [row.full_name,row.email,row.phone,row.university,row.major,row.age,new Date(row.created_at).toLocaleString()].forEach(value => { const td = document.createElement('td'); td.textContent = String(value); tr.append(td); });
      container.append(tr);
    });
    document.querySelector('#resultCount').textContent = `${total} registration${total === 1 ? '' : 's'}${query ? ' matching your search' : ''}`;
    document.querySelector('#pageNumber').textContent = `Page ${page + 1} of ${Math.max(1,Math.ceil(total / pageSize))}`;
    document.querySelector('#emptyState').hidden = rows.length !== 0;
    document.querySelector('#previousPage').disabled = page === 0;
    document.querySelector('#nextPage').disabled = (page + 1) * pageSize >= total;
    document.querySelector('#exportRows').disabled = rows.length === 0;
    message('');
  } catch (error) {
    if (id !== requestId) return;
    if ([401,403].includes(error.status)) { clearSession(); message('Your session ended or access was removed. Please sign in again.', true); }
    else { rows = []; document.querySelector('#registrationRows').replaceChildren(); message('Could not load requests. Please check your connection and refresh.', true); }
  }
}
loginForm.addEventListener('submit', async event => {
  event.preventDefault(); if (!config) return;
  const button = document.querySelector('#loginButton'); button.disabled = true; message('Signing in…');
  try {
    const data = new FormData(loginForm);
    const session = await authRequest('token?grant_type=password', { email:data.get('email'), password:data.get('password') });
    if (!session.access_token) throw new Error('Sign in failed.');
    applySession(session); loginForm.reset();
    const admin = await authorizedFetch('registration_admins?select=user_id&limit=1');
    if (!Array.isArray(admin.body) || admin.body.length !== 1) { await signOut(false); throw new Error('This account does not have organizer access.'); }
    loginPanel.hidden = true; dashboard.hidden = false; logoutButton.hidden = false;
    await loadRows();
  } catch (error) { clearSession(); message(error.message === 'This account does not have organizer access.' ? error.message : 'Unable to sign in. Check your organizer email and password, then try again.', true); }
  finally { button.disabled = !config; }
});
async function signOut(showMessage = true) {
  const previous = token; clearSession();
  if (previous) {
    try { await fetch(`${config.supabaseUrl}/auth/v1/logout?scope=local`, { method:'POST', headers:{ apikey:config.publishableKey, Authorization:`Bearer ${previous}` }, signal:AbortSignal.timeout(10000) }); }
    catch { /* Local credentials are already discarded, including when offline. */ }
  }
  if (showMessage) message('You have signed out.');
}
logoutButton.addEventListener('click', () => signOut());
document.querySelector('#previousPage').addEventListener('click', () => { if (page > 0) { --page; loadRows(); } });
document.querySelector('#nextPage').addEventListener('click', () => { if ((page + 1) * pageSize < total) { ++page; loadRows(); } });
document.querySelector('#refreshRows').addEventListener('click', loadRows);
document.querySelector('#registrationSearch').addEventListener('input', event => { clearTimeout(searchTimer); query = event.target.value; ++requestId; document.querySelector('#exportRows').disabled = true; searchTimer = setTimeout(() => { page = 0; loadRows(); }, 300); });
function csvCell(value) { let text = String(value ?? ''); if (/^[\s]*[=+\-@]/u.test(text)) text = `'${text}`; return `"${text.replaceAll('"','""')}"`; }
document.querySelector('#exportRows').addEventListener('click', () => {
  if (!token || !rows.length) return;
  const data = [['Name','Email','Phone','University','Major','Age','Received'], ...rows.map(row => [row.full_name,row.email,row.phone,row.university,row.major,row.age,row.created_at])];
  const blob = new Blob(['\uFEFF' + data.map(row => row.map(csvCell).join(',')).join('\r\n')], { type:'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `ecohack-registrations-page-${page + 1}.csv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
window.addEventListener('pagehide', clearSession);
(async () => { try { config = await loadRegistrationConfig(); if (!config) { message('The private dashboard is being connected. No registration data is available here yet.'); return; } document.querySelector('#loginButton').disabled = false; document.querySelector('#verifySetupButton').disabled = false; message('Sign in to access registration requests.'); } catch { message('The dashboard connection is unavailable. Please try again later.', true); } })();

// First access uses a short-lived code; the owner enters the new password personally.
document.querySelector('#setupToggle').addEventListener('click', () => {
  const setup = document.querySelector('#setupCodeForm');
  setup.hidden = !setup.hidden; loginForm.hidden = !setup.hidden;
  document.querySelector('#setupToggle').textContent = setup.hidden ? 'Use a one-time setup code ↗' : 'Use email and password ↗';
});
document.querySelector('#setupCodeForm').addEventListener('submit', async event => {
  event.preventDefault(); if (!config) return;
  const button = document.querySelector('#verifySetupButton'); button.disabled = true; message('Verifying your private setup code…');
  try {
    const session = await authRequest('verify', { email:document.querySelector('#setupEmail').value.trim(), token:document.querySelector('#setupCode').value.trim(), type:'recovery' });
    if (!session.access_token) throw new Error('Setup code could not be verified.');
    applySession(session);
    const admin = await authorizedFetch('registration_admins?select=user_id&limit=1');
    if (!admin.body?.length) { await signOut(false); throw new Error('Organizer access is unavailable.'); }
    document.querySelector('#setupCodeForm').reset(); loginPanel.hidden = true; document.querySelector('#passwordPanel').hidden = false; logoutButton.hidden = false;
    message('Code accepted. Choose your own password to complete account setup.'); document.querySelector('#newPassword').focus();
  } catch { clearSession(); message('The setup code is incorrect or expired. Request a new private setup code from the project owner.', true); }
  finally { button.disabled = !config; }
});
document.querySelector('#passwordForm').addEventListener('submit', async event => {
  event.preventDefault();
  const password = document.querySelector('#newPassword').value;
  if (password !== document.querySelector('#confirmPassword').value) { message('The passwords do not match.', true); document.querySelector('#confirmPassword').focus(); return; }
  const button = document.querySelector('#savePassword'); button.disabled = true; message('Saving your password…');
  try {
    await ensureSession();
    await readApiResponse(await fetch(`${config.supabaseUrl}/auth/v1/user`, { method:'PUT',headers:{apikey:config.publishableKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({password}),signal:AbortSignal.timeout(20000) }));
    document.querySelector('#passwordForm').reset(); document.querySelector('#passwordPanel').hidden = true; dashboard.hidden = false; await loadRows();
  } catch { message('Could not save your password. Check the connection and try again.', true); }
  finally { button.disabled = false; }
});
