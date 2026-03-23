// ─── Categorias por tipo ───────────────────────────────────────────────────
const CATEGORIES = {
  expense: [
    { id: 'alimentacion',  label: 'Alimentación',    icon: '🍔' },
    { id: 'transporte',    label: 'Transporte',       icon: '🚗' },
    { id: 'vivienda',      label: 'Vivienda',         icon: '🏠' },
    { id: 'salud',         label: 'Salud',            icon: '💊' },
    { id: 'entretenimiento', label: 'Entretenimiento', icon: '🎬' },
    { id: 'ropa',          label: 'Ropa',             icon: '👕' },
    { id: 'educacion',     label: 'Educación',        icon: '📚' },
    { id: 'servicios',     label: 'Servicios',        icon: '💡' },
    { id: 'otros',         label: 'Otros',            icon: '📦' },
  ],
  income: [
    { id: 'salario',       label: 'Salario',          icon: '💼' },
    { id: 'freelance',     label: 'Freelance',        icon: '💻' },
    { id: 'inversiones',   label: 'Inversiones',      icon: '📈' },
    { id: 'ventas',        label: 'Ventas',           icon: '🛒' },
    { id: 'regalo',        label: 'Regalo',           icon: '🎁' },
    { id: 'otros',         label: 'Otros',            icon: '💰' },
  ],
};

// ─── Estado ───────────────────────────────────────────────────────────────────
let transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
let deleteTargetId = null;
let expenseChart = null;
let monthlyChart = null;

// ─── Inicialización ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initDate();
  initTypeToggle();
  initCategorySelect();
  initChartTabs();
  document.getElementById('date').value = todayISO();
  document.getElementById('transaction-form').addEventListener('submit', handleSubmit);
  document.getElementById('filter-type').addEventListener('change', renderTransactions);
  document.getElementById('filter-category').addEventListener('change', renderTransactions);
  document.getElementById('filter-month').addEventListener('change', renderTransactions);
  document.getElementById('clear-filters').addEventListener('click', clearFilters);
  document.getElementById('confirm-delete').addEventListener('click', confirmDelete);
  document.getElementById('cancel-delete').addEventListener('click', closeModal);
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

// ─── Toggle Ingreso / Gasto ───────────────────────────────────────────────────
function initTypeToggle() {
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('transaction-type').value = btn.dataset.type;
      updateCategorySelect(btn.dataset.type);
    });
  });
}

// ─── Categorías ───────────────────────────────────────────────────────────────
function updateCategorySelect(type) {
  const sel = document.getElementById('category');
  sel.innerHTML = '<option value="">Seleccionar...</option>';
  CATEGORIES[type].forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = `${cat.icon} ${cat.label}`;
    sel.appendChild(opt);
  });
}

function initCategorySelect() {
  updateCategorySelect('expense');
}

function getCategoryInfo(type, id) {
  return (CATEGORIES[type] || []).find(c => c.id === id) || { label: id, icon: '📦' };
}

// ─── Formulario ───────────────────────────────────────────────────────────────
function handleSubmit(e) {
  e.preventDefault();
  const type     = document.getElementById('transaction-type').value;
  const desc     = document.getElementById('description').value.trim();
  const amount   = parseFloat(document.getElementById('amount').value);
  const category = document.getElementById('category').value;
  const date     = document.getElementById('date').value;

  if (!desc || !amount || !category || !date) return;

  const transaction = {
    id: Date.now().toString(),
    type, desc, amount, category, date,
  };

  transactions.unshift(transaction);
  saveTransactions();
  renderAll();
  resetForm();
  showNotification('Transacción agregada');
}

function resetForm() {
  document.getElementById('description').value = '';
  document.getElementById('amount').value = '';
  document.getElementById('category').value = '';
  document.getElementById('date').value = todayISO();
}

// ─── Persistencia ─────────────────────────────────────────────────────────────
function saveTransactions() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

// ─── Resumen ──────────────────────────────────────────────────────────────────
function renderSummary() {
  const now = new Date();
  const month = now.getMonth();
  const year  = now.getFullYear();

  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date + 'T00:00:00');
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const totalBalance = transactions.reduce((acc, t) =>
    t.type === 'income' ? acc + t.amount : acc - t.amount, 0);

  const monthIncome  = thisMonth.filter(t => t.type === 'income' ).reduce((a, t) => a + t.amount, 0);
  const monthExpense = thisMonth.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const monthSavings = monthIncome - monthExpense;

  document.getElementById('total-balance' ).textContent = fmt(totalBalance);
  document.getElementById('total-income'  ).textContent = fmt(monthIncome);
  document.getElementById('total-expense' ).textContent = fmt(monthExpense);
  document.getElementById('total-savings' ).textContent = fmt(monthSavings);

  document.getElementById('total-savings').style.color =
    monthSavings >= 0 ? 'var(--green)' : 'var(--red)';
}

