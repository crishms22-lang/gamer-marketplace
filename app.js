const state = { token: localStorage.getItem('gm_token') || '', user: null, wallet: null, phone: '', currentView: 'home' };
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const dialog = $('#auth-dialog');
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function coins(n) { return `${Number(n || 0).toLocaleString('es-MX')} Coins`; }
function toast(message) {
  const el = $('#toast'); el.textContent = message; el.classList.add('show');
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 3500);
}
async function api(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(url, { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && state.token) logout(false);
    throw new Error(body.error || 'No se pudo completar la solicitud.');
  }
  return body;
}
function showView(name) {
  const allowed = ['home','explore','publish','contracts','coins','profile'];
  if (!allowed.includes(name)) name = 'home';
  state.currentView = name;
  $$('.view').forEach(el => el.classList.toggle('hidden', el.id !== `view-${name}`));
  $$('.mobile-nav [data-nav], .desktop-nav [data-nav]').forEach(el => el.classList.toggle('active', el.dataset.nav === name));
  if (name === 'explore') loadListings();
  if (name === 'coins') loadWallet();
  if (name === 'contracts') loadContracts();
  if (name === 'profile') loadProfile();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function openAuth() {
  $('#auth-message').textContent = '';
  $('#demo-code').classList.add('hidden');
  $('#request-code-form').classList.remove('hidden');
  $('#verify-form').classList.add('hidden');
  $('#register-form').classList.add('hidden');
  dialog.showModal();
}
function updateHeader() {
  $('#user-pill').textContent = state.user ? state.user.name : 'Invitado';
  $('#login-open').classList.toggle('hidden', !!state.user);
  $('#logout').classList.toggle('hidden', !state.user);
  $('#admin-area').classList.toggle('hidden', !state.user || !['owner','admin','moderator'].includes(state.user.role));
}
function logout(showMessage = true) {
  state.token = ''; state.user = null; state.wallet = null; localStorage.removeItem('gm_token');
  updateHeader();
  if (showMessage) toast('Sesión cerrada.');
  if (state.currentView === 'coins' || state.currentView === 'contracts' || state.currentView === 'profile') showView('home');
}
async function refreshMe() {
  if (!state.token) { updateHeader(); return; }
  try {
    const data = await api('/api/me'); state.user = data.user; state.wallet = data.wallet; updateHeader();
  } catch { logout(false); }
}
async function loadListings() {
  const grid = $('#listing-grid'); grid.innerHTML = '<div class="empty-state">Cargando servicios…</div>';
  const params = new URLSearchParams();
  if ($('#game-filter').value) params.set('game', $('#game-filter').value);
  if ($('#search-q').value.trim()) params.set('q', $('#search-q').value.trim());
  try {
    const data = await api(`/api/listings?${params}`);
    if (!data.listings.length) { grid.innerHTML = '<div class="empty-state">Todavía no hay servicios aprobados. ¡Puedes ser de los primeros en publicar!</div>'; return; }
    grid.innerHTML = data.listings.map(item => `<article class="listing-card">
      <div class="listing-top"><span class="game-tag">${escapeHtml(item.game)}</span><span class="price">${coins(item.price_coins)}</span></div>
      <h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p>
      <div class="listing-meta"><span>Por ${escapeHtml(item.seller_name)}</span><span>Nivel declarado: ${item.skill_level}/10</span></div>
      <div class="listing-meta"><span>Entrega: ${item.deadline_hours} h</span><span>Revisión manual ✓</span></div>
      <button class="btn btn-primary" data-contract="${item.id}">Contratar servicio</button></article>`).join('');
  } catch (e) { grid.innerHTML = `<div class="empty-state">${escapeHtml(e.message)}</div>`; }
}
async function loadWallet() {
  if (!state.user) { $('#wallet-summary').innerHTML = '<div class="panel">Inicia sesión para consultar tu saldo.</div>'; $('#ledger-list').textContent = 'Inicia sesión para ver tus movimientos.'; return; }
  try {
    const data = await api('/api/wallet'); state.wallet = data.wallet;
    $('#wallet-summary').innerHTML = `<div class="wallet-card"><span>Saldo total de prueba</span><strong>${coins(data.wallet.totalCoins)}</strong></div><div class="wallet-card"><span>Coins compradas (demo)</span><strong>${coins(data.wallet.purchasedCoins)}</strong></div><div class="wallet-card"><span>Coins ganadas</span><strong>${coins(data.wallet.earnedCoins)}</strong></div>`;
    $('#ledger-list').innerHTML = data.entries.length ? data.entries.map(row => `<div class="ledger-row"><div class="row-main"><strong>${escapeHtml(row.entry_type.replaceAll('_',' '))}</strong><small>${escapeHtml(row.reason)} · ${new Date(row.created_at).toLocaleString('es-MX')}</small></div><span class="${Number(row.amount)>=0?'amount-plus':'amount-minus'}">${Number(row.amount)>0?'+':''}${Number(row.amount).toLocaleString('es-MX')}</span></div>`).join('') : '<div class="empty-state">Aún no hay movimientos.</div>';
  } catch (e) { toast(e.message); }
}
function statusLabel(status) {
  return ({paid_held:'Pago retenido',in_progress:'En ejecución',delivered:'Entregado',completed:'Completado',cancel_requested:'Cancelación en revisión',cancelled:'Cancelado',disputed:'Disputa abierta',under_review:'Bajo revisión',appealed:'Apelado',refunded:'Reembolsado'})[status] || status;
}
async function loadContracts() {
  const root = $('#contract-list');
  if (!state.user) { root.innerHTML = '<div class="empty-state">Inicia sesión para ver tus contratos.</div>'; return; }
  root.innerHTML = '<div class="empty-state">Cargando contratos…</div>';
  try {
    const data = await api('/api/contracts');
    if (!data.contracts.length) { root.innerHTML = '<div class="empty-state">Todavía no tienes contratos. Explora servicios para empezar.</div>'; return; }
    root.innerHTML = data.contracts.map(c => {
      const buyer = Number(c.buyer_id) === Number(state.user.id);
      let actions = '';
      if (!buyer && ['paid_held'].includes(c.status)) actions += `<button class="btn btn-outline" data-contract-action="start" data-id="${c.id}">Iniciar</button>`;
      if (!buyer && ['paid_held','in_progress'].includes(c.status)) actions += `<button class="btn btn-outline" data-contract-action="deliver" data-id="${c.id}">Marcar entregado</button>`;
      if (buyer && c.status === 'delivered') actions += `<button class="btn btn-primary" data-contract-action="complete" data-id="${c.id}">Confirmar y calificar</button>`;
      if (['paid_held','in_progress','delivered'].includes(c.status)) actions += `<button class="btn btn-outline" data-contract-action="dispute" data-id="${c.id}">Abrir disputa</button><button class="btn btn-outline" data-contract-action="cancel" data-id="${c.id}">Solicitar cancelación</button>`;
      return `<article class="panel contract-row"><div class="row-main"><strong>${escapeHtml(c.listing_title)} <span class="status-tag ${c.status}">${escapeHtml(statusLabel(c.status))}</span></strong><small>${escapeHtml(c.game)} · ${buyer?'Proveedor: '+escapeHtml(c.seller_name):'Cliente: '+escapeHtml(c.buyer_name)}<br>Precio: ${coins(c.price_coins)} · Comisión: ${coins(c.commission_coins)} · Proveedor: ${coins(c.provider_coins)}<br>Creado: ${new Date(c.created_at).toLocaleString('es-MX')}</small>${c.delivery_note?`<p class="muted">Entrega: ${escapeHtml(c.delivery_note)}</p>`:''}<div class="contract-actions">${actions}</div></div></article>`;
    }).join('');
  } catch (e) { root.innerHTML = `<div class="empty-state">${escapeHtml(e.message)}</div>`; }
}
async function loadProfile() {
  if (!state.user) { $('#profile-card').textContent = 'Inicia sesión para ver tu perfil.'; return; }
  $('#profile-card').innerHTML = `<h3>${escapeHtml(state.user.name)}</h3><p class="muted">${escapeHtml(state.user.email)} · ${escapeHtml(state.user.phone)}</p><p>${escapeHtml(state.user.municipality)}, ${escapeHtml(state.user.region)}, ${escapeHtml(state.user.country)}</p><p class="muted">Cuenta: ${escapeHtml(state.user.role)} · Verificación telefónica: ${state.user.verified?'confirmada':'pendiente'}</p>`;
  if (['owner','admin','moderator'].includes(state.user.role)) loadAdmin();
}
async function loadAdmin() {
  try {
    const data = await api('/api/admin/overview');
    $('#admin-overview').innerHTML = `<div class="admin-stat"><span>Usuarios</span><strong>${data.users}</strong></div><div class="admin-stat"><span>Comisiones registradas</span><strong>${coins(data.totalCommissionCoins)}</strong></div><div class="admin-stat"><span>Fondo de bonificaciones</span><strong>${coins(data.bonusFundCoins)}</strong></div>`;
    const listings = await api('/api/admin/listings?status=pending');
    $('#admin-listings').innerHTML = listings.listings.length ? listings.listings.map(l => `<div class="admin-row"><div class="row-main"><strong>#${l.id} · ${escapeHtml(l.title)}</strong><small>${escapeHtml(l.game)} · ${coins(l.price_coins)} · ${escapeHtml(l.seller_name)}<br>${escapeHtml(l.description)}</small><div class="contract-actions"><button class="btn btn-primary" data-review="approve" data-id="${l.id}">Aprobar</button><button class="btn btn-outline" data-review="changes" data-id="${l.id}">Pedir cambios</button><button class="btn btn-outline" data-review="reject" data-id="${l.id}">Rechazar</button></div></div></div>`).join('') : '<div class="empty-state">No hay publicaciones pendientes.</div>';
    const disputes = await api('/api/admin/disputes');
    $('#admin-disputes').innerHTML = disputes.disputes.length ? disputes.disputes.map(d => `<div class="admin-row"><div class="row-main"><strong>Disputa #${d.id} · ${escapeHtml(d.listing_title)}</strong><small>${escapeHtml(d.reason)} · Contrato #${d.contract_id} · ${coins(d.price_coins)}</small><div class="contract-actions"><button class="btn btn-primary" data-decision="uphold_buyer" data-id="${d.id}">Reembolsar cliente</button><button class="btn btn-outline" data-decision="uphold_seller" data-id="${d.id}">Liberar proveedor</button></div></div></div>`).join('') : '<div class="empty-state">No hay disputas abiertas.</div>';
  } catch (e) { toast(e.message); }
}
async function submitRequestCode(form) {
  const phone = form.phone.value.trim();
  try {
    const data = await api('/api/auth/request-code', { method:'POST', body:JSON.stringify({ phone }) });
    state.phone = phone; $('#verify-form').classList.remove('hidden'); $('#request-code-form').classList.add('hidden');
    $('#auth-message').textContent = data.message || '';
    if (data.demoCode) { $('#demo-code').textContent = `Código demo: ${data.demoCode}`; $('#demo-code').classList.remove('hidden'); }
  } catch(e) { $('#auth-message').textContent = e.message; }
}
$('#request-code-form').addEventListener('submit', e => { e.preventDefault(); submitRequestCode(e.currentTarget); });
$('#verify-form').addEventListener('submit', async e => {
  e.preventDefault();
  const code = e.currentTarget.code.value.trim();
  try {
    const data = await api('/api/auth/verify-code', { method:'POST', body:JSON.stringify({phone:state.phone,code}) });
    if (data.needsProfile) {
      $('#verify-form').classList.add('hidden'); $('#register-form').classList.remove('hidden'); $('#auth-message').textContent = 'Teléfono verificado. Completa tu perfil.';
    } else {
      state.token = data.token; state.user = data.user; localStorage.setItem('gm_token',state.token); dialog.close(); updateHeader(); toast('¡Bienvenido!'); showView('profile');
    }
  } catch(err) { $('#auth-message').textContent = err.message; }
});
$('#register-form').addEventListener('submit', async e => {
  e.preventDefault(); const f = e.currentTarget;
  const body = { phone:state.phone, code:$('#verify-form [name="code"]').value.trim(), name:f.name.value.trim(), age:Number(f.age.value), country:f.country.value.trim(), region:f.region.value.trim(), municipality:f.municipality.value.trim(), email:f.email.value.trim() };
  try {
    const data = await api('/api/auth/register', { method:'POST', body:JSON.stringify(body) });
    state.token=data.token; state.user=data.user; localStorage.setItem('gm_token',state.token); dialog.close(); updateHeader(); toast('Cuenta creada.'); showView('profile');
  } catch(err) { $('#auth-message').textContent = err.message; }
});
$('#publish-form').addEventListener('submit', async e => {
  e.preventDefault(); if (!state.user) { openAuth(); toast('Inicia sesión para publicar.'); return; }
  const f=e.currentTarget; const body={game:f.game.value,title:f.title.value.trim(),description:f.description.value.trim(),skillLevel:Number(f.skillLevel.value),deliverables:f.deliverables.value.trim(),deadlineHours:Number(f.deadlineHours.value),conditions:f.conditions.value.trim(),priceCoins:Number(f.priceCoins.value)};
  try { const data=await api('/api/listings',{method:'POST',body:JSON.stringify(body)}); toast(data.message); f.reset(); showView('profile'); } catch(err){toast(err.message);}
});
$('#credit-form').addEventListener('submit', async e => {
  e.preventDefault(); const f=e.currentTarget; const body={userId:Number(f.userId.value),amount:Number(f.amount.value),reference:f.reference.value.trim(),idempotencyKey:f.idempotencyKey.value.trim(),reason:f.reason.value.trim()};
  try { const data=await api('/api/admin/wallet/credit',{method:'POST',body:JSON.stringify(body)}); toast(data.message); f.reset(); } catch(err){toast(err.message);}
});
document.addEventListener('click', async e => {
  const nav=e.target.closest('[data-nav]'); if(nav){e.preventDefault();showView(nav.dataset.nav);return;}
  if(e.target.closest('#login-open')) {openAuth();return;}
  if(e.target.closest('#logout')) {logout();return;}
  if(e.target.closest('[data-action="publish"]')) {if(!state.user){openAuth();toast('Inicia sesión o crea una cuenta para publicar.');}else showView('publish');return;}
  const buy=e.target.closest('[data-contract]'); if(buy){if(!state.user){openAuth();return;}if(!confirm('¿Crear el contrato con Coins de prueba? El saldo quedará retenido.'))return;try{const data=await api('/api/contracts',{method:'POST',body:JSON.stringify({listingId:Number(buy.dataset.contract)})});toast(data.message);showView('contracts');}catch(err){toast(err.message);}return;}
  const action=e.target.closest('[data-contract-action]'); if(action){const id=action.dataset.id;const kind=action.dataset.contractAction;try{
    if(kind==='start'){await api(`/api/contracts/${id}/start`,{method:'POST',body:'{}'});}
    if(kind==='deliver'){const note=prompt('Describe la entrega (mínimo 10 caracteres):');if(!note)return;const evidence=prompt('Enlace o referencia de evidencia (opcional):')||'';await api(`/api/contracts/${id}/deliver`,{method:'POST',body:JSON.stringify({note,evidence})});}
    if(kind==='complete'){const rating=Number(prompt('Califica de 1 a 5 estrellas:','5'));if(!Number.isInteger(rating)||rating<1||rating>5)return;const review=prompt('Reseña (opcional):')||'';await api(`/api/contracts/${id}/complete`,{method:'POST',body:JSON.stringify({rating,review})});}
    if(kind==='dispute'){const reason=prompt('Explica el problema (mínimo 10 caracteres):');if(!reason)return;const evidence=prompt('Enlace o referencia de evidencia (opcional):')||'';await api(`/api/contracts/${id}/disputes`,{method:'POST',body:JSON.stringify({reason,evidence})});}
    if(kind==='cancel'){const reason=prompt('Motivo de cancelación (mínimo 5 caracteres):');if(!reason)return;await api(`/api/contracts/${id}/cancel-request`,{method:'POST',body:JSON.stringify({reason})});}
    toast('Acción registrada.');loadContracts();
  }catch(err){toast(err.message);}return;}
  const review=e.target.closest('[data-review]');if(review){let reason='';if(review.dataset.review!=='approve'){reason=prompt('Motivo de la decisión:')||'';if(reason.length<5)return;}try{await api(`/api/admin/listings/${review.dataset.id}/review`,{method:'POST',body:JSON.stringify({action:review.dataset.review,reason})});toast('Revisión guardada.');loadAdmin();}catch(err){toast(err.message);}return;}
  const decision=e.target.closest('[data-decision]');if(decision){const reason=prompt('Motivo de la resolución (mínimo 10 caracteres):');if(!reason||reason.length<10)return;try{await api(`/api/admin/disputes/${decision.dataset.id}/decision`,{method:'POST',body:JSON.stringify({outcome:decision.dataset.decision,decision:reason})});toast('Resolución guardada.');loadAdmin();}catch(err){toast(err.message);}return;}
});
$('#search-btn').addEventListener('click',loadListings);
$('#game-filter').addEventListener('change',loadListings);
$('#search-q').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();loadListings();}});
$('#auth-dialog').addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
(async function init(){
  try{const config=await api('/api/config');if(!config.demoMode)$('#demo-banner').innerHTML='<strong>Verificación no configurada:</strong> no se pueden crear cuentas hasta integrar un proveedor SMS.';}catch{}
  await refreshMe(); showView('home');
})();
