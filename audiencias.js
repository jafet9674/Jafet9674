// ─── Configuración de plataformas ─────────────────────────────────────────────
const PLATFORMS = {
  youtube:   { label: 'YouTube',    icon: '▶️', color: '#ef4444' },
  instagram: { label: 'Instagram',  icon: '📸', color: '#ec4899' },
  tiktok:    { label: 'TikTok',     icon: '🎵', color: '#14b8a6' },
  twitter:   { label: 'Twitter / X',icon: '🐦', color: '#3b82f6' },
  facebook:  { label: 'Facebook',   icon: '👥', color: '#6366f1' },
  linkedin:  { label: 'LinkedIn',   icon: '💼', color: '#0284c7' },
  twitch:    { label: 'Twitch',     icon: '🎮', color: '#8b5cf6' },
  spotify:   { label: 'Spotify',    icon: '🎧', color: '#22c55e' },
  pinterest: { label: 'Pinterest',  icon: '📌', color: '#f43f5e' },
  otros:     { label: 'Otros',      icon: '🌐', color: '#94a3b8' },
};

// ─── Estado ───────────────────────────────────────────────────────────────────
let entries = JSON.parse(localStorage.getItem('aud_entries') || '[]');
let goals   = JSON.parse(localStorage.getItem('aud_goals')   || '[]');
let deleteTargetId = null;

let growthChart       = null;
let compareChart      = null;
let distChart         = null;
let monthlyGrowthChart = null;

// ─── Inicialización ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initDate();
  initChartTabs();
  document.getElementById('entry-date').value = todayISO();
  document.getElementById('audience-form').addEventListener('submit', handleSubmit);
  document.getElementById('filter-platform').addEventListener('change', renderHistory);
  document.getElementById('filter-period').addEventListener('change', renderHistory);
  document.getElementById('clear-aud-filters').addEventListener('click', clearFilters);
  document.getElementById('export-csv').addEventListener('click', exportCSV);
  document.getElementById('confirm-delete').addEventListener('click', confirmDelete);
  document.getElementById('cancel-delete').addEventListener('click', closeModal);
  document.getElementById('btn-add-goal').addEventListener('click', openGoalModal);
  document.getElementById('confirm-goal').addEventListener('click', saveGoal);
  document.getElementById('cancel-goal').addEventListener('click', closeGoalModal);
  renderAll();
});

// ─── Fecha ────────────────────────────────────────────────────────────────────
function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function initDate() {
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('current-date').textContent =
    new Date().toLocaleDateString('es-MX', opts);
}

// ─── Tabs de gráficas ─────────────────────────────────────────────────────────
function initChartTabs() {
  document.querySelectorAll('.chart-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.chart-container').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.chart).classList.add('active');
    });
  });
}

// ─── Formulario ───────────────────────────────────────────────────────────────
function handleSubmit(e) {
  e.preventDefault();
  const platform   = document.getElementById('platform').value;
  const followers  = parseInt(document.getElementById('followers').value, 10);
  const views      = document.getElementById('views').value ? parseInt(document.getElementById('views').value, 10) : null;
  const engagement = document.getElementById('engagement').value ? parseFloat(document.getElementById('engagement').value) : null;
  const date       = document.getElementById('entry-date').value;
  const notes      = document.getElementById('notes').value.trim();

  if (!platform || isNaN(followers) || !date) return;

  const entry = {
    id: Date.now().toString(),
    platform, followers, views, engagement, date, notes,
  };

  entries.unshift(entry);
  saveData();
  renderAll();
  resetForm();
  showNotification('Registro agregado');
}

function resetForm() {
  document.getElementById('platform').value = '';
  document.getElementById('followers').value = '';
  document.getElementById('views').value = '';
  document.getElementById('engagement').value = '';
  document.getElementById('entry-date').value = todayISO();
  document.getElementById('notes').value = '';
}

// ─── Persistencia ─────────────────────────────────────────────────────────────
function saveData() {
  localStorage.setItem('aud_entries', JSON.stringify(entries));
  localStorage.setItem('aud_goals', JSON.stringify(goals));
}

// ─── Último valor por plataforma ──────────────────────────────────────────────
function getLatestPerPlatform() {
  const latest = {};
  [...entries].sort((a, b) => a.date.localeCompare(b.date)).forEach(e => {
    latest[e.platform] = e;
  });
  return latest;
}

