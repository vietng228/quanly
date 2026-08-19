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

// Dạng đầy đủ dùng cho hoá đơn in: "Ngày 18 tháng 08 năm 2026"
function formatDateVNFull(isoStr) {
  if (!isoStr) return '';
  const [y, m, d] = isoStr.split('-');
  return `Ngày ${d} tháng ${m} năm ${y}`;
}

// Đọc số tiền VNĐ bằng chữ (VD: 5800000 -> "Năm triệu tám trăm nghìn đồng").
// Dùng cho dòng "(...đồng chẵn)" in trên hoá đơn bán hàng.
const _CHU_SO = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
function _docSoDv(dv, chuc) {
  if (dv === 1) return chuc >= 2 ? 'mốt' : 'một';
  if (dv === 5) return chuc >= 1 ? 'lăm' : 'năm';
  return _CHU_SO[dv];
}
function _docBaChuSo(so, dayDu) {
  const tram = Math.floor(so / 100);
  const chucDv = so % 100;
  const chuc = Math.floor(chucDv / 10);
  const dv = chucDv % 10;
  let kq = '';
  if (tram === 0 && dayDu) {
    kq += 'không trăm ';
  } else if (tram !== 0) {
    kq += _CHU_SO[tram] + ' trăm ';
  }
  if (chuc === 0) {
    if (dv > 0) {
      if (tram !== 0 || dayDu) kq += 'linh ';
      kq += _docSoDv(dv, chuc);
    }
  } else if (chuc === 1) {
    kq += 'mười ';
    if (dv > 0) kq += _docSoDv(dv, chuc);
  } else {
    kq += _CHU_SO[chuc] + ' mươi';
    if (dv > 0) kq += ' ' + _docSoDv(dv, chuc);
  }
  return kq.trim();
}
function soTienBangChu(soTien) {
  soTien = Math.round(Math.abs(Number(soTien) || 0));
  if (soTien === 0) return 'Không đồng';
  const DON_VI = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  const groups = [];
  let n = soTien;
  while (n > 0) {
    groups.push(n % 1000);
    n = Math.floor(n / 1000);
  }
  const parts = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g === 0) continue;
    const dayDu = parts.length > 0;
    let groupText = _docBaChuSo(g, dayDu);
    if (DON_VI[i]) groupText += ' ' + DON_VI[i];
    parts.push(groupText);
  }
  let result = parts.join(' ');
  result = result.charAt(0).toUpperCase() + result.slice(1);
  return result + ' đồng';
}

// Chuyển cú pháp in đậm kiểu markdown (**chữ**) sang <b> — dùng cho ô "Thông
// tin bảo hành" tự do trong Cài đặt, để người dùng có thể tự in đậm 1 phần nội
// dung khi in hoá đơn (VD: **Hộp 30 ngày**) mà không cần thêm control phức tạp.
function mdBoldToHtml(str) {
  return String(str).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
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

// Bỏ dấu tiếng Việt — dùng cho nội dung mã QR chuyển khoản (chuẩn VietQR/NAPAS
// yêu cầu text thuần ASCII, nhiều app ngân hàng hiển thị sai nếu còn dấu).
function removeVietnameseTones(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
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
