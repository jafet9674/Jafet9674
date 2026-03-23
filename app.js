// ── Datos iniciales de demostración ──────────────────────────
const DEMO_AUDIENCES = [
  { id: 'a1', name: 'Clientes Premium', desc: 'Clientes con mayor LTV y frecuencia de compra', status: 'active', color: '#3b82f6', tags: ['vip', 'retention'], createdAt: '2025-10-01' },
  { id: 'a2', name: 'Leads Calientes',  desc: 'Prospectos que abrieron más de 3 emails este mes', status: 'active', color: '#22c55e', tags: ['email', 'lead'], createdAt: '2025-11-15' },
  { id: 'a3', name: 'Retargeting Web',  desc: 'Visitantes que no completaron la compra', status: 'active', color: '#a855f7', tags: ['retargeting', 'ads'], createdAt: '2025-12-01' },
  { id: 'a4', name: 'Inactivos 90d',    desc: 'Usuarios sin actividad en los últimos 90 días', status: 'inactive', color: '#ef4444', tags: ['reactivacion'], createdAt: '2026-01-10' },
  { id: 'a5', name: 'Newsletter',       desc: 'Suscriptores al boletín semanal', status: 'active', color: '#f97316', tags: ['email', 'newsletter'], createdAt: '2026-02-01' },
];

const DEMO_CONTACTS = [
  { id: 'c1',  name: 'María',    lastname: 'González',  email: 'maria.gonzalez@email.com',   phone: '+52 55 1111 2222', audiences: ['a1','a2'], tags: ['vip','lead'], status: 'subscribed',   createdAt: '2025-10-05' },
  { id: 'c2',  name: 'Carlos',   lastname: 'Ramírez',   email: 'carlos.ramirez@gmail.com',   phone: '+52 55 3333 4444', audiences: ['a2','a3'], tags: ['lead'],       status: 'subscribed',   createdAt: '2025-11-18' },
  { id: 'c3',  name: 'Sofía',    lastname: 'López',     email: 'sofia.lopez@empresa.mx',     phone: '+52 81 5555 6666', audiences: ['a1','a5'], tags: ['vip'],        status: 'subscribed',   createdAt: '2025-12-03' },
  { id: 'c4',  name: 'Andrés',   lastname: 'Martínez',  email: 'andres.m@outlook.com',       phone: '',                  audiences: ['a4'],      tags: ['inactivo'],   status: 'unsubscribed', createdAt: '2026-01-12' },
  { id: 'c5',  name: 'Lucía',    lastname: 'Hernández', email: 'lucia.h@correo.com',         phone: '+52 33 7777 8888', audiences: ['a3','a5'], tags: ['retargeting'],$status: 'subscribed',  createdAt: '2026-01-20' },
  { id: 'c6',  name: 'Roberto',  lastname: 'Torres',    email: 'roberto.torres@biz.com',     phone: '+52 55 9999 0000', audiences: ['a1'],      tags: ['vip','email'],$status: 'subscribed',  createdAt: '2026-02-05' },
  { id: 'c7',  name: 'Valentina',lastname: 'Díaz',      email: 'vale.diaz@email.com',        phone: '+52 55 1234 5678', audiences: ['a2','a5'], tags: ['lead','newsletter'], status: 'subscribed', createdAt: '2026-02-14' },
  { id: 'c8',  name: 'Miguel',   lastname: 'Sánchez',   email: 'miguel.s@gmail.com',         phone: '',                  audiences: ['a3'],      tags: ['ads'],        status: 'subscribed',   createdAt: '2026-02-28' },
  { id: 'c9',  name: 'Isabella', lastname: 'Morales',   email: 'isa.morales@empresa.com',    phone: '+52 81 2345 6789', audiences: ['a1','a2','a3'], tags: ['vip','lead'], status: 'subscribed', createdAt: '2026-03-01' },
  { id: 'c10', name: 'Diego',    lastname: 'Jiménez',   email: 'diego.jimenez@correo.mx',    phone: '+52 33 3456 7890', audiences: ['a5'],      tags: ['newsletter'], status: 'subscribed',   createdAt: '2026-03-10' },
];