function getPreviousMonthPerPlatform() {
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = prevMonth.toISOString().split('T')[0].substring(0, 7);
  const result = {};
  entries
    .filter(e => e.date.startsWith(prevMonth.getFullYear() + '-'))
    .forEach(e => {
      const [yr, mo] = e.date.split('-');
      if (parseInt(mo, 10) === prevMonth.getMonth() + 1 && parseInt(yr, 10) === prevMonth.getFullYear()) {
        if (!result[e.platform] || e.date > result[e.platform].date) {
          result[e.platform] = e;
        }
      }
    });
  return result;
}

// ─── Resumen ──────────────────────────────────────────────────────────────────
function renderSummary() {
  const latest = getLatestPerPlatform();
  const prev   = getPreviousMonthPerPlatform();
  const platforms = Object.keys(latest);

  const total = platforms.reduce((s, p) => s + latest[p].followers, 0);

  // Crecimiento
  const totalPrev = platforms.reduce((s, p) => s + (prev[p] ? prev[p].followers : 0), 0);
  const growth    = total - totalPrev;
  const growthPct = totalPrev > 0 ? ((growth / totalPrev) * 100).toFixed(1) : '—';

  // Mejor plataforma
  let bestPlatform = null;
  let bestCount = 0;
  platforms.forEach(p => {
    if (latest[p].followers > bestCount) { bestCount = latest[p].followers; bestPlatform = p; }
  });

  // Engagement promedio
  const withEngagement = entries.filter(e => e.engagement !== null);
  const avgEngagement = withEngagement.length > 0
    ? (withEngagement.reduce((s, e) => s + e.engagement, 0) / withEngagement.length).toFixed(1)
    : '—';

  document.getElementById('stat-total').textContent    = fmtNum(total);
  document.getElementById('stat-platforms').textContent = `${platforms.length} plataforma${platforms.length !== 1 ? 's' : ''}`;

  const growthEl = document.getElementById('stat-growth');
  growthEl.textContent = (growth >= 0 ? '+' : '') + fmtNum(growth);
  growthEl.style.color = growth >= 0 ? 'var(--green)' : 'var(--red)';
  document.getElementById('stat-growth-pct').textContent = growthPct !== '—' ? `${growthPct >= 0 ? '+' : ''}${growthPct}%` : 'Sin datos previos';

  const pInfo = bestPlatform ? PLATFORMS[bestPlatform] : null;
  document.getElementById('stat-best').textContent       = pInfo ? `${pInfo.icon} ${pInfo.label}` : '—';
  document.getElementById('stat-best-count').textContent = bestPlatform ? `${fmtNum(bestCount)} seguidores` : 'Sin datos';

  document.getElementById('stat-engagement').textContent = avgEngagement !== '—' ? `${avgEngagement}%` : '—';
}

// ─── Resumen por plataforma ───────────────────────────────────────────────────
function renderPlatformBreakdown() {
  const latest = getLatestPerPlatform();
  const prev   = getPreviousMonthPerPlatform();
  const platforms = Object.keys(latest);
  const container = document.getElementById('platform-breakdown');

  if (platforms.length === 0) {
    container.innerHTML = '<p class="empty-message">Sin datos. Agrega tu primer registro.</p>';
    return;
  }

  const total = platforms.reduce((s, p) => s + latest[p].followers, 0);

  container.innerHTML = platforms
    .sort((a, b) => latest[b].followers - latest[a].followers)
    .map(p => {
      const info     = PLATFORMS[p];
      const curr     = latest[p].followers;
      const prevVal  = prev[p] ? prev[p].followers : null;
      const diff     = prevVal !== null ? curr - prevVal : null;
      const diffPct  = prevVal !== null && prevVal > 0 ? ((diff / prevVal) * 100).toFixed(1) : null;
      const pct      = total > 0 ? ((curr / total) * 100).toFixed(1) : 0;
      const goal     = goals.find(g => g.platform === p);
      const goalPct  = goal ? Math.min((curr / goal.value) * 100, 100).toFixed(0) : null;

      const diffHtml = diff !== null
        ? `<span class="plat-diff ${diff >= 0 ? 'pos' : 'neg'}">${diff >= 0 ? '▲' : '▼'} ${fmtNum(Math.abs(diff))} (${diffPct}%)</span>`
        : '<span class="plat-diff neutral">Sin comparativa</span>';

      const goalHtml = goal
        ? `<div class="goal-progress"><div class="goal-bar"><div class="goal-fill" style="width:${goalPct}%;background:${info.color}"></div></div><span class="goal-label">Meta: ${fmtNum(goal.value)} · ${goalPct}%</span></div>`
        : '';

      return `
        <div class="platform-card">
          <div class="plat-icon" style="background:${info.color}20;color:${info.color}">${info.icon}</div>
          <div class="plat-info">
            <div class="plat-name">${info.label}</div>
            <div class="plat-meta">${pct}% de audiencia total</div>
            ${goalHtml}
          </div>
          <div class="plat-stats">
            <div class="plat-count">${fmtNum(curr)}</div>
            ${diffHtml}
          </div>
        </div>`;
    }).join('');
}

