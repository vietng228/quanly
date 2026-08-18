/* utils.js — hàm tiện ích: định dạng tiền, ngày tháng, tuần */

function formatMoney(n) {
  n = Number(n) || 0;
  return n.toLocaleString('vi-VN') + '₫';
}

function parseMoneyInput(str) {
  if (typeof str === 'number') return str;
  return Number(String(str).replace(/[^\d-]/g, '')) || 0;
}

function todayStr() {
  const d = new Date();
  return toISODate(d);
}

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateVN(isoStr) {
  if (!isoStr) return '';
  const [y, m, d] = isoStr.split('-');
  return `${d}/${m}/${y}`;
}

// Trả về mốc đầu ngày / đầu tuần (thứ 2) / đầu tháng dạng ISO yyyy-mm-dd
function startOfWeek(dateObj) {
  const d = new Date(dateObj);
  const day = d.getDay(); // 0 = CN
  const diff = day === 0 ? -6 : 1 - day; // đưa về thứ 2
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(dateObj) {
  const d = new Date(dateObj);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function isInRange(iso, startISO, endISO) {
  return iso >= startISO && iso <= endISO;
}

function getPeriodRange(period) {
  const now = new Date();
  const todayISO = toISODate(now);
  if (period === 'day') {
    return { start: todayISO, end: todayISO, label: `Hôm nay (${formatDateVN(todayISO)})` };
  }
  if (period === 'week') {
    const s = startOfWeek(now);
    const sISO = toISODate(s);
    return { start: sISO, end: todayISO, label: `Tuần này (từ ${formatDateVN(sISO)})` };
  }
  if (period === 'month') {
    const s = startOfMonth(now);
    const sISO = toISODate(s);
    return { start: sISO, end: todayISO, label: `Tháng này (từ ${formatDateVN(sISO)})` };
  }
  return { start: '0000-01-01', end: '9999-12-31', label: 'Tất cả' };
}

function escapeHtml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toast(msg, isError = false) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = 'toast show' + (isError ? ' error' : '');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    el.className = 'toast';
  }, 2200);
}

function confirmDialog(msg) {
  return window.confirm(msg);
}