// ── Estado ───────────────────────────────────────────────────
let audiences = JSON.parse(localStorage.getItem('am_audiences') || 'null') || JSON.parse(JSON.stringify(DEMO_AUDIENCES));
let contacts  = JSON.parse(localStorage.getItem('am_contacts')  || 'null') || JSON.parse(JSON.stringify(DEMO_CONTACTS));

let editingAudId  = null;
let editingConId  = null;
let deleteTarget  = null; // { type, id }
let audChart      = null;
let growthChart   = null;

// ── Persistencia ─────────────────────────────────────────────
function save() {
  localStorage.setItem('am_audiences', JSON.stringify(audiences));
  localStorage.setItem('am_contacts',  JSON.stringify(contacts));
}

// ── Utilidades ───────────────────────────────────────────────
function uid() { return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function initials(name, last) { return ((name[0] || '') + (last[0] || '')).toUpperCase() || '?'; }
function todayISO() { return new Date().toISOString().split('T')[0]; }

function parseTags(str) {
  return str.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
}

function contactCount(audId) {
  return contacts.filter(c => c.audiences && c.audiences.includes(audId)).length;
}

// ── Navigation ───────────────────────────────────────────────
const VIEWS = {
  dashboard: { title: 'Dashboard',  sub: 'Resumen de audiencias',    showAdd: false },
  audiences: { title: 'Audiencias', sub: 'Gestiona tus segmentos',   showAdd: true  },
  contacts:  { title: 'Contactos',  sub: 'Administra tus contactos', showAdd: true  },
  analytics: { title: 'Análisis',   sub: 'Estadísticas y métricas',  showAdd: false },
};

let currentView = 'dashboard';

function switchView(name) {
  if (!VIEWS[name]) return;
  currentView = name;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === name);
  });
  document.getElementById('view-' + name).classList.add('active');
  document.getElementById('view-title').textContent = VIEWS[name].title;
  document.getElementById('header-sub').textContent  = VIEWS[name].sub;
  const fab = document.getElementById('header-action-btn');
  fab.style.display = VIEWS[name].showAdd ? 'flex' : 'none';
  renderView(name);
}

function renderView(name) {
  if (name === 'dashboard') renderDashboard();
  if (name === 'audiences') renderAudiences();
  if (name === 'contacts')  renderContacts();
  if (name === 'analytics') renderAnalytics();
}