// ─── Gráficas ─────────────────────────────────────────────────────────────────
function renderCharts() {
  renderGrowthChart();
  renderCompareChart();
  renderDistChart();
  renderMonthlyGrowthChart();
}

function renderGrowthChart() {
  const canvas = document.getElementById('growthCanvas');
  const noData = document.getElementById('no-growth-data');

  if (entries.length === 0) {
    canvas.style.display = 'none';
    noData.style.display = 'block';
    if (growthChart) { growthChart.destroy(); growthChart = null; }
    return;
  }

  // Obtener últimos 6 meses
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
    });
  }

  const activePlatforms = [...new Set(entries.map(e => e.platform))];

  const datasets = activePlatforms.map(p => {
    const info = PLATFORMS[p];
    const data = months.map(m => {
      const monthEntries = entries.filter(e => {
        const d = new Date(e.date + 'T00:00:00');
        return e.platform === p && d.getMonth() === m.month && d.getFullYear() === m.year;
      });
      if (monthEntries.length === 0) {
        // Buscar el último valor antes de este mes
        const before = entries
          .filter(e => {
            const d = new Date(e.date + 'T00:00:00');
            return e.platform === p && (d.getFullYear() < m.year || (d.getFullYear() === m.year && d.getMonth() <= m.month));
          })
          .sort((a, b) => b.date.localeCompare(a.date));
        return before.length > 0 ? before[0].followers : null;
      }
      return Math.max(...monthEntries.map(e => e.followers));
    });
    return {
      label: `${info.icon} ${info.label}`,
      data,
      borderColor: info.color,
      backgroundColor: info.color + '20',
      fill: false,
      tension: 0.4,
      pointRadius: 5,
      spanGaps: true,
    };
  });

  canvas.style.display = 'block';
  noData.style.display = 'none';
  if (growthChart) growthChart.destroy();
  growthChart = new Chart(canvas, {
    type: 'line',
    data: { labels: months.map(m => m.label), datasets },
    options: {
      plugins: { legend: { labels: { color: '#f1f5f9', font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
        y: {
          ticks: { color: '#94a3b8', callback: v => fmtNumShort(v) },
          grid: { color: '#334155' },
        },
      },
    },
  });
}

function renderCompareChart() {
  const canvas = document.getElementById('compareCanvas');
  const noData = document.getElementById('no-compare-data');
  const latest = getLatestPerPlatform();
  const platforms = Object.keys(latest).sort((a, b) => latest[b].followers - latest[a].followers);

  if (platforms.length === 0) {
    canvas.style.display = 'none';
    noData.style.display = 'block';
    if (compareChart) { compareChart.destroy(); compareChart = null; }
    return;
  }

  canvas.style.display = 'block';
  noData.style.display = 'none';
  if (compareChart) compareChart.destroy();
  compareChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: platforms.map(p => `${PLATFORMS[p].icon} ${PLATFORMS[p].label}`),
      datasets: [{
        label: 'Seguidores',
        data: platforms.map(p => latest[p].followers),
        backgroundColor: platforms.map(p => PLATFORMS[p].color + 'cc'),
        borderRadius: 8,
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { color: '#334155' } },
        y: { ticks: { color: '#94a3b8', callback: v => fmtNumShort(v) }, grid: { color: '#334155' } },
      },
    },
  });
}

function renderDistChart() {
  const canvas = document.getElementById('distCanvas');
  const noData = document.getElementById('no-dist-data');
  const latest = getLatestPerPlatform();
  const platforms = Object.keys(latest);

  if (platforms.length === 0) {
    canvas.style.display = 'none';
    noData.style.display = 'block';
    if (distChart) { distChart.destroy(); distChart = null; }
    return;
  }

  canvas.style.display = 'block';
  noData.style.display = 'none';
  if (distChart) distChart.destroy();
  distChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: platforms.map(p => `${PLATFORMS[p].icon} ${PLATFORMS[p].label}`),
      datasets: [{
        data: platforms.map(p => latest[p].followers),
        backgroundColor: platforms.map(p => PLATFORMS[p].color),
        borderWidth: 0,
      }],
    },
    options: {
      plugins: {
        legend: { labels: { color: '#f1f5f9', font: { size: 11 }, padding: 14, boxWidth: 14 } },
        tooltip: { callbacks: { label: ctx => ` ${fmtNum(ctx.raw)} seguidores` } },
      },
      cutout: '55%',
    },
  });
}