function fmt(n) {
  return (n < 0 ? '-$' : '$') + Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ─── Gráficas ─────────────────────────────────────────────────────────────────
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

function renderCharts() {
  renderExpenseChart();
  renderMonthlyChart();
}

function renderExpenseChart() {
  const now = new Date();
  const data = transactions.filter(t => {
    const d = new Date(t.date + 'T00:00:00');
    return t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const noData = document.getElementById('no-expense-data');
  const canvas = document.getElementById('expenseCanvas');

  if (data.length === 0) {
    canvas.style.display = 'none';
    noData.style.display = 'block';
    if (expenseChart) { expenseChart.destroy(); expenseChart = null; }
    return;
  }
  canvas.style.display = 'block';
  noData.style.display = 'none';

  const grouped = {};
  data.forEach(t => {
    const info = getCategoryInfo('expense', t.category);
    const key = `${info.icon} ${info.label}`;
    grouped[key] = (grouped[key] || 0) + t.amount;
  });

  const labels = Object.keys(grouped);
  const values = Object.values(grouped);
  const colors = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f59e0b'];

  if (expenseChart) expenseChart.destroy();
  expenseChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: colors.slice(0, labels.length), borderWidth: 0 }],
    },
    options: {
      plugins: {
        legend: { labels: { color: '#f1f5f9', font: { size: 12 }, padding: 16, boxWidth: 14 } },
        tooltip: {
          callbacks: {
            label: ctx => ` $${ctx.raw.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
          },
        },
      },
      cutout: '60%',
    },
  });
}

function renderMonthlyChart() {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString('es-MX', { month: 'short' }) });
  }

  const incomes  = months.map(m => transactions.filter(t => {
    const d = new Date(t.date + 'T00:00:00');
    return t.type === 'income' && d.getMonth() === m.month && d.getFullYear() === m.year;
  }).reduce((a, t) => a + t.amount, 0));

  const expenses = months.map(m => transactions.filter(t => {
    const d = new Date(t.date + 'T00:00:00');
    return t.type === 'expense' && d.getMonth() === m.month && d.getFullYear() === m.year;
  }).reduce((a, t) => a + t.amount, 0));

  const canvas = document.getElementById('monthlyCanvas');
  const noData = document.getElementById('no-monthly-data');
  const hasData = incomes.some(v => v > 0) || expenses.some(v => v > 0);

  if (!hasData) {
    canvas.style.display = 'none';
    noData.style.display = 'block';
    if (monthlyChart) { monthlyChart.destroy(); monthlyChart = null; }
    return;
  }
  canvas.style.display = 'block';
  noData.style.display = 'none';

  if (monthlyChart) monthlyChart.destroy();
  monthlyChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: months.map(m => m.label),
      datasets: [
        { label: 'Ingresos',  data: incomes,  backgroundColor: 'rgba(34,197,94,0.7)',  borderRadius: 6 },
        { label: 'Gastos',    data: expenses, backgroundColor: 'rgba(239,68,68,0.7)',  borderRadius: 6 },
      ],
    },
    options: {
      plugins: { legend: { labels: { color: '#f1f5f9' } } },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
        y: { ticks: { color: '#94a3b8', callback: v => '$' + v }, grid: { color: '#334155' } },
      },
    },
  });
}

// ─── Lista de Transacciones ───────────────────────────────────────────────────
function renderTransactions() {
  const filterType     = document.getElementById('filter-type').value;
  const filterCategory = document.getElementById('filter-category').value;
  const filterMonth    = document.getElementById('filter-month').value;

  let filtered = [...transactions];
  if (filterType !== 'all')     filtered = filtered.filter(t => t.type === filterType);
  if (filterCategory !== 'all') filtered = filtered.filter(t => t.category === filterCategory);
  if (filterMonth !== 'all') {
    const [yr, mo] = filterMonth.split('-').map(Number);
    filtered = filtered.filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return d.getFullYear() === yr && d.getMonth() + 1 === mo;
    });
  }

  const list = document.getElementById('transactions-list');

  if (filtered.length === 0) {
    list.innerHTML = '<p class="empty-message">No hay transacciones que mostrar.</p>';
    return;
  }

  list.innerHTML = filtered.map(t => {
    const info = getCategoryInfo(t.type, t.category);
    const dateStr = new Date(t.date + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    const sign = t.type === 'income' ? '+' : '-';
    return `
      <div class="transaction-item">
        <div class="transaction-icon ${t.type}">${info.icon}</div>
        <div class="transaction-info">
          <div class="transaction-desc">${escHtml(t.desc)}</div>
          <div class="transaction-meta">${info.label} · ${dateStr}</div>
        </div>
        <span class="transaction-amount ${t.type}">${sign}$${t.amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>
        <button class="btn-delete" onclick="openModal('${t.id}')" title="Eliminar">✕</button>
      </div>`;
  }).join('');
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Filtros ──────────────────────────────────────────────────────────────────
function populateFilterOptions() {
  // Categorias
  const catSel = document.getElementById('filter-category');
  const currentCat = catSel.value;
  catSel.innerHTML = '<option value="all">Todas las categorías</option>';
  const allCats = [...CATEGORIES.expense, ...CATEGORIES.income];
  const used = [...new Set(transactions.map(t => t.category))];
  allCats.filter(c => used.includes(c.id)).forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.icon} ${c.label}`;
    catSel.appendChild(opt);
  });
  if ([...catSel.options].some(o => o.value === currentCat)) catSel.value = currentCat;

  // Meses
  const moSel = document.getElementById('filter-month');
  const currentMo = moSel.value;
  moSel.innerHTML = '<option value="all">Todos los meses</option>';
  const months = [...new Set(transactions.map(t => t.date.substring(0, 7)))].sort().reverse();
  months.forEach(m => {
    const [yr, mo] = m.split('-');
    const label = new Date(Number(yr), Number(mo) - 1, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = label.charAt(0).toUpperCase() + label.slice(1);
    moSel.appendChild(opt);
  });
  if ([...moSel.options].some(o => o.value === currentMo)) moSel.value = currentMo;
}

function clearFilters() {
  document.getElementById('filter-type').value = 'all';
  document.getElementById('filter-category').value = 'all';
  document.getElementById('filter-month').value = 'all';
  renderTransactions();
}

// ─── Eliminar ─────────────────────────────────────────────────────────────────
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
  transactions = transactions.filter(t => t.id !== deleteTargetId);
  saveTransactions();
  renderAll();
  closeModal();
  showNotification('Transacción eliminada');
}

// ─── Notificación ─────────────────────────────────────────────────────────────
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
  populateFilterOptions();
  renderTransactions();
  renderCharts();
}