// ── Dashboard ────────────────────────────────────────────────
function renderDashboard() {
  const allTags = [...new Set([
    ...audiences.flatMap(a => a.tags || []),
    ...contacts.flatMap(c => c.tags || []),
  ])];

  document.getElementById('kpi-audiences').textContent = audiences.length;
  document.getElementById('kpi-contacts').textContent  = contacts.length;
  document.getElementById('kpi-tags').textContent      = allTags.length;
  document.getElementById('kpi-active').textContent    = audiences.filter(a => a.status === 'active').length;

  // Top audiences by contact count
  const sorted = [...audiences].sort((a, b) => contactCount(b.id) - contactCount(a.id)).slice(0, 5);
  const topEl = document.getElementById('top-audiences-list');
  if (sorted.length === 0) {
    topEl.innerHTML = '<p class="empty-msg">Sin audiencias aún.</p>';
  } else {
    topEl.innerHTML = sorted.map(a => `
      <div class="mini-aud-card">
        <div class="mini-dot" style="background:${esc(a.color)}">${esc(a.name[0])}</div>
        <span class="mini-name">${esc(a.name)}</span>
        <span class="mini-count">${contactCount(a.id)} contactos</span>
      </div>`).join('');
  }

  // Recent contacts
  const recent = [...contacts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const recEl = document.getElementById('recent-contacts-list');
  if (recent.length === 0) {
    recEl.innerHTML = '<p class="empty-msg">Sin contactos aún.</p>';
  } else {
    recEl.innerHTML = recent.map(c => `
      <div class="mini-contact-card">
        <div class="mini-avatar">${initials(c.name, c.lastname)}</div>
        <div class="mini-contact-info">
          <div class="mini-contact-name">${esc(c.name)} ${esc(c.lastname)}</div>
          <div class="mini-contact-email">${esc(c.email)}</div>
        </div>
      </div>`).join('');
  }
}

// ── Audiences List ───────────────────────────────────────────
function renderAudiences() {
  const query  = (document.getElementById('audience-search')?.value || '').toLowerCase();
  const status = document.getElementById('audience-filter-status')?.value || 'all';

  let list = audiences.filter(a => {
    const matchQ = !query || a.name.toLowerCase().includes(query) || (a.desc || '').toLowerCase().includes(query) || (a.tags || []).some(t => t.includes(query));
    const matchS = status === 'all' || a.status === status;
    return matchQ && matchS;
  });

  const el = document.getElementById('audiences-list');
  if (list.length === 0) {
    el.innerHTML = '<p class="empty-msg">No se encontraron audiencias.</p>';
    return;
  }

  el.innerHTML = list.map(a => {
    const cnt  = contactCount(a.id);
    const tags = (a.tags || []).map(t => `<span class="tag-pill">${esc(t)}</span>`).join('');
    const badge = a.status === 'active'
      ? '<span class="status-badge status-active">● Activa</span>'
      : '<span class="status-badge status-inactive">● Inactiva</span>';
    return `
      <div class="audience-card">
        <div class="aud-dot" style="background:${esc(a.color)}">${esc(a.name[0])}</div>
        <div class="aud-info">
          <div class="aud-name">${esc(a.name)}</div>
          <div class="aud-meta">${esc(a.desc || 'Sin descripción')}</div>
          ${badge}
          ${tags ? `<div class="aud-tags">${tags}</div>` : ''}
        </div>
        <div class="aud-count">
          <div class="aud-count-num">${cnt}</div>
          <div class="aud-count-label">contactos</div>
        </div>
        <div class="card-actions">
          <button class="btn-icon-sm" onclick="openEditAudience('${a.id}')" title="Editar">✏️</button>
          <button class="btn-icon-sm delete" onclick="openDeleteModal('audience','${a.id}')" title="Eliminar">🗑️</button>
        </div>
      </div>`;
  }).join('');
}

// ── Contacts List ────────────────────────────────────────────
function renderContacts() {
  const query  = (document.getElementById('contact-search')?.value || '').toLowerCase();
  const audId  = document.getElementById('contact-filter-audience')?.value || 'all';

  // Populate audience filter dropdown
  const audSel = document.getElementById('contact-filter-audience');
  if (audSel) {
    const prev = audSel.value;
    audSel.innerHTML = '<option value="all">Todas las audiencias</option>';
    audiences.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = a.name;
      audSel.appendChild(opt);
    });
    if ([...audSel.options].some(o => o.value === prev)) audSel.value = prev;
  }

  let list = contacts.filter(c => {
    const fullName = `${c.name} ${c.lastname}`.toLowerCase();
    const matchQ = !query || fullName.includes(query) || c.email.toLowerCase().includes(query) || (c.tags || []).some(t => t.includes(query));
    const matchA = audId === 'all' || (c.audiences || []).includes(audId);
    return matchQ && matchA;
  });

  const el = document.getElementById('contacts-list');
  if (list.length === 0) {
    el.innerHTML = '<p class="empty-msg">No se encontraron contactos.</p>';
    return;
  }

  el.innerHTML = list.map(c => {
    const tags = (c.tags || []).map(t => `<span class="tag-pill">${esc(t)}</span>`).join('');
    const statusBadge = c.status === 'subscribed'
      ? '<span class="tag-pill" style="background:rgba(34,197,94,0.15);color:var(--green)">Suscrito</span>'
      : '<span class="tag-pill" style="background:rgba(148,163,184,0.15);color:var(--muted)">No suscrito</span>';
    const audNames = (c.audiences || []).map(id => {
      const a = audiences.find(x => x.id === id);
      return a ? `<span class="tag-pill" style="background:${a.color}22;color:${a.color}">${esc(a.name)}</span>` : '';
    }).join('');
    return `
      <div class="contact-card">
        <div class="contact-avatar">${initials(c.name, c.lastname)}</div>
        <div class="contact-info">
          <div class="contact-name">${esc(c.name)} ${esc(c.lastname)}</div>
          <div class="contact-email">${esc(c.email)}</div>
          <div class="contact-tags" style="margin-top:6px">${statusBadge}${audNames}${tags}</div>
        </div>
        <div class="card-actions">
          <button class="btn-icon-sm" onclick="openEditContact('${c.id}')" title="Editar">✏️</button>
          <button class="btn-icon-sm delete" onclick="openDeleteModal('contact','${c.id}')" title="Eliminar">🗑️</button>
        </div>
      </div>`;
  }).join('');
}