function renderMonthlyGrowthChart() {
  const canvas = document.getElementById('monthlyGrowthCanvas');
  const noData = document.getElementById('no-monthly-growth-data');

  if (entries.length < 2) {
    canvas.style.display = 'none';
    noData.style.display = 'block';
    if (monthlyGrowthChart) { monthlyGrowthChart.destroy(); monthlyGrowthChart = null; }
    return;
  }

  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }) });
  }

  const activePlatforms = [...new Set(entries.map(e => e.platform))];

  // Calcular crecimiento neto por mes (suma de todas las plataformas)
  const growthData = months.map((m, idx) => {
    if (idx === 0) return 0;
    const prev = months[idx - 1];
    let total = 0, totalPrev = 0;
    activePlatforms.forEach(p => {
      const currEntries = entries.filter(e => {
        const d = new Date(e.date + 'T00:00:00');
        return e.platform === p && d.getMonth() === m.month && d.getFullYear() === m.year;
      });
      const prevEntries = entries.filter(e => {
        const d = new Date(e.date + 'T00:00:00');
        return e.platform === p && d.getMonth() === prev.month && d.getFullYear() === prev.year;
      });
      const currMax = currEntries.length > 0 ? Math.max(...currEntries.map(e => e.followers)) : 0;
      const prevMax = prevEntries.length > 0 ? Math.max(...prevEntries.map(e => e.followers)) : 0;
      if (currMax > 0 && prevMax > 0) { total += currMax; totalPrev += prevMax; }
    });
    return total - totalPrev;
  });

  const hasData = growthData.some(v => v !== 0);
  if (!hasData) {
    canvas.style.display = 'none';
    noData.style.display = 'block';
    if (monthlyGrowthChart) { monthlyGrowthChart.destroy(); monthlyGrowthChart = null; }
    return;
  }

  canvas.style.display = 'block';
  noData.style.display = 'none';
  if (monthlyGrowthChart) monthlyGrowthChart.destroy();
  monthlyGrowthChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: months.map(m => m.label),
      datasets: [{
        label: 'Crecimiento neto',
        data: growthData,
        backgroundColor: growthData.map(v => v >= 0 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)'),
        borderRadius: 6,
      }],
    },
    options: {
      plugins: { legend: { labels: { color: '#f1f5f9' } } },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
        y: { ticks: { color: '#94a3b8', callback: v => fmtNumShort(v) }, grid: { color: '#334155' } },
      },
    },
  });
}

// ─── Historial ────────────────────────────────────────────────────────────────
function renderHistory() {
  const filterPlatform = document.getElementById('filter-platform').value;
  const filterPeriod   = document.getElementById('filter-period').value;

  let filtered = [...entries];
  if (filterPlatform !== 'all') filtered = filtered.filter(e => e.platform === filterPlatform);

  if (filterPeriod !== 'all') {
    const now = new Date();
    filtered = filtered.filter(e => {
      const d = new Date(e.date + 'T00:00:00');
      if (filterPeriod === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      } else if (filterPeriod === '3months') {
        const cutoff = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        return d >= cutoff;
      } else if (filterPeriod === '6months') {
        const cutoff = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        return d >= cutoff;
      } else if (filterPeriod === 'year') {
        return d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }

  const list = document.getElementById('history-list');
  if (filtered.length === 0) {
    list.innerHTML = '<p class="empty-message">No hay registros que mostrar.</p>';
    return;
  }

  list.innerHTML = filtered.map(e => {
    const info    = PLATFORMS[e.platform];
    const dateStr = new Date(e.date + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    const extras  = [];
    if (e.views      !== null) extras.push(`👁 ${fmtNum(e.views)} vistas`);
    if (e.engagement !== null) extras.push(`💬 ${e.engagement}% eng.`);
    if (e.notes)               extras.push(`📝 ${escHtml(e.notes)}`);

    return `
      <div class="transaction-item">
        <div class="transaction-icon" style="background:${info.color}20;color:${info.color};width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0;">${info.icon}</div>
        <div class="transaction-info">
          <div class="transaction-desc">${info.label}</div>
          <div class="transaction-meta">${dateStr}${extras.length ? ' · ' + extras.join(' · ') : ''}</div>
        </div>
        <span class="transaction-amount income">${fmtNum(e.followers)} seg.</span>
        <button class="btn-delete" onclick="openModal('${e.id}')" title="Eliminar">✕</button>
      </div>`;
  }).join('');
}

function populateFilterPlatform() {
  const sel = document.getElementById('filter-platform');
  const current = sel.value;
  sel.innerHTML = '<option value="all">Todas las plataformas</option>';
  const used = [...new Set(entries.map(e => e.platform))];
  used.forEach(p => {
    const info = PLATFORMS[p];
    const opt  = document.createElement('option');
    opt.value  = p;
    opt.textContent = `${info.icon} ${info.label}`;
    sel.appendChild(opt);
  });
  if ([...sel.options].some(o => o.value === current)) sel.value = current;
}

function clearFilters() {
  document.getElementById('filter-platform').value = 'all';
  document.getElementById('filter-period').value   = 'all';
  renderHistory();
}

// ─── Modal eliminar ───────────────────────────────────────────────────────────
function openModal(id) {
  deleteTargetId = id;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  deleteTargetId = null;
  document.getElementById('modal-overlay').classList.add('hidden');
}

function confirmDelete() {
  if (!deleteTargetId) return;
  entries = entries.filter(e => e.id !== deleteTargetId);
  saveData();
  renderAll();
  closeModal();
  showNotification('Registro eliminado');
}

// ─── Metas ────────────────────────────────────────────────────────────────────
function openGoalModal() {
  document.getElementById('goal-modal-overlay').classList.remove('hidden');
  document.getElementById('goal-date').value = '';
  document.getElementById('goal-value').value = '';
}

function closeGoalModal() {
  document.getElementById('goal-modal-overlay').classList.add('hidden');
}

function saveGoal() {
  const platform = document.getElementById('goal-platform').value;
  const value    = parseInt(document.getElementById('goal-value').value, 10);
  const date     = document.getElementById('goal-date').value;

  if (!platform || isNaN(value) || value <= 0) {
    showNotification('Completa los campos de la meta', true);
    return;
  }

  const existing = goals.findIndex(g => g.platform === platform);
  const goal = { platform, value, date: date || null };
  if (existing >= 0) goals[existing] = goal;
  else goals.push(goal);

  saveData();
  renderAll();
  closeGoalModal();
  showNotification('Meta guardada');
}

function renderGoals() {
  const list = document.getElementById('goals-list');
  if (goals.length === 0) {
    list.innerHTML = '<p class="empty-message" style="padding:12px 0;">Sin metas configuradas.</p>';
    return;
  }
  const latest = getLatestPerPlatform();
  list.innerHTML = goals.map(g => {
    const info    = PLATFORMS[g.platform];
    const current = latest[g.platform] ? latest[g.platform].followers : 0;
    const pct     = Math.min((current / g.value) * 100, 100).toFixed(0);
    const dateStr = g.date ? new Date(g.date + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
    return `
      <div class="goal-item">
        <div class="goal-header">
          <span>${info.icon} ${info.label}</span>
          <button class="btn-delete" onclick="deleteGoal('${g.platform}')" title="Eliminar meta">✕</button>
        </div>
        <div class="goal-progress">
          <div class="goal-bar"><div class="goal-fill" style="width:${pct}%;background:${info.color}"></div></div>
          <span class="goal-label">${fmtNum(current)} / ${fmtNum(g.value)} · ${pct}%${dateStr ? ' · ' + dateStr : ''}</span>
        </div>
      </div>`;
  }).join('');
}

function deleteGoal(platform) {
  goals = goals.filter(g => g.platform !== platform);
  saveData();
  renderAll();
  showNotification('Meta eliminada');
}

// ─── Exportar CSV ─────────────────────────────────────────────────────────────
function exportCSV() {
  if (entries.length === 0) {
    showNotification('Sin datos para exportar', true);
    return;
  }
  const header = ['Fecha', 'Plataforma', 'Seguidores', 'Vistas', 'Engagement%', 'Notas'];
  const rows = entries.map(e => [
    e.date,
    PLATFORMS[e.platform]?.label || e.platform,
    e.followers,
    e.views ?? '',
    e.engagement ?? '',
    e.notes || '',
  ]);
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `audiencias_${todayISO()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showNotification('CSV exportado');
}

// ─── Utilidades ───────────────────────────────────────────────────────────────
function fmtNum(n) {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('es-MX');
}

function fmtNumShort(n) {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return n;
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showNotification(msg, isError = false) {
  const el = document.createElement('div');
  el.className = 'notification' + (isError ? ' error' : '');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

// ─── Render completo ──────────────────────────────────────────────────────────
function renderAll() {
  renderSummary();
  renderPlatformBreakdown();
  populateFilterPlatform();
  renderHistory();
  renderGoals();
  renderCharts();
}