// ── Analytics ────────────────────────────────────────────────
function renderAnalytics() {
  renderAudienceChart();
  renderTagStats();
  renderGrowthChart();
}

function renderAudienceChart() {
  const canvas = document.getElementById('audienceChart');
  const emptyEl = document.getElementById('chart-empty-1');

  const data = audiences.map(a => ({ name: a.name, color: a.color, count: contactCount(a.id) }))
    .filter(d => d.count > 0);

  if (data.length === 0) {
    canvas.style.display = 'none';
    emptyEl.style.display = 'block';
    if (audChart) { audChart.destroy(); audChart = null; }
    return;
  }
  canvas.style.display = 'block';
  emptyEl.style.display = 'none';

  if (audChart) audChart.destroy();
  audChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.name),
      datasets: [{
        data: data.map(d => d.count),
        backgroundColor: data.map(d => d.color),
        borderWidth: 0,
      }],
    },
    options: {
      plugins: {
        legend: { labels: { color: '#f1f5f9', font: { size: 11 }, padding: 12, boxWidth: 12 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.raw} contactos` } },
      },
      cutout: '55%',
    },
  });
}

function renderTagStats() {
  const tagMap = {};
  contacts.forEach(c => {
    (c.tags || []).forEach(t => { tagMap[t] = (tagMap[t] || 0) + 1; });
  });

  const sorted = Object.entries(tagMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const max = sorted[0]?.[1] || 1;
  const el = document.getElementById('tag-stats-list');

  if (sorted.length === 0) {
    el.innerHTML = '<p class="empty-msg">Sin etiquetas aún.</p>';
    return;
  }

  el.innerHTML = sorted.map(([tag, cnt]) => `
    <div class="tag-stat-row">
      <span class="tag-stat-name">#${esc(tag)}</span>
      <div class="tag-stat-bar-wrap">
        <div class="tag-stat-bar" style="width:${(cnt / max * 100).toFixed(1)}%"></div>
      </div>
      <span class="tag-stat-count">${cnt}</span>
    </div>`).join('');
}

function renderGrowthChart() {
  const canvas = document.getElementById('growthChart');
  const emptyEl = document.getElementById('chart-empty-2');
  const now = new Date();

  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleDateString('es-MX', { month: 'short' }),
    });
  }

  const audCounts = months.map(m => audiences.filter(a => {
    const d = new Date(a.createdAt + 'T00:00:00');
    return d.getFullYear() === m.year && d.getMonth() === m.month;
  }).length);

  const conCounts = months.map(m => contacts.filter(c => {
    const d = new Date(c.createdAt + 'T00:00:00');
    return d.getFullYear() === m.year && d.getMonth() === m.month;
  }).length);

  const hasData = audCounts.some(v => v > 0) || conCounts.some(v => v > 0);

  if (!hasData) {
    canvas.style.display = 'none';
    emptyEl.style.display = 'block';
    if (growthChart) { growthChart.destroy(); growthChart = null; }
    return;
  }
  canvas.style.display = 'block';
  emptyEl.style.display = 'none';

  if (growthChart) growthChart.destroy();
  growthChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: months.map(m => m.label),
      datasets: [
        { label: 'Audiencias', data: audCounts, backgroundColor: 'rgba(59,130,246,0.7)', borderRadius: 6 },
        { label: 'Contactos',  data: conCounts, backgroundColor: 'rgba(168,85,247,0.7)', borderRadius: 6 },
      ],
    },
    options: {
      plugins: { legend: { labels: { color: '#f1f5f9', font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
        y: { ticks: { color: '#94a3b8', stepSize: 1 }, grid: { color: '#334155' }, beginAtZero: true },
      },
    },
  });
}

// ── Audience Modal ───────────────────────────────────────────
function openNewAudience() {
  editingAudId = null;
  document.getElementById('modal-audience-title').textContent = 'Nueva Audiencia';
  document.getElementById('aud-name').value  = '';
  document.getElementById('aud-desc').value  = '';
  document.getElementById('aud-tags').value  = '';
  document.getElementById('aud-status').value = 'active';
  document.getElementById('aud-color').value  = '#3b82f6';
  setToggle('modal-audience', 'aud-status', 'active');
  setColorPicker('#3b82f6');
  openModal('modal-audience');
}

function openEditAudience(id) {
  const a = audiences.find(x => x.id === id);
  if (!a) return;
  editingAudId = id;
  document.getElementById('modal-audience-title').textContent = 'Editar Audiencia';
  document.getElementById('aud-name').value   = a.name;
  document.getElementById('aud-desc').value   = a.desc || '';
  document.getElementById('aud-tags').value   = (a.tags || []).join(', ');
  document.getElementById('aud-status').value = a.status;
  document.getElementById('aud-color').value  = a.color;
  setToggle('modal-audience', 'aud-status', a.status);
  setColorPicker(a.color);
  openModal('modal-audience');
}

document.getElementById('audience-form').addEventListener('submit', e => {
  e.preventDefault();
  const name   = document.getElementById('aud-name').value.trim();
  const desc   = document.getElementById('aud-desc').value.trim();
  const status = document.getElementById('aud-status').value;
  const color  = document.getElementById('aud-color').value;
  const tags   = parseTags(document.getElementById('aud-tags').value);

  if (!name) return;

  if (editingAudId) {
    const idx = audiences.findIndex(a => a.id === editingAudId);
    if (idx !== -1) audiences[idx] = { ...audiences[idx], name, desc, status, color, tags };
    toast('Audiencia actualizada');
  } else {
    audiences.unshift({ id: uid(), name, desc, status, color, tags, createdAt: todayISO() });
    toast('Audiencia creada', 'info');
  }

  save();
  closeModal('modal-audience');
  renderView(currentView);
});

// ── Contact Modal ────────────────────────────────────────────
function openNewContact() {
  editingConId = null;
  document.getElementById('modal-contact-title').textContent = 'Nuevo Contacto';
  document.getElementById('con-name').value     = '';
  document.getElementById('con-lastname').value = '';
  document.getElementById('con-email').value    = '';
  document.getElementById('con-phone').value    = '';
  document.getElementById('con-tags').value     = '';
  document.getElementById('con-status').value   = 'subscribed';
  setToggle('modal-contact', 'con-status', 'subscribed');
  buildAudienceCheckboxes([]);
  openModal('modal-contact');
}

function openEditContact(id) {
  const c = contacts.find(x => x.id === id);
  if (!c) return;
  editingConId = id;
  document.getElementById('modal-contact-title').textContent = 'Editar Contacto';
  document.getElementById('con-name').value     = c.name;
  document.getElementById('con-lastname').value = c.lastname;
  document.getElementById('con-email').value    = c.email;
  document.getElementById('con-phone').value    = c.phone || '';
  document.getElementById('con-tags').value     = (c.tags || []).join(', ');
  document.getElementById('con-status').value   = c.status;
  setToggle('modal-contact', 'con-status', c.status);
  buildAudienceCheckboxes(c.audiences || []);
  openModal('modal-contact');
}

function buildAudienceCheckboxes(selected) {
  const wrap = document.getElementById('con-audiences-checkboxes');
  if (audiences.length === 0) {
    wrap.innerHTML = '<p style="font-size:0.82rem;color:var(--muted)">No hay audiencias disponibles.</p>';
    return;
  }
  wrap.innerHTML = audiences.map(a => `
    <label class="checkbox-item">
      <input type="checkbox" value="${a.id}" ${selected.includes(a.id) ? 'checked' : ''} />
      <span style="display:flex;align-items:center;gap:6px">
        <span style="width:10px;height:10px;border-radius:50%;background:${a.color};display:inline-block"></span>
        ${esc(a.name)}
      </span>
    </label>`).join('');
}

document.getElementById('contact-form').addEventListener('submit', e => {
  e.preventDefault();
  const name     = document.getElementById('con-name').value.trim();
  const lastname = document.getElementById('con-lastname').value.trim();
  const email    = document.getElementById('con-email').value.trim();
  const phone    = document.getElementById('con-phone').value.trim();
  const status   = document.getElementById('con-status').value;
  const tags     = parseTags(document.getElementById('con-tags').value);
  const checked  = [...document.querySelectorAll('#con-audiences-checkboxes input:checked')].map(i => i.value);

  if (!name || !email) return;

  if (editingConId) {
    const idx = contacts.findIndex(c => c.id === editingConId);
    if (idx !== -1) contacts[idx] = { ...contacts[idx], name, lastname, email, phone, status, tags, audiences: checked };
    toast('Contacto actualizado');
  } else {
    contacts.unshift({ id: uid(), name, lastname, email, phone, status, tags, audiences: checked, createdAt: todayISO() });
    toast('Contacto agregado', 'info');
  }

  save();
  closeModal('modal-contact');
  renderView(currentView);
});

// ── Delete Modal ─────────────────────────────────────────────
function openDeleteModal(type, id) {
  deleteTarget = { type, id };
  const name = type === 'audience'
    ? audiences.find(a => a.id === id)?.name
    : `${contacts.find(c => c.id === id)?.name} ${contacts.find(c => c.id === id)?.lastname}`;
  document.getElementById('delete-msg').textContent = `¿Eliminar "${name}"? Esta acción no se puede deshacer.`;
  openModal('modal-delete');
}

document.getElementById('confirm-delete').addEventListener('click', () => {
  if (!deleteTarget) return;
  if (deleteTarget.type === 'audience') {
    audiences = audiences.filter(a => a.id !== deleteTarget.id);
    contacts.forEach(c => { c.audiences = (c.audiences || []).filter(id => id !== deleteTarget.id); });
    toast('Audiencia eliminada', 'error');
  } else {
    contacts = contacts.filter(c => c.id !== deleteTarget.id);
    toast('Contacto eliminado', 'error');
  }
  deleteTarget = null;
  save();
  closeModal('modal-delete');
  renderView(currentView);
});

// ── Modal Helpers ────────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function setToggle(modalId, hiddenId, value) {
  const modal = document.getElementById(modalId);
  modal.querySelectorAll('.toggle-opt').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === value);
  });
  document.getElementById(hiddenId).value = value;
}

function setColorPicker(color) {
  document.querySelectorAll('.color-dot').forEach(dot => {
    dot.classList.toggle('selected', dot.dataset.color === color);
  });
}

// ── Toggle Groups ────────────────────────────────────────────
document.querySelectorAll('.toggle-group').forEach(group => {
  group.addEventListener('click', e => {
    const btn = e.target.closest('.toggle-opt');
    if (!btn) return;
    group.querySelectorAll('.toggle-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // Update hidden input in same form-group
    const hiddenInput = group.closest('.form-group')?.querySelector('input[type="hidden"]');
    if (hiddenInput) hiddenInput.value = btn.dataset.value;
  });
});

// ── Color Picker ─────────────────────────────────────────────
document.getElementById('aud-color-picker').addEventListener('click', e => {
  const dot = e.target.closest('.color-dot');
  if (!dot) return;
  document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
  dot.classList.add('selected');
  document.getElementById('aud-color').value = dot.dataset.color;
});

// ── Close modals ─────────────────────────────────────────────
['close-audience-modal','cancel-audience'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', () => closeModal('modal-audience'));
});
['close-contact-modal','cancel-contact'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', () => closeModal('modal-contact'));
});
['close-delete-modal','cancel-delete'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', () => closeModal('modal-delete'));
});

// Close on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.add('hidden');
  });
});

// ── FAB / Add Button ─────────────────────────────────────────
document.getElementById('header-action-btn').addEventListener('click', () => {
  if (currentView === 'audiences') openNewAudience();
  if (currentView === 'contacts')  openNewContact();
});

// ── Navigation Listeners ─────────────────────────────────────
document.querySelectorAll('.nav-btn, .btn-text').forEach(btn => {
  btn.addEventListener('click', () => {
    const view = btn.dataset.view;
    if (view) switchView(view);
  });
});

// ── Search / Filter Listeners ────────────────────────────────
document.getElementById('audience-search').addEventListener('input', () => renderAudiences());
document.getElementById('audience-filter-status').addEventListener('change', () => renderAudiences());
document.getElementById('contact-search').addEventListener('input', () => renderContacts());
document.getElementById('contact-filter-audience').addEventListener('change', () => renderContacts());

// ── Toast ────────────────────────────────────────────────────
function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' ' + type : '');
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

// ── Boot ─────────────────────────────────────────────────────
switchView('dashboard');
