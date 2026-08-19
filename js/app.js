/* app.js — logic chính của ứng dụng: điều hướng, render màn hình, xử lý form */

const CATEGORIES = [
  'Tivi',
  'Tủ lạnh',
  'Máy giặt',
  'Điều hòa',
  'Máy hút ẩm',
  'Máy lọc không khí',
  'Dịch vụ lắp đặt Tivi',
  'Khác',
];

const CATEGORY_ICONS = {
  'Tivi': '📺',
  'Tủ lạnh': '🧊',
  'Máy giặt': '🧺',
  'Điều hòa': '❄️',
  'Máy hút ẩm': '💧',
  'Máy lọc không khí': '🌬️',
  'Dịch vụ lắp đặt Tivi': '🔧',
  'Khác': '📦',
};
function categoryIcon(cat) {
  return CATEGORY_ICONS[cat] || CATEGORY_ICONS['Khác'];
}

// Các khổ giấy in hoá đơn — 57mm/58mm/80mm là khổ giấy cuộn máy in nhiệt
// (bill/receipt) tiêu chuẩn phổ biến ở VN, KHÁC với A4/A5 (giấy tờ rời khổ
// văn phòng). Khai báo `size` trong CSS @page theo đúng khổ đã chọn để hộp
// thoại in của trình duyệt tự nhận đúng kích thước cuộn giấy, không phải tự
// chọn tay trong danh sách A4/A5/A6/Letter mặc định của hệ điều hành nữa.
const PRINT_PAPER_SIZES = [
  { value: '57mm', label: '57mm (giấy nhiệt cuộn nhỏ, máy in mini)', widthMm: 57, fontScale: 0.9 },
  { value: '58mm', label: '58mm (giấy nhiệt phổ biến nhất)', widthMm: 58, fontScale: 0.9 },
  { value: '80mm', label: '80mm — khổ K80 (giấy nhiệt khổ lớn)', widthMm: 80, fontScale: 1 },
  { value: 'A5', label: 'A5 (giấy thường, in máy in thường)', widthMm: 148, fontScale: 1.15 },
  { value: 'A4', label: 'A4 (giấy thường, in máy in thường)', widthMm: 210, fontScale: 1.25 },
];
function getPrintPaperSize(value) {
  return PRINT_PAPER_SIZES.find((p) => p.value === value) || PRINT_PAPER_SIZES.find((p) => p.value === '80mm');
}

// Danh sách ngân hàng & mã BIN theo chuẩn VietQR/NAPAS 247 (nguồn: api.vietqr.io)
// — dùng để tự tạo mã QR chuyển khoản ngay trên máy, không cần gọi API ngoài.
const VIETQR_BANKS = [
  { code: 'ABBANK', name: 'An Bình (ABBANK)', bin: '970425' },
  { code: 'ACB', name: 'Á Châu (ACB)', bin: '970416' },
  { code: 'Agribank', name: 'Agribank', bin: '970405' },
  { code: 'BacABank', name: 'Bắc Á (BacABank)', bin: '970409' },
  { code: 'BaoVietBank', name: 'Bảo Việt (BaoVietBank)', bin: '970438' },
  { code: 'BIDV', name: 'BIDV', bin: '970418' },
  { code: 'CBBank', name: 'Xây dựng Việt Nam (CBBank)', bin: '970444' },
  { code: 'Eximbank', name: 'Eximbank', bin: '970431' },
  { code: 'GPBank', name: 'Dầu Khí Toàn Cầu (GPBank)', bin: '970408' },
  { code: 'HDBank', name: 'HDBank', bin: '970437' },
  { code: 'HongLeong', name: 'Hong Leong Việt Nam', bin: '970442' },
  { code: 'IndovinaBank', name: 'Indovina Bank', bin: '970434' },
  { code: 'KienLongBank', name: 'Kiên Long (KienLongBank)', bin: '970452' },
  { code: 'LPBank', name: 'Lộc Phát (LPBank)', bin: '970449' },
  { code: 'MBBank', name: 'Quân đội (MBBank)', bin: '970422' },
  { code: 'MBV', name: 'Việt Nam Hiện Đại (MBV)', bin: '970414' },
  { code: 'MSB', name: 'Hàng Hải (MSB)', bin: '970426' },
  { code: 'NamABank', name: 'Nam Á (NamABank)', bin: '970428' },
  { code: 'NCB', name: 'Quốc Dân (NCB)', bin: '970419' },
  { code: 'OCB', name: 'Phương Đông (OCB)', bin: '970448' },
  { code: 'PGBank', name: 'PGBank', bin: '970430' },
  { code: 'PVcomBank', name: 'Đại Chúng Việt Nam (PVcomBank)', bin: '970412' },
  { code: 'PublicBank', name: 'Public Việt Nam', bin: '970439' },
  { code: 'SaigonBank', name: 'Sài Gòn Công Thương (SaigonBank)', bin: '970400' },
  { code: 'Sacombank', name: 'Sacombank', bin: '970403' },
  { code: 'SCB', name: 'Sài Gòn (SCB)', bin: '970429' },
  { code: 'SeABank', name: 'Đông Nam Á (SeABank)', bin: '970440' },
  { code: 'SHB', name: 'SHB', bin: '970443' },
  { code: 'ShinhanBank', name: 'Shinhan Việt Nam', bin: '970424' },
  { code: 'Techcombank', name: 'Techcombank', bin: '970407' },
  { code: 'TPBank', name: 'TPBank', bin: '970423' },
  { code: 'VietABank', name: 'Việt Á (VietABank)', bin: '970427' },
  { code: 'VietBank', name: 'Việt Nam Thương Tín (VietBank)', bin: '970433' },
  { code: 'VietCapitalBank', name: 'Bản Việt (VietCapitalBank)', bin: '970454' },
  { code: 'Vietcombank', name: 'Vietcombank', bin: '970436' },
  { code: 'VietinBank', name: 'VietinBank', bin: '970415' },
  { code: 'Vikki', name: 'Số Vikki (Vikki Bank)', bin: '970406' },
  { code: 'VIB', name: 'Quốc tế (VIB)', bin: '970441' },
  { code: 'VPBank', name: 'VPBank', bin: '970432' },
];

// CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) — thuật toán checksum bắt buộc
// theo chuẩn EMVCo QR mà VietQR/NAPAS sử dụng.
function crc16CcittFalse(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= (str.charCodeAt(i) & 0xff) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function vietQrTlv(tag, value) {
  const len = String(value).length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

// Tự dựng chuỗi mã VietQR (chuẩn NAPAS 247/EMVCo) hoàn toàn ở phía client —
// không gọi API/mạng ngoài nên vẫn hoạt động khi máy mất mạng. Nếu có amount,
// mã QR sẽ tự điền sẵn đúng số tiền hoá đơn khi khách quét bằng app ngân hàng.
function buildVietQrPayload({ bin, accountNo, accountName, amount, purpose }) {
  const accountInfo = vietQrTlv('00', bin) + vietQrTlv('01', accountNo);
  const beneficiary = vietQrTlv('00', 'A000000727') + vietQrTlv('01', accountInfo) + vietQrTlv('02', 'QRIBFTTA');
  let payload =
    vietQrTlv('00', '01') + vietQrTlv('01', amount ? '12' : '11') + vietQrTlv('38', beneficiary) + vietQrTlv('53', '704');
  if (amount) payload += vietQrTlv('54', String(Math.round(amount)));
  payload += vietQrTlv('58', 'VN');
  if (accountName) payload += vietQrTlv('59', removeVietnameseTones(accountName).toUpperCase().slice(0, 25));
  if (purpose) {
    const purposeAscii = removeVietnameseTones(purpose).slice(0, 25);
    payload += vietQrTlv('62', vietQrTlv('08', purposeAscii));
  }
  payload += '6304';
  return payload + crc16CcittFalse(payload);
}

// Vẽ mã QR (thư viện vendor/qrcode.js) từ 1 chuỗi bất kỳ, trả về data URL ảnh
// để nhúng trực tiếp vào <img src="...">, dùng được cả trong cửa sổ in hoá đơn.
function qrPayloadToDataUrl(payload, cellSize) {
  try {
    const qr = qrcode(0, 'M');
    qr.addData(payload);
    qr.make();
    return qr.createDataURL(cellSize || 5, cellSize ? cellSize : 5);
  } catch (e) {
    console.warn('Tạo mã QR lỗi:', e);
    return null;
  }
}

const state = {
  tab: 'dashboard',
  period: 'day',
  customStart: todayStr(),
  customEnd: todayStr(),
  cashPeriod: 'all',
  itemSearch: '',
  itemCategoryFilter: 'all',
  customerSearch: '',
  inventorySearch: '',
  lookupQuery: '',
  dashShowAllItems: false,
  purchasePeriod: 'all',
  purchaseCustomStart: todayStr(),
  purchaseCustomEnd: todayStr(),
  purchaseSearch: '',
  salePeriod: 'all',
  saleCustomStart: todayStr(),
  saleCustomEnd: todayStr(),
  saleSearch: '',
};

const TITLES = {
  dashboard: 'Tổng quan',
  sales: 'Bán hàng',
  purchases: 'Nhập hàng',
  customers: 'Khách hàng',
  more: 'Thêm',
  items: 'Mặt hàng',
  inventory: 'Tồn kho',
  lookup: 'Tra cứu',
  cashflow: 'Thu chi',
  settings: 'Cài đặt',
};

// các tab con nằm trong menu "Thêm"
const MORE_SUBTABS = ['customers', 'inventory', 'lookup', 'cashflow', 'settings'];

let formDraft = {}; // dữ liệu tạm khi đang mở form trong sheet

// ---------------------------------------------------------------------
// INIT & ROUTER
// ---------------------------------------------------------------------
function init() {
  const hashTab = location.hash.replace('#', '');
  if (TITLES[hashTab]) state.tab = hashTab;

  document.getElementById('bottomnav').addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-btn');
    if (!btn) return;
    setTab(btn.dataset.tab);
  });

  document.getElementById('app').addEventListener('click', onAppClick);
  document.getElementById('sheet-content').addEventListener('click', onSheetClick);
  document.getElementById('sheet-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'sheet-overlay') closeSheet();
  });

  document.getElementById('picker-close').addEventListener('click', closePicker);
  document.getElementById('picker-search').addEventListener('input', (e) => {
    renderPickerList(e.target.value);
  });
  document.getElementById('picker-scan').addEventListener('click', () => {
    Scanner.open((code) => {
      const item = DB.getItemByBarcode(code);
      if (item) {
        pickerState.onSelect(item);
        closePicker();
      } else {
        toast('Không tìm thấy mặt hàng có mã: ' + code, true);
      }
    });
  });

  document.getElementById('cust-picker-close').addEventListener('click', closeCustomerPicker);
  document.getElementById('cust-picker-search').addEventListener('input', (e) => {
    renderCustomerPickerList(e.target.value);
  });

  document.getElementById('scanner-close').addEventListener('click', () => Scanner.close());

  render();
  registerServiceWorker();
  bindCloudStatusUI();

  // Đồng bộ dữ liệu mới nhất từ GitHub (nếu đã cấu hình) rồi vẽ lại màn
  // hình — không chặn màn hình đầu tiên, dữ liệu local hiện có vẫn hiện
  // ngay lập tức, sau đó cập nhật lại khi tải xong dữ liệu chung mới nhất.
  if (typeof Cloud !== 'undefined') {
    Cloud.init().then((result) => {
      if (result && result.ok && !result.skipped) {
        render();
      } else if (result && result.notFound) {
        toast('Chưa có dữ liệu chung trên GitHub — vào Cài đặt để khởi tạo đồng bộ', true);
      }
    });
  }
}

// Hiện trạng thái đồng bộ GitHub (nếu có) ở đầu trang, cập nhật theo thời
// gian thực mỗi khi Cloud đổi trạng thái (đang tải/đang đẩy lên/lỗi/xong).
function bindCloudStatusUI() {
  if (typeof Cloud === 'undefined') return;
  const el = document.getElementById('cloud-status');
  if (!el) return;
  const messages = {
    idle: () =>
      Cloud._lastSyncedAt
        ? `✅ Đã đồng bộ lúc ${new Date(Cloud._lastSyncedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
        : '',
    pulling: () => '🔄 Đang tải dữ liệu mới nhất...',
    pushing: () => '🔄 Đang đồng bộ lên GitHub...',
    error: (err) => '⚠️ Lỗi đồng bộ: ' + (err || ''),
    conflict: () => '⚠️ Có cập nhật mới, đang tải lại...',
  };
  function update(status, err) {
    if (!Cloud.isConfigured()) {
      el.textContent = '';
      el.className = 'cloud-status';
      return;
    }
    el.className = 'cloud-status ' + status;
    el.textContent = messages[status] ? messages[status](err) : '';
  }
  Cloud.onStatusChange(update);
  update(Cloud._status);
}

function setTab(tab) {
  state.tab = tab;
  location.hash = tab;
  render();
}

function render() {
  document.getElementById('topbar-title').textContent = TITLES[state.tab] || '';
  document.querySelectorAll('.nav-btn').forEach((b) => {
    const t = b.dataset.tab;
    const isMoreGroup = t === 'more' && (t === state.tab || MORE_SUBTABS.includes(state.tab));
    b.classList.toggle('active', state.tab === t || isMoreGroup);
  });
  const app = document.getElementById('app');
  app.innerHTML = '';
  if (state.tab === 'dashboard') renderDashboard(app);
  else if (state.tab === 'sales') renderSales(app);
  else if (state.tab === 'purchases') renderPurchases(app);
  else if (state.tab === 'customers') renderCustomers(app);
  else if (state.tab === 'more') renderMore(app);
  else if (state.tab === 'items') renderItems(app);
  else if (state.tab === 'inventory') renderInventory(app);
  else if (state.tab === 'lookup') renderLookup(app);
  else if (state.tab === 'cashflow') renderCashflow(app);
  else if (state.tab === 'settings') renderSettings(app);
}

function backToMoreLink() {
  return `<div class="back-link" data-action="go-more">‹ Thêm</div>`;
}

// Xử lý click chung trong #app theo data-action
function onAppClick(e) {
  const t = e.target.closest('[data-action]');
  if (!t) return;
  const action = t.dataset.action;
  const id = t.dataset.id;

  const actions = {
    'go-more': () => setTab('more'),
    'go-tab': () => setTab(t.dataset.tab),
    'set-period': () => { state.period = t.dataset.period; render(); },
    'toggle-dash-items': () => { state.dashShowAllItems = !state.dashShowAllItems; render(); },
    'view-in-stock-items': openInStockItemsSheet,
    'set-purchase-period': () => { state.purchasePeriod = t.dataset.period; render(); },
    'set-sale-period': () => { state.salePeriod = t.dataset.period; render(); },
    'add-item': () => openItemForm(null),
    'edit-item': () => openItemForm(DB.getItem(id)),
    'delete-item': () => {
      if (confirmDialog('Xoá mặt hàng này? (Các lần nhập/bán liên quan vẫn giữ nguyên lịch sử)')) {
        DB.deleteItem(id);
        toast('Đã xoá mặt hàng');
        render();
      }
    },
    'filter-item-category': () => { state.itemCategoryFilter = t.dataset.cat; render(); },
    'view-item-stock': () => openItemStockSheet(t.dataset.name),
    'view-item-detail': () => openItemStockSheetById(id),
    'add-purchase': () => openPurchaseForm(null),
    'edit-purchase': () => openPurchaseForm(DB.getPurchases().find((p) => p.id === id)),
    'delete-purchase': () => {
      if (confirmDialog('Xoá lần nhập hàng này?')) { DB.deletePurchase(id); toast('Đã xoá'); render(); }
    },
    'add-sale': () => openSaleForm(null),
    'edit-sale': () => openSaleForm(DB.getSales().find((s) => s.id === id)),
    'delete-sale': () => {
      if (confirmDialog('Xoá lần bán hàng này?')) { DB.deleteSale(id); toast('Đã xoá'); render(); }
    },
    'print-invoice': () => printInvoice(DB.getSales().find((s) => s.id === id)),
    'add-customer': () => openCustomerForm(null),
    'edit-customer': () => openCustomerForm(DB.getCustomer(id)),
    'view-customer-detail': () => openCustomerDetailSheet(id),
    'delete-customer': () => {
      if (confirmDialog('Xoá khách hàng này? (Lịch sử đơn bán vẫn giữ nguyên)')) {
        DB.deleteCustomer(id);
        toast('Đã xoá khách hàng');
        render();
      }
    },
    'add-transaction': () => openTransactionForm(null),
    'edit-transaction': () => openTransactionForm(DB.getTransactions().find((x) => x.id === id)),
    'delete-transaction': () => {
      if (confirmDialog('Xoá khoản thu/chi này?')) { DB.deleteTransaction(id); toast('Đã xoá'); render(); }
    },
    'set-cash-period': () => { state.cashPeriod = t.dataset.period; render(); },
    'do-backup': doBackup,
    'trigger-restore': () => document.getElementById('restore-file-input').click(),
    'do-clear-all': doClearAll,
    'do-merge-duplicates': doMergeDuplicates,
    'share-customers': shareCustomers,
    'trigger-import': () => document.getElementById(`f-import-${t.dataset.type}`).click(),
    'download-import-template': () => downloadExcelTemplate(t.dataset.type),
    'save-shop-info': () => {
      DB.saveShopInfo({
        ...DB.getShopInfo(),
        name: document.getElementById('f-shop-name').value.trim(),
        phone: document.getElementById('f-shop-phone').value.trim(),
        address: document.getElementById('f-shop-address').value.trim(),
        warranty: document.getElementById('f-shop-warranty').value.trim(),
        bankInfo: document.getElementById('f-shop-bank-info').value.trim(),
        bankCode: document.getElementById('f-shop-bank-code').value,
        bankAccountNo: document.getElementById('f-shop-bank-account').value.trim(),
        bankAccountName: document.getElementById('f-shop-bank-holder').value.trim(),
        qrDynamicAmount: document.getElementById('f-shop-qr-dynamic').checked,
        printPaperSize: document.getElementById('f-shop-print-size').value,
      });
      toast('Đã lưu thông tin cửa hàng');
    },
    'trigger-shop-qr-upload': () => document.getElementById('f-shop-qr-file').click(),
    'remove-shop-qr': () => {
      if (confirmDialog('Xoá ảnh mã QR chuyển khoản?')) {
        const info = DB.getShopInfo();
        delete info.bankQr;
        DB.saveShopInfo(info);
        toast('Đã xoá mã QR');
        const block = document.getElementById('shop-qr-block');
        if (block) block.innerHTML = shopQrBlockHtml(info);
      }
    },
    'cloud-save-config': () => {
      const cfg = {
        owner: document.getElementById('f-cloud-owner').value.trim(),
        repo: document.getElementById('f-cloud-repo').value.trim(),
        branch: document.getElementById('f-cloud-branch').value.trim() || 'main',
        path: document.getElementById('f-cloud-path').value.trim() || 'data/store-data.json',
        token: document.getElementById('f-cloud-token').value.trim(),
      };
      if (!cfg.owner || !cfg.repo || !cfg.token) {
        toast('Vui lòng nhập đủ Owner, Repo, Token', true);
        return;
      }
      Cloud.saveConfig(cfg);
      toast('Đang kết nối...');
      Cloud.pullLatest().then((result) => {
        if (result.ok) {
          toast('✅ Đã kết nối & đồng bộ thành công');
          render();
        } else if (result.notFound) {
          if (
            confirmDialog(
              'Chưa có file dữ liệu trên GitHub. Khởi tạo bằng dữ liệu hiện có trên máy này? (Toàn bộ dữ liệu hiện tại trên máy sẽ trở thành bản dùng chung cho cả nhóm)'
            )
          ) {
            Cloud.push('Khởi tạo dữ liệu ban đầu').then((pushResult) => {
              if (pushResult.ok) {
                toast('✅ Đã khởi tạo dữ liệu trên GitHub');
              } else {
                toast('Lỗi: ' + (pushResult.error || 'không rõ'), true);
              }
              render();
            });
          } else {
            render();
          }
        } else {
          toast('Lỗi kết nối: ' + result.error, true);
          render();
        }
      });
    },
    'cloud-sync-now': () => {
      toast('Đang đồng bộ...');
      Cloud.pullLatest().then((result) => {
        if (result.ok) {
          toast('✅ Đã đồng bộ dữ liệu mới nhất');
          render();
        } else {
          toast('Lỗi đồng bộ: ' + (result.error || 'không rõ'), true);
        }
      });
    },
    'cloud-disconnect': () => {
      if (
        !confirmDialog(
          'Ngắt kết nối đồng bộ GitHub trên máy này? (Dữ liệu trên GitHub không bị xoá, chỉ máy này ngừng tự động đồng bộ)'
        )
      )
        return;
      Cloud.clearConfig();
      toast('Đã ngắt kết nối đồng bộ');
      render();
    },
  };
  if (actions[action]) actions[action]();
}

// ---------------------------------------------------------------------
// SHEET (form trượt lên từ dưới)
// ---------------------------------------------------------------------
function openSheet(html) {
  document.getElementById('sheet-content').innerHTML = html;
  document.getElementById('sheet-overlay').classList.add('open');
}
function closeSheet() {
  document.getElementById('sheet-overlay').classList.remove('open');
  document.getElementById('sheet-content').innerHTML = '';
  formDraft = {};
}
function onSheetClick(e) {
  const t = e.target.closest('[data-action]');
  if (!t) return;
  const action = t.dataset.action;
  const map = {
    'close-sheet': closeSheet,
    'open-item-picker-for-form': () => openPicker((item) => selectFormItem(item)),
    'open-customer-picker-for-sale': () => openCustomerPicker((c) => selectFormCustomer(c)),
    'scan-for-item-barcode-field': () => {
      Scanner.open((code) => {
        document.getElementById('f-item-barcode').value = code;
      });
    },
    'scan-for-item-code-field': () => {
      Scanner.open((code) => {
        document.getElementById('f-item-code').value = code;
      });
    },
    'scan-for-sale-imei': () => {
      Scanner.open((code) => {
        document.getElementById('f-sale-imei').value = code;
        renderSaleImeiSuggestions();
      });
    },
    'pick-sale-imei': () => {
      const input = document.getElementById('f-sale-imei');
      if (!input) return;
      const current = input.value.split(',').map((s) => s.trim()).filter(Boolean);
      const imei = t.dataset.imei;
      const idx = current.findIndex((x) => x.toLowerCase() === imei.toLowerCase());
      if (idx >= 0) current.splice(idx, 1);
      else current.push(imei);
      input.value = current.join(', ');
      renderSaleImeiSuggestions();
    },
    'add-purchase-imei-line': () => {
      syncImeiLinesFromDom();
      formDraft.imeiLines.push('');
      renderImeiLines();
    },
    'remove-purchase-imei-line': () => {
      syncImeiLinesFromDom();
      formDraft.imeiLines.splice(Number(t.dataset.idx), 1);
      if (formDraft.imeiLines.length === 0) formDraft.imeiLines.push('');
      renderImeiLines();
    },
    'scan-purchase-imei-line': () => {
      const idx = Number(t.dataset.idx);
      Scanner.open((code) => {
        syncImeiLinesFromDom();
        formDraft.imeiLines[idx] = code;
        renderImeiLines();
      });
    },
    'edit-item': () => openItemForm(DB.getItem(t.dataset.id)),
    'edit-purchase': () => openPurchaseForm(DB.getPurchases().find((p) => p.id === t.dataset.id)),
    'edit-sale': () => openSaleForm(DB.getSales().find((s) => s.id === t.dataset.id)),
    'edit-customer': () => openCustomerForm(DB.getCustomer(t.dataset.id)),
    'print-invoice': () => printInvoice(DB.getSales().find((s) => s.id === t.dataset.id)),
    'delete-customer': () => {
      if (confirmDialog('Xoá khách hàng này? (Lịch sử đơn bán vẫn giữ nguyên)')) {
        DB.deleteCustomer(t.dataset.id);
        toast('Đã xoá khách hàng');
        closeSheet();
        render();
      }
    },
    'view-item-detail': () => { closeSheet(); openItemStockSheetById(t.dataset.id); },
    'merge-item-group': () => {
      const name = t.dataset.name;
      const inv = computeInventory().filter((x) => (x.item.name || '').trim().toLowerCase() === (name || '').trim().toLowerCase());
      const ids = inv.map((x) => x.item.id);
      if (ids.length < 2) { toast('Không có bản ghi trùng để gộp', true); return; }
      if (
        !confirmDialog(
          `Gộp ${ids.length} bản ghi "${name}" thành 1 mã duy nhất? Toàn bộ lịch sử nhập/bán được giữ nguyên, chỉ gộp mã mặt hàng — không thể hoàn tác trừ khi phục hồi từ backup. Tiếp tục?`
        )
      )
        return;
      mergeItemGroup(ids);
      toast('Đã gộp thành 1 mã');
      closeSheet();
      render();
    },
    'delete-item': () => {
      if (confirmDialog('Xoá mặt hàng này? (Các lần nhập/bán liên quan vẫn giữ nguyên lịch sử)')) {
        DB.deleteItem(t.dataset.id);
        toast('Đã xoá mặt hàng');
        closeSheet();
        render();
      }
    },
    'delete-purchase': () => {
      if (confirmDialog('Huỷ lần nhập hàng này? (Số lượng sẽ trừ khỏi tồn kho)')) {
        const p = DB.getPurchases().find((x) => x.id === t.dataset.id);
        DB.deletePurchase(t.dataset.id);
        toast('Đã huỷ lần nhập hàng');
        closeSheet();
        render();
        if (p) openItemStockSheetById(p.itemId);
      }
    },
    'delete-sale': () => {
      if (confirmDialog('Xoá lần bán hàng này?')) {
        const s = DB.getSales().find((x) => x.id === t.dataset.id);
        DB.deleteSale(t.dataset.id);
        toast('Đã xoá lần bán hàng');
        closeSheet();
        render();
        if (s) openItemStockSheetById(s.itemId);
      }
    },
    'submit-item-form': submitItemForm,
    'submit-purchase-form': submitPurchaseForm,
    'submit-sale-form': submitSaleForm,
    'submit-customer-form': submitCustomerForm,
    'submit-transaction-form': submitTransactionForm,
    'set-tx-type': () => { formDraft.txType = t.dataset.type; refreshTxTypeUI(); },
  };
  if (map[action]) map[action]();
}

// ---------------------------------------------------------------------
// ITEM PICKER (modal chọn mặt hàng)
// ---------------------------------------------------------------------
const pickerState = { onSelect: null };
function openPicker(onSelect) {
  pickerState.onSelect = onSelect;
  document.getElementById('picker-search').value = '';
  renderPickerList('');
  document.getElementById('picker-modal').classList.add('open');
}
function closePicker() {
  document.getElementById('picker-modal').classList.remove('open');
}
function renderPickerList(filter) {
  const items = DB.getItems().filter((i) =>
    !filter || i.name.toLowerCase().includes(filter.toLowerCase()) || (i.barcode || '').includes(filter)
  );
  const list = document.getElementById('picker-list');
  if (items.length === 0) {
    list.innerHTML = `<div class="empty-state">Chưa có mặt hàng nào phù hợp.<br/>Vào "Thêm → Mặt hàng" để thêm trước nhé.</div>`;
    return;
  }
  list.innerHTML = items
    .map(
      (i) => `
    <div class="picker-item" data-action="pick-this-item" data-id="${i.id}" style="display:flex; align-items:center; gap:10px">
      <div class="item-icon">${categoryIcon(i.category)}</div>
      <div style="flex:1">
        <div class="li-title">${escapeHtml(i.name)}</div>
        <div class="li-sub">${i.category ? escapeHtml(i.category) + ' · ' : ''}Nhập: ${formatMoney(i.defaultCostPrice)} · Bán: ${formatMoney(i.defaultSellPrice)}${i.barcode ? ' · Mã: ' + escapeHtml(i.barcode) : ''}</div>
      </div>
    </div>`
    )
    .join('');
  list.querySelectorAll('[data-action="pick-this-item"]').forEach((el) => {
    el.addEventListener('click', () => {
      const item = DB.getItem(el.dataset.id);
      pickerState.onSelect(item);
      closePicker();
    });
  });
}

// ---------------------------------------------------------------------
// CUSTOMER PICKER (modal chọn khách hàng)
// ---------------------------------------------------------------------
const custPickerState = { onSelect: null };
function openCustomerPicker(onSelect) {
  custPickerState.onSelect = onSelect;
  document.getElementById('cust-picker-search').value = '';
  renderCustomerPickerList('');
  document.getElementById('customer-picker-modal').classList.add('open');
}
function closeCustomerPicker() {
  document.getElementById('customer-picker-modal').classList.remove('open');
}
function renderCustomerPickerList(filter) {
  const list = DB.getCustomers().filter(
    (c) => !filter || c.name.toLowerCase().includes(filter.toLowerCase()) || (c.phone || '').includes(filter)
  );
  const el = document.getElementById('cust-picker-list');
  if (list.length === 0) {
    el.innerHTML = `<div class="empty-state">Chưa có khách hàng nào phù hợp.<br/>Vào tab "Khách hàng" để thêm trước nhé.</div>`;
    return;
  }
  el.innerHTML = list
    .map(
      (c) => `
    <div class="picker-item" data-action="pick-this-customer" data-id="${c.id}">
      <div class="li-title">${escapeHtml(c.name)}</div>
      <div class="li-sub">${escapeHtml(c.phone || '')}${c.address ? ' · ' + escapeHtml(c.address) : ''}</div>
    </div>`
    )
    .join('');
  el.querySelectorAll('[data-action="pick-this-customer"]').forEach((elm) => {
    elm.addEventListener('click', () => {
      const c = DB.getCustomer(elm.dataset.id);
      custPickerState.onSelect(c);
      closeCustomerPicker();
    });
  });
}

// ---------------------------------------------------------------------
// DASHBOARD
// ---------------------------------------------------------------------
function computeStats(period) {
  let start, end, label;
  if (period === 'custom') {
    start = state.customStart || todayStr();
    end = state.customEnd || todayStr();
    if (start > end) { const tmp = start; start = end; end = tmp; }
    label = start === end ? formatDateVN(start) : `${formatDateVN(start)} - ${formatDateVN(end)}`;
  } else {
    ({ start, end, label } = getPeriodRange(period));
  }
  const sales = DB.getSales().filter((s) => isInRange(s.date, start, end));
  const purchases = DB.getPurchases().filter((p) => isInRange(p.date, start, end));
  const transactions = DB.getTransactions().filter((t) => isInRange(t.date, start, end));

  let revenue = 0, costOfSold = 0;
  sales.forEach((s) => {
    revenue += s.sellPrice * s.quantity;
    const basis = s.costPriceAtSale != null ? s.costPriceAtSale : 0;
    costOfSold += basis * s.quantity;
  });
  const grossProfit = revenue - costOfSold;
  const purchaseSpend = purchases.reduce((sum, p) => sum + p.costPrice * p.quantity, 0);
  const thuKhac = transactions.filter((t) => t.type === 'thu').reduce((s, t) => s + t.amount, 0);
  const chiKhac = transactions.filter((t) => t.type === 'chi').reduce((s, t) => s + t.amount, 0);
  const netProfit = grossProfit + thuKhac - chiKhac;
  const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const netMarginPct = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  // doanh thu / lợi nhuận theo từng mặt hàng trong kỳ
  const byItem = {};
  sales.forEach((s) => {
    byItem[s.itemId] = byItem[s.itemId] || { qty: 0, revenue: 0, cost: 0 };
    const basis = s.costPriceAtSale != null ? s.costPriceAtSale : 0;
    byItem[s.itemId].qty += s.quantity;
    byItem[s.itemId].revenue += s.sellPrice * s.quantity;
    byItem[s.itemId].cost += basis * s.quantity;
  });
  const itemStats = Object.entries(byItem)
    .map(([itemId, v]) => ({
      item: DB.getItem(itemId),
      qty: v.qty,
      revenue: v.revenue,
      cost: v.cost,
      profit: v.revenue - v.cost,
    }))
    .filter((x) => x.item)
    .sort((a, b) => b.revenue - a.revenue);
  const top = itemStats.slice(0, 5);

  return {
    label, revenue, costOfSold, grossProfit, purchaseSpend, thuKhac, chiKhac, netProfit,
    grossMarginPct, netMarginPct,
    salesCount: sales.length, top, itemStats,
  };
}

function renderDashboard(app) {
  const s = computeStats(state.period);
  const periodBtn = (p, label) =>
    `<button class="${state.period === p ? 'active' : ''}" data-action="set-period" data-period="${p}">${label}</button>`;

  app.innerHTML = `
    <div class="period-tabs">
      ${periodBtn('day', 'Hôm nay')}
      ${periodBtn('week', 'Tuần này')}
      ${periodBtn('month', 'Tháng này')}
      ${periodBtn('all', 'Tất cả')}
      ${periodBtn('custom', '📅 Tuỳ chỉnh')}
    </div>
    ${
      state.period === 'custom'
        ? `<div class="form-row" style="margin-bottom:14px">
      <div class="form-group">
        <label>Từ ngày</label>
        <input type="date" id="f-custom-start" value="${state.customStart}" />
      </div>
      <div class="form-group">
        <label>Đến ngày</label>
        <input type="date" id="f-custom-end" value="${state.customEnd}" />
      </div>
    </div>`
        : ''
    }
    <div class="stat-grid">
      <div class="stat-card wide">
        <div class="label">Lợi nhuận ròng · ${s.label}</div>
        <div class="value ${s.netProfit >= 0 ? 'pos' : 'neg'}">${formatMoney(s.netProfit)}</div>
      </div>
      <div class="stat-card">
        <div class="label">Doanh thu bán hàng</div>
        <div class="value">${formatMoney(s.revenue)}</div>
      </div>
      <div class="stat-card">
        <div class="label">Lợi nhuận gộp</div>
        <div class="value ${s.grossProfit >= 0 ? 'pos' : 'neg'}">${formatMoney(s.grossProfit)}</div>
        <div class="li-sub" style="margin-top:4px">${s.grossMarginPct.toFixed(1)}% doanh thu</div>
      </div>
      <div class="stat-card">
        <div class="label">Tỉ suất LN ròng</div>
        <div class="value ${s.netMarginPct >= 0 ? 'pos' : 'neg'}">${s.netMarginPct.toFixed(1)}%</div>
        <div class="li-sub" style="margin-top:4px">trên doanh thu</div>
      </div>
      <div class="stat-card">
        <div class="label">Tiền nhập hàng</div>
        <div class="value neg">${formatMoney(s.purchaseSpend)}</div>
      </div>
      <div class="stat-card">
        <div class="label">Số đơn bán</div>
        <div class="value">${s.salesCount}</div>
      </div>
      <div class="stat-card">
        <div class="label">Thu khác</div>
        <div class="value pos">${formatMoney(s.thuKhac)}</div>
      </div>
      <div class="stat-card">
        <div class="label">Chi khác</div>
        <div class="value neg">${formatMoney(s.chiKhac)}</div>
      </div>
    </div>
    <div class="section-title" style="display:flex; justify-content:space-between; align-items:baseline">
      <span>💰 Doanh thu theo mặt hàng${s.itemStats.length > 5 ? ` (${s.itemStats.length})` : ''}</span>
      ${
        s.itemStats.length > 5
          ? `<button class="link-btn" data-action="toggle-dash-items" style="font-size:12px; font-weight:600; color:#2563eb; background:none; border:none; padding:0">${
              state.dashShowAllItems ? 'Thu gọn' : 'Xem tất cả'
            }</button>`
          : ''
      }
    </div>
    ${
      s.itemStats.length === 0
        ? '<div class="empty-state">Chưa có dữ liệu bán hàng trong kỳ này.</div>'
        : (state.dashShowAllItems ? s.itemStats : s.top)
            .map(
              (x) => `
      <div class="list-item" data-action="view-item-detail" data-id="${x.item.id}">
        <div class="li-main">
          <div class="li-title">${escapeHtml(x.item.name)}</div>
          <div class="li-sub">Đã bán ${x.qty} · Doanh thu ${formatMoney(x.revenue)} · Lãi <span class="${x.profit >= 0 ? 'pos' : 'neg'}">${formatMoney(x.profit)}</span></div>
        </div>
      </div>`
            )
            .join('')
    }
    <p class="help-text" style="margin-top:14px">* Lợi nhuận gộp tính theo giá nhập tại thời điểm bán (giá nhập gần nhất của mặt hàng khi đó).</p>
  `;

  if (state.period === 'custom') {
    const startEl = document.getElementById('f-custom-start');
    const endEl = document.getElementById('f-custom-end');
    startEl.addEventListener('change', () => {
      state.customStart = startEl.value || state.customStart;
      render();
    });
    endEl.addEventListener('change', () => {
      state.customEnd = endEl.value || state.customEnd;
      render();
    });
  }
}

// ---------------------------------------------------------------------
// ITEMS (Mặt hàng) — có phân loại theo danh mục
// ---------------------------------------------------------------------
function renderItems(app) {
  const allItems = DB.getItems();
  const catsPresent = [...new Set(allItems.map((i) => i.category || 'Khác'))].sort((a, b) => a.localeCompare(b, 'vi'));
  const chips = ['all', ...catsPresent]
    .map((c) => {
      const label = c === 'all' ? '🗂️ Tất cả' : `${categoryIcon(c)} ${c}`;
      return `<button class="chip ${state.itemCategoryFilter === c ? 'active' : ''}" data-action="filter-item-category" data-cat="${escapeHtml(c)}">${escapeHtml(label)}</button>`;
    })
    .join('');

  app.innerHTML = `
    <input type="text" class="searchbox" id="item-search" placeholder="🔍 Tìm mặt hàng..." value="${escapeHtml(state.itemSearch)}" />
    <div class="chip-row">${chips}</div>
    <div id="items-list"></div>
    <button class="fab" data-action="add-item">+</button>
  `;

  // Chỉ cập nhật danh sách kết quả khi gõ tìm kiếm, KHÔNG render lại toàn bộ
  // app.innerHTML — nếu không, ô input bị tạo lại mới mỗi lần gõ, làm mất
  // focus/tắt bàn phím trên điện thoại sau mỗi ký tự.
  function updateItemsList() {
    let items = allItems.filter((i) => !state.itemSearch || i.name.toLowerCase().includes(state.itemSearch.toLowerCase()));
    if (state.itemCategoryFilter !== 'all') {
      items = items.filter((i) => (i.category || 'Khác') === state.itemCategoryFilter);
    }
    const listEl = document.getElementById('items-list');
    if (!listEl) return;
    if (items.length === 0) {
      listEl.innerHTML = `<div class="empty-state">Chưa có mặt hàng nào phù hợp.<br/>Bấm nút + để thêm mặt hàng.</div>`;
    } else {
      // Tra cứu nhanh số đã nhập/đã bán theo từng item id để tính tồn kho.
      const invByItemId = {};
      computeInventory().forEach((x) => { invByItemId[x.item.id] = x; });

      const groups = {};
      items.forEach((i) => {
        const cat = i.category || 'Khác';
        groups[cat] = groups[cat] || [];
        groups[cat].push(i);
      });
      const sortedCats = Object.keys(groups).sort((a, b) => a.localeCompare(b, 'vi'));
      listEl.innerHTML = sortedCats
        .map((cat) => {
          // Gộp các mặt hàng trùng tên (không phân biệt hoa/thường, khoảng
          // trắng đầu/cuối) trong cùng danh mục thành 1 dòng hiển thị, cộng
          // dồn số đã nhập/đã bán để dễ nhìn — vẫn giữ nguyên các bản ghi gốc
          // bên dưới (sửa/xoá từng mục cụ thể qua sheet chi tiết khi có > 1).
          const nameGroups = new Map();
          groups[cat].forEach((i) => {
            const key = (i.name || '').trim().toLowerCase();
            if (!nameGroups.has(key)) nameGroups.set(key, []);
            nameGroups.get(key).push(i);
          });
          const rows = [...nameGroups.values()]
            .sort((a, b) => a[0].name.localeCompare(b[0].name, 'vi'))
            .map((groupItems) => {
              const first = groupItems[0];
              const merged = groupItems.length > 1;
              const purchased = groupItems.reduce((sum, i) => sum + (invByItemId[i.id]?.purchased || 0), 0);
              const sold = groupItems.reduce((sum, i) => sum + (invByItemId[i.id]?.sold || 0), 0);
              const stock = purchased - sold;
              const stockBadge =
                stock <= 0
                  ? '<span class="badge chi">Hết hàng</span>'
                  : stock <= LOW_STOCK_THRESHOLD
                  ? '<span class="badge nhap">Sắp hết</span>'
                  : '<span class="badge ban">Còn hàng</span>';
              return `
          <div class="list-item" data-action="view-item-stock" data-name="${escapeHtml(first.name)}">
            <div class="item-icon">${categoryIcon(first.category)}</div>
            <div class="li-main">
              <div class="li-title">${escapeHtml(first.name)} ${merged ? `<span class="badge nhap">🔗 Gộp ${groupItems.length}</span>` : ''}</div>
              <div class="li-sub">Nhập ${formatMoney(first.defaultCostPrice)} · Bán ${formatMoney(first.defaultSellPrice)}${first.barcode && !merged ? ' · #' + escapeHtml(first.barcode) : ''}</div>
              ${!merged && (first.productCode || first.model) ? `<div class="li-sub">${first.productCode ? '🏷️ Mã SP: ' + escapeHtml(first.productCode) : ''}${first.productCode && first.model ? ' · ' : ''}${first.model ? '📱 Model: ' + escapeHtml(first.model) : ''}</div>` : ''}
              <div class="li-sub">Đã nhập ${purchased} · Đã bán ${sold} · Tồn ${stock} ${stockBadge}</div>
            </div>
            ${
              merged
                ? ''
                : `<div class="li-actions">
              <button class="icon-btn" data-action="edit-item" data-id="${first.id}">✏️</button>
              <button class="icon-btn" data-action="delete-item" data-id="${first.id}">🗑️</button>
            </div>`
            }
          </div>`;
            })
            .join('');
          return `<div class="section-title">${categoryIcon(cat)} ${escapeHtml(cat)} (${nameGroups.size})</div>${rows}`;
        })
        .join('');
    }
  }

  updateItemsList();

  document.getElementById('item-search').addEventListener('input', (e) => {
    state.itemSearch = e.target.value;
    updateItemsList();
  });
}

// Bottom sheet hiển thị chi tiết tồn kho khi bấm vào 1 dòng mặt hàng trong
// danh sách — gộp số liệu của tất cả bản ghi trùng tên (nếu có), và nếu có
// hơn 1 bản ghi thì liệt kê từng bản ghi gốc kèm nút sửa/xoá riêng.
// Tách danh sách IMEI/số seri của 1 nhóm itemId thành 2 phần: còn tồn kho
// (chưa bán) và đã bán (kèm thông tin lần bán tương ứng để biết bán ngày
// nào) — dùng để hiện rõ ràng ở sheet chi tiết sản phẩm, tránh nhầm lẫn giữa
// máy còn hàng và máy đã hết khi xem ở màn hình Tồn kho.
function getImeiBreakdownForItems(itemIds) {
  const purchasedImeis = [];
  DB.getPurchases()
    .filter((p) => itemIds.includes(p.itemId))
    .forEach((p) => {
      (p.imei || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((im) => purchasedImeis.push(im));
    });
  const soldMap = new Map();
  DB.getSales()
    .filter((s) => itemIds.includes(s.itemId))
    .forEach((s) => {
      (s.imei || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
        .forEach((im) => {
          if (!soldMap.has(im.toLowerCase())) soldMap.set(im.toLowerCase(), s);
        });
    });
  const available = [];
  const sold = [];
  purchasedImeis.forEach((im) => {
    const saleRec = soldMap.get(im.toLowerCase());
    if (saleRec) sold.push({ imei: im, sale: saleRec });
    else available.push(im);
  });
  return { available, sold };
}

// Gộp thật sự nhiều bản ghi mặt hàng trùng tên thành 1 mã duy nhất: chuyển
// toàn bộ phiếu nhập/bán của các mã bị gộp sang mã "chính" (mã tạo sớm nhất),
// tự backfill các trường còn thiếu (mã vạch/mã SP/model/giá mặc định) từ các
// bản ghi kia, rồi xoá các bản ghi thừa. KHÔNG đụng tới lịch sử nhập/bán —
// chỉ đổi itemId của từng dòng sang mã chính, số liệu tồn kho/lãi giữ nguyên.
function mergeItemGroup(itemIds) {
  const items = itemIds.map((id) => DB.getItem(id)).filter(Boolean);
  if (items.length < 2) return null;
  items.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const primary = { ...items[0] };
  const others = items.slice(1);
  others.forEach((o) => {
    if (!primary.barcode && o.barcode) primary.barcode = o.barcode;
    if (!primary.productCode && o.productCode) primary.productCode = o.productCode;
    if (!primary.model && o.model) primary.model = o.model;
    if (!primary.note && o.note) primary.note = o.note;
    if (!primary.defaultCostPrice && o.defaultCostPrice) primary.defaultCostPrice = o.defaultCostPrice;
    if (!primary.defaultSellPrice && o.defaultSellPrice) primary.defaultSellPrice = o.defaultSellPrice;
  });
  const otherIds = others.map((o) => o.id);
  DB.getPurchases().forEach((p) => {
    if (otherIds.includes(p.itemId)) DB.savePurchase({ ...p, itemId: primary.id });
  });
  DB.getSales().forEach((s) => {
    if (otherIds.includes(s.itemId)) DB.saveSale({ ...s, itemId: primary.id });
  });
  primary.lastCostPrice = getLatestCostPrice(primary.id) || primary.lastCostPrice;
  DB.saveItem(primary);
  otherIds.forEach((id) => DB.deleteItem(id));
  return primary.id;
}

// Gộp toàn bộ các nhóm mặt hàng đang bị trùng tên trong cả danh mục (dùng
// cho nút "Gộp tất cả" ở Cài đặt) — tìm mọi nhóm có >1 bản ghi rồi gộp từng
// nhóm bằng mergeItemGroup ở trên.
function mergeAllDuplicateItems() {
  const groups = new Map();
  DB.getItems().forEach((i) => {
    const key = (i.name || '').trim().toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(i);
  });
  const dupGroups = [...groups.values()].filter((g) => g.length > 1);
  let removed = 0;
  dupGroups.forEach((g) => {
    mergeItemGroup(g.map((i) => i.id));
    removed += g.length - 1;
  });
  return { groupCount: dupGroups.length, removed };
}

function doMergeDuplicates() {
  const groups = new Map();
  DB.getItems().forEach((i) => {
    const key = (i.name || '').trim().toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(i);
  });
  const dupGroups = [...groups.values()].filter((g) => g.length > 1);
  if (dupGroups.length === 0) {
    toast('Không có mặt hàng nào đang trùng tên cần gộp');
    return;
  }
  const totalRecords = dupGroups.reduce((s, g) => s + g.length, 0);
  if (
    !confirmDialog(
      `Tìm thấy ${dupGroups.length} nhóm mặt hàng trùng tên (tổng ${totalRecords} mã), sẽ gộp mỗi nhóm còn đúng 1 mã. Toàn bộ lịch sử nhập/bán được giữ nguyên, chỉ gộp mã mặt hàng — không thể hoàn tác trừ khi phục hồi từ backup. Tiếp tục?`
    )
  )
    return;
  const { groupCount, removed } = mergeAllDuplicateItems();
  toast(`Đã gộp ${groupCount} nhóm, giảm ${removed} mã trùng`);
  render();
}

function openItemStockSheet(name) {
  const key = (name || '').trim().toLowerCase();
  const inv = computeInventory().filter((x) => (x.item.name || '').trim().toLowerCase() === key);
  if (inv.length === 0) {
    toast('Không tìm thấy mặt hàng', true);
    return;
  }
  const first = inv[0].item;
  const totalPurchased = inv.reduce((s, x) => s + x.purchased, 0);
  const totalSold = inv.reduce((s, x) => s + x.sold, 0);
  const totalStock = totalPurchased - totalSold;
  const stockBadge =
    totalStock <= 0
      ? '<span class="badge chi">Hết hàng</span>'
      : totalStock <= LOW_STOCK_THRESHOLD
      ? '<span class="badge nhap">Sắp hết</span>'
      : '<span class="badge ban">Còn hàng</span>';

  const itemIds = inv.map((x) => x.item.id);

  // Danh sách IMEI/số seri — tách rõ còn tồn kho vs đã bán, để bấm vào sản
  // phẩm ở Tồn kho là biết ngay máy nào còn máy nào hết, khỏi phải đoán.
  const { available: availableImeis, sold: soldImeis } = getImeiBreakdownForItems(itemIds);
  const imeiSectionHtml =
    availableImeis.length === 0 && soldImeis.length === 0
      ? ''
      : `
    <div class="section-title" style="margin-top:18px">🔢 IMEI / Số seri (${availableImeis.length + soldImeis.length})</div>
    ${
      availableImeis.length > 0
        ? `<p class="help-text" style="margin:0 0 6px">✅ Còn tồn kho (${availableImeis.length}):</p>
      <div class="chip-row" style="flex-wrap:wrap; margin-bottom:10px">
        ${availableImeis.map((im) => `<span class="chip" style="background:#dcfce7; border-color:#16a34a; color:#15803d">${escapeHtml(im)}</span>`).join('')}
      </div>`
        : ''
    }
    ${
      soldImeis.length > 0
        ? `<p class="help-text" style="margin:0 0 6px">❌ Đã bán (${soldImeis.length}):</p>
      <div class="chip-row" style="flex-wrap:wrap">
        ${soldImeis
          .map(
            ({ imei, sale }) =>
              `<span class="chip" style="background:#fee2e2; border-color:#dc2626; color:#b91c1c" title="Bán ngày ${formatDateVN(sale.date)}">${escapeHtml(imei)} · ${formatDateVN(sale.date)}</span>`
          )
          .join('')}
      </div>`
        : ''
    }
  `;

  // Giá nhập / giá bán — hiện đầy đủ cho TỪNG bản ghi gốc, không gộp/trung
  // bình dù sản phẩm bị gộp theo tên (mỗi bản ghi có thể có giá mặc định
  // khác nhau, ví dụ nhập nhiều đợt với giá khác nhau).
  const priceRowsHtml = inv
    .map((x) => {
      const i = x.item;
      const st = x.purchased - x.sold;
      return `
      <div class="list-item">
        <div class="item-icon">${categoryIcon(i.category)}</div>
        <div class="li-main">
          <div class="li-title">${escapeHtml(i.category || 'Khác')}${i.barcode ? ' · #' + escapeHtml(i.barcode) : ''}</div>
          <div class="li-sub">Giá nhập ${formatMoney(i.defaultCostPrice)} · Giá bán ${formatMoney(i.defaultSellPrice)}</div>
          <div class="li-sub">Đã nhập ${x.purchased} · Đã bán ${x.sold} · Tồn ${st}</div>
        </div>
        <div class="li-actions">
          <button class="icon-btn" data-action="edit-item" data-id="${i.id}">✏️</button>
          <button class="icon-btn" data-action="delete-item" data-id="${i.id}">🗑️</button>
        </div>
      </div>`;
    })
    .join('');

  // Lịch sử nhập hàng — từng lô giữ NGUYÊN giá riêng của lần nhập đó, không
  // bị chia lại theo giá trung bình khi tổng kết cuối tháng.
  const purchaseHistory = DB.getPurchases()
    .filter((p) => itemIds.includes(p.itemId))
    .sort((a, b) => b.date.localeCompare(a.date));
  const purchaseHistoryHtml =
    purchaseHistory.length === 0
      ? '<div class="empty-state" style="padding:16px">Chưa có lần nhập hàng nào.</div>'
      : purchaseHistory
          .map(
            (p) => `
      <div class="list-item">
        <div class="li-main">
          <div class="li-title">${formatDateVN(p.date)} <span class="badge nhap">Nhập</span></div>
          <div class="li-sub">SL ${p.quantity} × ${formatMoney(p.costPrice)} = ${formatMoney(p.costPrice * p.quantity)}${p.note ? ' · ' + escapeHtml(p.note) : ''}</div>
          ${p.imei ? `<div class="li-sub">🔢 ${escapeHtml(p.imei)}</div>` : ''}
        </div>
        <div class="li-actions">
          <button class="icon-btn" data-action="edit-purchase" data-id="${p.id}">✏️</button>
          <button class="icon-btn" data-action="delete-purchase" data-id="${p.id}">🗑️</button>
        </div>
      </div>`
          )
          .join('');

  // Lịch sử bán hàng — giá vốn tại thời điểm bán được cố định lúc bán (xem
  // costPriceAtSale), không thay đổi kể cả khi giá nhập mặt hàng đổi sau đó.
  const saleHistory = DB.getSales()
    .filter((s) => itemIds.includes(s.itemId))
    .sort((a, b) => b.date.localeCompare(a.date));
  const saleHistoryHtml =
    saleHistory.length === 0
      ? '<div class="empty-state" style="padding:16px">Chưa có lần bán nào.</div>'
      : saleHistory
          .map((s) => {
            const profit = (s.sellPrice - (s.costPriceAtSale || 0)) * s.quantity;
            return `
      <div class="list-item">
        <div class="li-main">
          <div class="li-title">${formatDateVN(s.date)} <span class="badge ban">Bán</span></div>
          <div class="li-sub">SL ${s.quantity} × ${formatMoney(s.sellPrice)} = ${formatMoney(s.sellPrice * s.quantity)}</div>
          <div class="li-sub">Giá vốn lúc bán ${formatMoney(s.costPriceAtSale || 0)} · Lãi ${formatMoney(profit)}</div>
          ${s.imei ? `<div class="li-sub">🔢 ${escapeHtml(s.imei)}</div>` : ''}
        </div>
        <div class="li-actions">
          <button class="icon-btn" data-action="edit-sale" data-id="${s.id}">✏️</button>
          <button class="icon-btn" data-action="delete-sale" data-id="${s.id}">🗑️</button>
        </div>
      </div>`;
          })
          .join('');

  const editDeleteBtnRow =
    inv.length === 1
      ? `<div class="btn-row">
      <button class="btn btn-secondary" data-action="edit-item" data-id="${first.id}">✏️ Sửa mặt hàng</button>
      <button class="btn btn-danger" data-action="delete-item" data-id="${first.id}">🗑️ Xoá</button>
    </div>`
      : `<div class="btn-row">
      <button class="btn btn-primary" data-action="merge-item-group" data-name="${escapeHtml(first.name)}">🔗 Gộp ${inv.length} bản ghi thành 1 mã</button>
    </div>`;

  openSheet(`
    <div class="sheet-title">📦 ${escapeHtml(first.name)}</div>
    ${
      first.productCode || first.model
        ? `<p class="help-text" style="margin-top:-8px">${first.productCode ? '🏷️ Mã SP: ' + escapeHtml(first.productCode) : ''}${first.productCode && first.model ? ' · ' : ''}${first.model ? '📱 Model: ' + escapeHtml(first.model) : ''}</p>`
        : ''
    }
    <div class="stat-grid">
      <div class="stat-card">
        <div class="label">Đã nhập</div>
        <div class="value">${totalPurchased}</div>
      </div>
      <div class="stat-card">
        <div class="label">Đã bán</div>
        <div class="value">${totalSold}</div>
      </div>
      <div class="stat-card wide">
        <div class="label">Tồn kho hiện tại</div>
        <div class="value ${totalStock <= 0 ? 'neg' : 'pos'}">${totalStock} ${stockBadge}</div>
      </div>
    </div>
    ${imeiSectionHtml}
    <div class="section-title" style="margin-top:18px">💰 Giá nhập / giá bán${inv.length > 1 ? ` (${inv.length} bản ghi)` : ''}</div>
    ${priceRowsHtml}
    ${editDeleteBtnRow}
    <div class="section-title" style="margin-top:18px">📥 Lịch sử nhập hàng (${purchaseHistory.length})</div>
    ${purchaseHistoryHtml}
    <div class="section-title" style="margin-top:18px">💵 Lịch sử bán hàng (${saleHistory.length})</div>
    ${saleHistoryHtml}
    <div class="btn-row" style="margin-top:18px">
      <button class="btn btn-secondary" data-action="close-sheet">Đóng</button>
    </div>
  `);
}

// Mở sheet chi tiết sản phẩm theo itemId cụ thể (dùng ở danh sách Nhập
// hàng/Bán hàng) — quy về cùng 1 sheet theo tên để giữ đồng nhất hành vi gộp
// sản phẩm trùng tên với màn hình Mặt hàng.
function openItemStockSheetById(id) {
  const item = DB.getItem(id);
  if (!item) {
    toast('Không tìm thấy mặt hàng (có thể đã bị xoá)', true);
    return;
  }
  openItemStockSheet(item.name);
}

// ---------------------------------------------------------------------
// INVENTORY (Tồn kho) — tự động tính từ lịch sử nhập/bán
// ---------------------------------------------------------------------
const LOW_STOCK_THRESHOLD = 2;

function computeInventory() {
  const items = DB.getItems();
  const purchasedByItem = {};
  DB.getPurchases().forEach((p) => {
    purchasedByItem[p.itemId] = (purchasedByItem[p.itemId] || 0) + p.quantity;
  });
  const soldByItem = {};
  DB.getSales().forEach((s) => {
    soldByItem[s.itemId] = (soldByItem[s.itemId] || 0) + s.quantity;
  });
  // Giá trị tồn kho hiện tại: tính theo FIFO trên đúng giá nhập của từng lô
  // (trừ dần số đã bán từ lô nhập cũ nhất trước) — KHÔNG chia bình quân giá,
  // giữ đúng nguyên tắc "giá nhập cố định theo từng lần nhập" của cửa hàng.
  const purchasesByItem = {};
  DB.getPurchases().forEach((p) => {
    (purchasesByItem[p.itemId] = purchasesByItem[p.itemId] || []).push(p);
  });
  return items.map((item) => {
    const purchased = purchasedByItem[item.id] || 0;
    const sold = soldByItem[item.id] || 0;
    const stock = purchased - sold;
    let stockValue = 0;
    if (stock > 0) {
      const lots = (purchasesByItem[item.id] || [])
        .slice()
        .sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.createdAt || 0) - (b.createdAt || 0));
      let toSkip = sold;
      lots.forEach((p) => {
        let qty = p.quantity;
        if (toSkip > 0) {
          const skip = Math.min(toSkip, qty);
          qty -= skip;
          toSkip -= skip;
        }
        if (qty > 0) stockValue += qty * (p.costPrice || 0);
      });
    }
    return { item, purchased, sold, stock, stockValue };
  });
}

// Bấm vào thẻ "Giá trị hàng đang tồn" ở Tồn kho -> hiện luôn danh sách các
// mặt hàng đang còn tồn kho (liên kết mọi nơi để dễ kiểm soát), mỗi dòng bấm
// vào lại mở chi tiết mặt hàng đó.
function openInStockItemsSheet() {
  const inv = computeInventory()
    .filter((x) => x.stock > 0)
    .sort((a, b) => b.stockValue - a.stockValue);
  const total = inv.reduce((s, x) => s + x.stockValue, 0);
  const rowsHtml =
    inv.length === 0
      ? '<div class="empty-state">Không có mặt hàng nào đang tồn kho.</div>'
      : inv
          .map(
            (x) => `
      <div class="list-item" data-action="view-item-detail" data-id="${x.item.id}">
        <div class="item-icon">${categoryIcon(x.item.category)}</div>
        <div class="li-main">
          <div class="li-title">${escapeHtml(x.item.name)}</div>
          <div class="li-sub">Tồn ${x.stock} ${escapeHtml(x.item.unit || '')} · Trị giá ${formatMoney(x.stockValue)}</div>
        </div>
      </div>`
          )
          .join('');
  openSheet(`
    <div class="sheet-title">📦 Mặt hàng đang tồn kho (${inv.length})</div>
    <div class="stat-grid" style="margin-bottom:10px">
      <div class="stat-card wide">
        <div class="label">Tổng giá trị đang tồn</div>
        <div class="value">${formatMoney(total)}</div>
      </div>
    </div>
    ${rowsHtml}
    <div class="btn-row"><button data-action="close-sheet">Đóng</button></div>
  `);
}

// Giá nhập gần nhất THỰC SỰ của 1 mặt hàng — tính trực tiếp từ lịch sử nhập
// hàng theo NGÀY nhập (bản ghi có ngày mới nhất, không phải bản ghi được
// lưu/sửa gần đây nhất), để khi bán hàng luôn lấy đúng giá của lô nhập mới
// nhất thay vì bị lệch nếu ai đó sửa lại 1 lần nhập cũ trước đó. Mỗi lần nhập
// vẫn giữ nguyên giá riêng của nó (xem DB.getPurchases()) — hàm này chỉ dùng
// để gợi ý giá vốn khi tạo 1 lần bán mới, không hề gộp hay chia trung bình.
function getLatestCostPrice(itemId) {
  const purchases = DB.getPurchases().filter((p) => p.itemId === itemId);
  if (purchases.length > 0) {
    purchases.sort((a, b) => {
      const byDate = (a.date || '').localeCompare(b.date || '');
      if (byDate !== 0) return byDate;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });
    return purchases[purchases.length - 1].costPrice || 0;
  }
  const item = DB.getItem(itemId);
  return item?.defaultCostPrice || 0;
}

function renderInventory(app) {
  const all = computeInventory();
  const outCount = all.filter((x) => x.stock <= 0).length;
  const lowCount = all.filter((x) => x.stock > 0 && x.stock <= LOW_STOCK_THRESHOLD).length;
  const totalStockValue = all.reduce((s, x) => s + (x.stockValue || 0), 0);

  app.innerHTML = `
    ${backToMoreLink()}
    <input type="text" class="searchbox" id="inventory-search" placeholder="🔍 Tìm mặt hàng tồn kho..." value="${escapeHtml(state.inventorySearch || '')}" />
    <div class="stat-grid" style="margin-bottom:14px">
      <div class="stat-card wide" data-action="view-in-stock-items" style="cursor:pointer">
        <div class="label">💰 Giá trị hàng đang tồn (theo giá nhập) · bấm để xem chi tiết</div>
        <div class="value">${formatMoney(totalStockValue)}</div>
      </div>
      <div class="stat-card">
        <div class="label">Hết hàng</div>
        <div class="value neg">${outCount}</div>
      </div>
      <div class="stat-card">
        <div class="label">Sắp hết (≤ ${LOW_STOCK_THRESHOLD})</div>
        <div class="value" style="color:#b45309">${lowCount}</div>
      </div>
    </div>
    <div id="inventory-list"></div>
  `;

  // Chỉ cập nhật danh sách kết quả khi gõ tìm kiếm, KHÔNG render lại toàn bộ
  // app.innerHTML — tránh tạo lại ô input mỗi lần gõ (mất focus/tắt bàn phím).
  function updateInventoryList() {
    const q = (state.inventorySearch || '').toLowerCase();
    const inv = all.filter((x) => !q || x.item.name.toLowerCase().includes(q));
    const listEl = document.getElementById('inventory-list');
    if (!listEl) return;
    if (inv.length === 0) {
      listEl.innerHTML = `<div class="empty-state">Không có mặt hàng nào phù hợp.</div>`;
    } else {
      const groups = {};
      inv.forEach((x) => {
        const cat = x.item.category || 'Khác';
        groups[cat] = groups[cat] || [];
        groups[cat].push(x);
      });
      const sortedCats = Object.keys(groups).sort((a, b) => a.localeCompare(b, 'vi'));
      listEl.innerHTML = sortedCats
        .map(
          (cat) => `
        <div class="section-title">${categoryIcon(cat)} ${escapeHtml(cat)}</div>
        ${groups[cat]
          .map((x) => {
            const badge =
              x.stock <= 0
                ? '<span class="badge chi">Hết hàng</span>'
                : x.stock <= LOW_STOCK_THRESHOLD
                ? '<span class="badge nhap">Sắp hết</span>'
                : '';
            return `
          <div class="list-item" data-action="view-item-detail" data-id="${x.item.id}">
            <div class="item-icon">${categoryIcon(x.item.category)}</div>
            <div class="li-main">
              <div class="li-title">${escapeHtml(x.item.name)} ${badge}</div>
              <div class="li-sub">Đã nhập ${x.purchased} · Đã bán ${x.sold}${x.stock > 0 ? ' · Trị giá tồn ' + formatMoney(x.stockValue) : ''}</div>
            </div>
            <div class="li-main" style="flex:0">
              <div class="li-amount ${x.stock <= 0 ? 'neg' : ''}">${x.stock} ${escapeHtml(x.item.unit || '')}</div>
            </div>
          </div>`;
          })
          .join('')}`
        )
        .join('');
    }
  }

  updateInventoryList();

  document.getElementById('inventory-search').addEventListener('input', (e) => {
    state.inventorySearch = e.target.value;
    updateInventoryList();
  });
}

// ---------------------------------------------------------------------
// LOOKUP (Tra cứu theo IMEI / SĐT khách)
// ---------------------------------------------------------------------
function renderLookup(app) {
  const raw = state.lookupQuery || '';

  app.innerHTML = `
    ${backToMoreLink()}
    <input type="text" class="searchbox" id="lookup-search" placeholder="🔍 Nhập IMEI/số seri, SĐT hoặc tên khách..." value="${escapeHtml(raw)}" />
    <div id="lookup-results"></div>
  `;

  // Chỉ cập nhật phần kết quả khi gõ tìm kiếm, KHÔNG render lại toàn bộ
  // app.innerHTML — nếu không, ô input bị tạo lại mới mỗi lần gõ khiến mất
  // focus và tự tắt bàn phím trên điện thoại chỉ sau 1 ký tự.
  function updateLookupResults() {
    const q = (state.lookupQuery || '').trim().toLowerCase();
    const resultsEl = document.getElementById('lookup-results');
    if (!resultsEl) return;

    if (!q) {
      resultsEl.innerHTML = `<div class="empty-state">Nhập số IMEI/seri máy, số điện thoại hoặc tên khách hàng để tra cứu nhanh lịch sử nhập/bán liên quan.</div>`;
      return;
    }

    const sales = DB.getSales().filter(
      (s) =>
        (s.imei || '').toLowerCase().includes(q) ||
        (s.customerPhone || '').toLowerCase().includes(q) ||
        (s.customerName || '').toLowerCase().includes(q)
    );
    const purchases = DB.getPurchases().filter((p) => (p.imei || '').toLowerCase().includes(q));
    const customers = DB.getCustomers().filter(
      (c) => (c.phone || '').toLowerCase().includes(q) || (c.name || '').toLowerCase().includes(q)
    );

    if (sales.length === 0 && purchases.length === 0 && customers.length === 0) {
      resultsEl.innerHTML = `<div class="empty-state">Không tìm thấy kết quả nào phù hợp với "${escapeHtml(state.lookupQuery || '')}".</div>`;
      return;
    }

    let html = '';
    if (customers.length) {
      html += `<div class="section-title">👤 Khách hàng (${customers.length})</div>`;
      html += customers
        .map(
          (c) => `
        <div class="list-item">
          <div class="li-main">
            <div class="li-title">${escapeHtml(c.name)}</div>
            <div class="li-sub">${escapeHtml(c.phone || '')}${c.address ? ' · ' + escapeHtml(c.address) : ''}</div>
          </div>
        </div>`
        )
        .join('');
    }
    if (sales.length) {
      html += `<div class="section-title">💵 Lần bán liên quan (${sales.length})</div>`;
      html += sales
        .map((s) => {
          const item = DB.getItem(s.itemId);
          return `
        <div class="list-item">
          <div class="item-icon">${categoryIcon(item?.category)}</div>
          <div class="li-main">
            <div class="li-title">${escapeHtml(item ? item.name : '(Mặt hàng đã xoá)')}</div>
            <div class="li-sub">${formatDateVN(s.date)} · SL ${s.quantity} × ${formatMoney(s.sellPrice)}</div>
            <div class="li-sub">👤 ${escapeHtml(s.customerName || 'Khách lẻ')}${s.customerPhone ? ' · ' + escapeHtml(s.customerPhone) : ''}</div>
            ${s.imei ? `<div class="li-sub">🔢 IMEI: ${escapeHtml(s.imei)}</div>` : ''}
          </div>
          <div class="li-actions">
            <button class="icon-btn" data-action="print-invoice" data-id="${s.id}">🖨️</button>
          </div>
        </div>`;
        })
        .join('');
    }
    if (purchases.length) {
      html += `<div class="section-title">📥 Lần nhập liên quan (${purchases.length})</div>`;
      html += purchases
        .map((p) => {
          const item = DB.getItem(p.itemId);
          return `
        <div class="list-item">
          <div class="item-icon">${categoryIcon(item?.category)}</div>
          <div class="li-main">
            <div class="li-title">${escapeHtml(item ? item.name : '(Mặt hàng đã xoá)')}</div>
            <div class="li-sub">${formatDateVN(p.date)} · SL ${p.quantity} × ${formatMoney(p.costPrice)}</div>
            ${p.imei ? `<div class="li-sub">🔢 IMEI: ${escapeHtml(p.imei)}</div>` : ''}
          </div>
        </div>`;
        })
        .join('');
    }
    resultsEl.innerHTML = html;
  }

  updateLookupResults();

  document.getElementById('lookup-search').addEventListener('input', (e) => {
    state.lookupQuery = e.target.value;
    updateLookupResults();
  });
}

function openItemForm(item) {
  const isEdit = !!item;
  formDraft.editId = item ? item.id : null;
  const cat = item?.category || '';
  const isCustomCat = cat && !CATEGORIES.includes(cat);
  openSheet(`
    <div class="sheet-title">${isEdit ? 'Sửa mặt hàng' : 'Thêm mặt hàng mới'}</div>
    <div class="form-group">
      <label>Tên mặt hàng *</label>
      <input type="text" id="f-item-name" value="${escapeHtml(item?.name || '')}" placeholder="VD: Tai nghe Bluetooth ABC" />
    </div>
    <div class="form-group">
      <label>Danh mục</label>
      <select id="f-item-category">
        <option value="">-- Chọn danh mục --</option>
        ${CATEGORIES.map((c) => `<option value="${c}" ${c === cat || (isCustomCat && c === 'Khác') ? 'selected' : ''}>${c}</option>`).join('')}
      </select>
    </div>
    <div class="form-group" id="f-item-category-custom-wrap" style="display:${cat === 'Khác' || isCustomCat ? 'block' : 'none'}">
      <label>Tên danh mục khác</label>
      <input type="text" id="f-item-category-custom" value="${escapeHtml(isCustomCat ? cat : '')}" placeholder="VD: Bếp từ, Máy sấy..." />
    </div>
    <div class="form-group">
      <label>Mã vạch / QR (tuỳ chọn)</label>
      <div class="input-with-btn">
        <input type="text" id="f-item-barcode" value="${escapeHtml(item?.barcode || '')}" placeholder="Quét hoặc nhập tay" />
        <button type="button" data-action="scan-for-item-barcode-field">📷</button>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Mã sản phẩm (tuỳ chọn)</label>
        <div class="input-with-btn">
          <input type="text" id="f-item-code" value="${escapeHtml(item?.productCode || '')}" placeholder="Quét hoặc nhập tay" />
          <button type="button" data-action="scan-for-item-code-field">📷</button>
        </div>
      </div>
      <div class="form-group">
        <label>Model (tuỳ chọn)</label>
        <input type="text" id="f-item-model" value="${escapeHtml(item?.model || '')}" placeholder="VD: L13-ABC" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Giá nhập mặc định</label>
        <input type="number" id="f-item-cost" value="${item?.defaultCostPrice ?? ''}" placeholder="0" min="0" />
      </div>
      <div class="form-group">
        <label>Giá bán mặc định</label>
        <input type="number" id="f-item-sell" value="${item?.defaultSellPrice ?? ''}" placeholder="0" min="0" />
      </div>
    </div>
    <div class="form-group">
      <label>Đơn vị tính</label>
      <input type="text" id="f-item-unit" value="${escapeHtml(item?.unit || 'cái')}" placeholder="cái, hộp, chiếc..." />
    </div>
    <div class="form-group">
      <label>Ghi chú</label>
      <textarea id="f-item-note">${escapeHtml(item?.note || '')}</textarea>
    </div>
    <div class="btn-row">
      <button class="btn btn-secondary" data-action="close-sheet">Huỷ</button>
      <button class="btn btn-primary" data-action="submit-item-form">Lưu</button>
    </div>
  `);
  document.getElementById('f-item-category').addEventListener('change', (e) => {
    document.getElementById('f-item-category-custom-wrap').style.display = e.target.value === 'Khác' ? 'block' : 'none';
  });
}

function submitItemForm() {
  const name = document.getElementById('f-item-name').value.trim();
  if (!name) { toast('Vui lòng nhập tên mặt hàng', true); return; }
  let category = document.getElementById('f-item-category').value;
  if (category === 'Khác') {
    const custom = document.getElementById('f-item-category-custom').value.trim();
    if (custom) category = custom;
  }
  const item = {
    id: formDraft.editId,
    name,
    category,
    barcode: document.getElementById('f-item-barcode').value.trim(),
    productCode: document.getElementById('f-item-code').value.trim(),
    model: document.getElementById('f-item-model').value.trim(),
    defaultCostPrice: parseMoneyInput(document.getElementById('f-item-cost').value),
    defaultSellPrice: parseMoneyInput(document.getElementById('f-item-sell').value),
    unit: document.getElementById('f-item-unit').value.trim() || 'cái',
    note: document.getElementById('f-item-note').value.trim(),
  };
  if (formDraft.editId) {
    const old = DB.getItem(formDraft.editId);
    item.lastCostPrice = old?.lastCostPrice;
    item.createdAt = old?.createdAt;
  }
  DB.saveItem(item);
  toast('Đã lưu mặt hàng');
  closeSheet();
  render();
}

// ---------------------------------------------------------------------
// PURCHASES (Nhập hàng)
// ---------------------------------------------------------------------
// Gộp 1 danh sách bản ghi (đã có trường .date dạng yyyy-mm-dd, sắp xếp mới
// nhất trước) thành các nhóm theo ngày, giữ nguyên thứ tự — dùng chung cho
// danh sách Nhập hàng & Bán hàng để dễ nhìn hơn thay vì hiện phẳng hết.
// Bộ lọc theo khoảng thời gian (ngày/tuần/tháng/tất cả/tuỳ chỉnh) dùng chung
// cho các màn Nhập hàng / Bán hàng — giúp tra cứu theo mốc thời gian dễ hơn,
// tương tự cách lọc ở Tổng quan.
function getStateDateRange(prefix) {
  const period = state[prefix + 'Period'];
  if (period === 'custom') {
    let start = state[prefix + 'CustomStart'] || todayStr();
    let end = state[prefix + 'CustomEnd'] || todayStr();
    if (start > end) { const tmp = start; start = end; end = tmp; }
    return { start, end };
  }
  return getPeriodRange(period);
}
function filterRowsByPeriodState(rows, prefix) {
  const { start, end } = getStateDateRange(prefix);
  return rows.filter((r) => isInRange(r.date, start, end));
}
function periodTabsHtml(prefix, actionName) {
  const cur = state[prefix + 'Period'];
  const btn = (p, label) =>
    `<button class="${cur === p ? 'active' : ''}" data-action="${actionName}" data-period="${p}">${label}</button>`;
  return `<div class="period-tabs">
    ${btn('day', 'Hôm nay')}
    ${btn('week', 'Tuần này')}
    ${btn('month', 'Tháng này')}
    ${btn('all', 'Tất cả')}
    ${btn('custom', '📅 Tuỳ chỉnh')}
  </div>`;
}
function customRangeHtml(prefix) {
  return `<div class="form-row" style="margin-bottom:14px">
    <div class="form-group">
      <label>Từ ngày</label>
      <input type="date" id="f-${prefix}-custom-start" value="${state[prefix + 'CustomStart']}" />
    </div>
    <div class="form-group">
      <label>Đến ngày</label>
      <input type="date" id="f-${prefix}-custom-end" value="${state[prefix + 'CustomEnd']}" />
    </div>
  </div>`;
}
function wireCustomRangeInputs(prefix) {
  const startEl = document.getElementById(`f-${prefix}-custom-start`);
  const endEl = document.getElementById(`f-${prefix}-custom-end`);
  if (startEl)
    startEl.addEventListener('change', () => {
      state[prefix + 'CustomStart'] = startEl.value || state[prefix + 'CustomStart'];
      render();
    });
  if (endEl)
    endEl.addEventListener('change', () => {
      state[prefix + 'CustomEnd'] = endEl.value || state[prefix + 'CustomEnd'];
      render();
    });
}

function groupRowsByDate(rows) {
  const groups = [];
  rows.forEach((r) => {
    const last = groups[groups.length - 1];
    if (last && last.date === r.date) last.rows.push(r);
    else groups.push({ date: r.date, rows: [r] });
  });
  return groups;
}

function dateGroupHeaderHtml(date, rows, sumFn) {
  const total = rows.reduce((s, r) => s + sumFn(r), 0);
  const isToday = date === todayStr();
  return `<div class="section-title" style="display:flex; justify-content:space-between; align-items:baseline">
    <span>${isToday ? '📅 Hôm nay — ' : '📅 '}${formatDateVN(date)} (${rows.length})</span>
    <span style="font-weight:700; font-size:13px">${formatMoney(total)}</span>
  </div>`;
}

function renderPurchases(app) {
  const periodRows = filterRowsByPeriodState(DB.getPurchases(), 'purchase');

  app.innerHTML = `
    ${periodTabsHtml('purchase', 'set-purchase-period')}
    ${state.purchasePeriod === 'custom' ? customRangeHtml('purchase') : ''}
    <input type="text" class="searchbox" id="purchase-search" placeholder="🔍 Tìm theo tên mặt hàng, ghi chú, IMEI..." value="${escapeHtml(state.purchaseSearch || '')}" />
    <div id="purchase-summary"></div>
    <div id="stock-list"></div>
    <button class="fab" data-action="add-purchase">+</button>
  `;

  function updateList() {
    const q = (state.purchaseSearch || '').toLowerCase();
    const rows = periodRows.filter((p) => {
      if (!q) return true;
      const item = DB.getItem(p.itemId);
      return (
        (item?.name || '').toLowerCase().includes(q) ||
        (p.note || '').toLowerCase().includes(q) ||
        (p.imei || '').toLowerCase().includes(q)
      );
    });
    const summaryEl = document.getElementById('purchase-summary');
    const totalSpend = rows.reduce((s, p) => s + p.costPrice * p.quantity, 0);
    summaryEl.innerHTML = `<div class="stat-grid" style="margin-bottom:10px">
      <div class="stat-card"><div class="label">Số lần nhập</div><div class="value">${rows.length}</div></div>
      <div class="stat-card"><div class="label">Tổng tiền nhập</div><div class="value neg">${formatMoney(totalSpend)}</div></div>
    </div>`;

    const listEl = document.getElementById('stock-list');
    if (rows.length === 0) {
      listEl.innerHTML = `<div class="empty-state">Không có lần nhập hàng nào phù hợp.<br/>Bấm nút + để nhập hàng.</div>`;
      return;
    }
    listEl.innerHTML = groupRowsByDate(rows)
      .map(({ date, rows: dayRows }) => {
        const header = dateGroupHeaderHtml(date, dayRows, (p) => p.costPrice * p.quantity);
        const items = dayRows
          .map((p) => {
            const item = DB.getItem(p.itemId);
            return `
          <div class="list-item">
            <div class="item-icon" ${item ? `data-action="view-item-detail" data-id="${item.id}"` : ''}>${categoryIcon(item?.category)}</div>
            <div class="li-main" ${item ? `data-action="view-item-detail" data-id="${item.id}"` : ''}>
              <div class="li-title">${escapeHtml(item ? item.name : '(Mặt hàng đã xoá)')} <span class="badge nhap">Nhập</span></div>
              <div class="li-sub">SL ${p.quantity} × ${formatMoney(p.costPrice)}${p.note ? ' · ' + escapeHtml(p.note) : ''}</div>
              ${p.imei ? `<div class="li-sub">🔢 IMEI: ${escapeHtml(p.imei)}</div>` : ''}
            </div>
            <div class="li-right">
              <div class="li-amount">${formatMoney(p.costPrice * p.quantity)}</div>
              <div class="li-actions">
                <button class="icon-btn" data-action="edit-purchase" data-id="${p.id}">✏️</button>
                <button class="icon-btn" data-action="delete-purchase" data-id="${p.id}">🗑️</button>
              </div>
            </div>
          </div>`;
          })
          .join('');
        return header + items;
      })
      .join('');
  }

  updateList();
  const searchEl = document.getElementById('purchase-search');
  searchEl.addEventListener('input', () => {
    state.purchaseSearch = searchEl.value;
    updateList();
  });
  if (state.purchasePeriod === 'custom') wireCustomRangeInputs('purchase');
}

function itemPickBoxHtml(item) {
  return item
    ? `<div class="item-icon">${categoryIcon(item.category)}</div><div style="flex:1"><div class="li-title">${escapeHtml(item.name)}</div><div class="li-sub">Nhập ${formatMoney(item.defaultCostPrice)} · Bán ${formatMoney(item.defaultSellPrice)}</div></div><span>đổi ›</span>`
    : `<span class="placeholder">Bấm để chọn mặt hàng...</span><span>›</span>`;
}

function selectFormItem(item) {
  formDraft.itemId = item.id;
  const box = document.getElementById('picked-item-box');
  if (box) box.innerHTML = itemPickBoxHtml(item);
  if (formDraft.formType === 'purchase') {
    const costInput = document.getElementById('f-cost-price');
    if (costInput && !costInput.value) costInput.value = item.defaultCostPrice || '';
  }
  if (formDraft.formType === 'sale') {
    const sellInput = document.getElementById('f-sell-price');
    if (sellInput && !sellInput.value) sellInput.value = item.defaultSellPrice || '';
    renderSaleImeiSuggestions();
  }
}

// Các IMEI/số seri của 1 mặt hàng đã nhập nhưng CHƯA bán (còn tồn kho) — dùng
// để gợi ý chọn nhanh khi tạo lần bán, đỡ phải gõ/quét lại tay. excludeSaleId
// dùng khi đang SỬA 1 lần bán: IMEI đã gán sẵn cho chính lần bán đó vẫn được
// coi là "còn tồn" (không bị coi là đã bán bởi chính nó).
function getAvailableImeisForItem(itemId, excludeSaleId) {
  const purchasedImeis = [];
  DB.getPurchases()
    .filter((p) => p.itemId === itemId)
    .forEach((p) => {
      (p.imei || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((im) => purchasedImeis.push(im));
    });
  const soldImeis = new Set();
  DB.getSales()
    .filter((s) => s.itemId === itemId && s.id !== excludeSaleId)
    .forEach((s) => {
      (s.imei || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
        .forEach((im) => soldImeis.add(im.toLowerCase()));
    });
  return purchasedImeis.filter((im) => !soldImeis.has(im.toLowerCase()));
}

// Vẽ danh sách chip IMEI còn tồn kho của mặt hàng đang chọn trong form Bán
// hàng — bấm vào 1 chip để thêm/bỏ IMEI đó vào ô nhập (không cần gõ tay).
function renderSaleImeiSuggestions() {
  const wrap = document.getElementById('sale-imei-suggestions');
  if (!wrap) return;
  if (!formDraft.itemId) {
    wrap.innerHTML = '';
    return;
  }
  const available = getAvailableImeisForItem(formDraft.itemId, formDraft.editId);
  if (available.length === 0) {
    wrap.innerHTML = '';
    return;
  }
  const input = document.getElementById('f-sale-imei');
  const selected = new Set(
    (input?.value || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
  wrap.innerHTML =
    `<p class="help-text" style="width:100%; margin:6px 0 4px">📦 IMEI còn tồn kho (bấm để chọn):</p>` +
    available
      .map(
        (im) =>
          `<button type="button" class="chip ${selected.has(im.toLowerCase()) ? 'active' : ''}" data-action="pick-sale-imei" data-imei="${escapeHtml(im)}">${escapeHtml(im)}</button>`
      )
      .join('');
}

function selectFormCustomer(c) {
  formDraft.customerId = c.id;
  const nameEl = document.getElementById('f-cust-name');
  const phoneEl = document.getElementById('f-cust-phone');
  const addrEl = document.getElementById('f-cust-address');
  if (nameEl) nameEl.value = c.name;
  if (phoneEl) phoneEl.value = c.phone || '';
  if (addrEl) addrEl.value = c.address || '';
  toast('Đã chọn khách: ' + c.name);
}

function imeiLineRowHtml(idx, value) {
  const canRemove = formDraft.imeiLines && formDraft.imeiLines.length > 1;
  return `
    <div class="input-with-btn" style="margin-bottom:8px">
      <input type="text" class="f-purchase-imei-line" data-idx="${idx}" value="${escapeHtml(value || '')}" placeholder="Máy ${idx + 1} — quét hoặc nhập tay" />
      <button type="button" data-action="scan-purchase-imei-line" data-idx="${idx}">📷</button>
      ${canRemove ? `<button type="button" class="icon-btn" data-action="remove-purchase-imei-line" data-idx="${idx}">✕</button>` : ''}
    </div>`;
}

function renderImeiLines() {
  const wrap = document.getElementById('imei-lines');
  if (!wrap) return;
  wrap.innerHTML = formDraft.imeiLines.map((v, i) => imeiLineRowHtml(i, v)).join('');
}

function syncImeiLinesFromDom() {
  document.querySelectorAll('.f-purchase-imei-line').forEach((inp) => {
    formDraft.imeiLines[Number(inp.dataset.idx)] = inp.value;
  });
}

function openPurchaseForm(p) {
  const isEdit = !!p;
  const initialQty = p?.quantity ?? 1;
  const initialImeis = p?.imei ? p.imei.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const lineCount = Math.max(initialQty, initialImeis.length, 1);
  const imeiLines = [];
  for (let i = 0; i < lineCount; i++) imeiLines.push(initialImeis[i] || '');
  formDraft = { editId: p ? p.id : null, itemId: p ? p.itemId : null, formType: 'purchase', imeiLines };
  const item = p ? DB.getItem(p.itemId) : null;
  openSheet(`
    <div class="sheet-title">${isEdit ? 'Sửa lần nhập hàng' : 'Nhập hàng mới'}</div>
    <div class="form-group">
      <label>Mặt hàng *</label>
      <div class="picked-item-box" id="picked-item-box" data-action="open-item-picker-for-form">${itemPickBoxHtml(item)}</div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Ngày nhập</label>
        <input type="date" id="f-date" value="${p?.date || todayStr()}" />
      </div>
      <div class="form-group">
        <label>Số lượng</label>
        <input type="number" id="f-qty" value="${initialQty}" min="1" />
      </div>
    </div>
    <div class="form-group">
      <label>Giá nhập / đơn vị</label>
      <input type="number" id="f-cost-price" value="${p?.costPrice ?? ''}" min="0" placeholder="0" />
    </div>
    <div class="form-group">
      <label>IMEI / Số seri từng máy (tuỳ chọn)</label>
      <div id="imei-lines"></div>
      <button type="button" class="btn btn-secondary" data-action="add-purchase-imei-line" style="margin-top:2px">+ Thêm dòng IMEI</button>
      <p class="help-text">Số dòng tự khớp theo Số lượng — mỗi dòng bấm 📷 để quét riêng cho từng máy.</p>
    </div>
    <div class="form-group">
      <label>Ghi chú</label>
      <textarea id="f-note">${escapeHtml(p?.note || '')}</textarea>
    </div>
    <div class="btn-row">
      <button class="btn btn-secondary" data-action="close-sheet">Huỷ</button>
      <button class="btn btn-primary" data-action="submit-purchase-form">Lưu</button>
    </div>
  `);
  renderImeiLines();
  document.getElementById('f-qty').addEventListener('input', (e) => {
    syncImeiLinesFromDom();
    const qty = Math.max(1, Number(e.target.value) || 1);
    while (formDraft.imeiLines.length < qty) formDraft.imeiLines.push('');
    renderImeiLines();
  });
}

// Tìm các IMEI/số seri đã tồn tại ở lần nhập hàng khác trong hệ thống (không
// tính chính bản ghi đang sửa) — dùng để cảnh báo tránh nhập trùng máy.
function findDuplicateImeis(imeiList, excludeId) {
  if (!imeiList.length) return [];
  const existing = new Set();
  DB.getPurchases().forEach((pu) => {
    if (excludeId && pu.id === excludeId) return;
    (pu.imei || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((im) => existing.add(im.toLowerCase()));
  });
  return imeiList.filter((im) => existing.has(im.toLowerCase()));
}

// Tìm các IMEI/số seri trong danh sách đã được BÁN trước đó (ở bất kỳ lần
// bán nào) — dùng để chặn việc nhập lại 1 máy đã bán ra (nhập sau khi bán là
// dữ liệu sai, máy đó không còn ở cửa hàng nữa). Trả về mảng {imei, sale}.
function findImeisAlreadySold(imeiList, excludeSaleId) {
  if (!imeiList.length) return [];
  const soldMap = new Map();
  DB.getSales().forEach((s) => {
    if (excludeSaleId && s.id === excludeSaleId) return;
    (s.imei || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
      .forEach((im) => {
        if (!soldMap.has(im.toLowerCase())) soldMap.set(im.toLowerCase(), s);
      });
  });
  const result = [];
  imeiList.forEach((im) => {
    const sale = soldMap.get(im.toLowerCase());
    if (sale) result.push({ imei: im, sale });
  });
  return result;
}

// Tồn kho thực tế còn lại của 1 mặt hàng (đã nhập - đã bán), có thể loại trừ
// chính lần bán đang sửa (excludeSaleId) để tính đúng khi sửa lại 1 đơn cũ.
function getAvailableStockForItem(itemId, excludeSaleId) {
  const purchased = DB.getPurchases()
    .filter((p) => p.itemId === itemId)
    .reduce((s, p) => s + p.quantity, 0);
  const sold = DB.getSales()
    .filter((s) => s.itemId === itemId && s.id !== excludeSaleId)
    .reduce((s, x) => s + x.quantity, 0);
  return purchased - sold;
}

function submitPurchaseForm() {
  if (!formDraft.itemId) { toast('Vui lòng chọn mặt hàng', true); return; }
  syncImeiLinesFromDom();
  const imeiList = formDraft.imeiLines.map((s) => (s || '').trim()).filter(Boolean);
  const imei = imeiList.join(', ');

  // Chặn cứng: không cho nhập lại 1 IMEI đã từng được bán — nhập sau khi bán
  // là dấu hiệu nhầm lẫn (máy đó đã ra khỏi cửa hàng, không thể "nhập" lại).
  const alreadySold = findImeisAlreadySold(imeiList, null);
  if (alreadySold.length) {
    const detail = alreadySold
      .map((x) => `• ${x.imei} — đã bán ngày ${formatDateVN(x.sale.date)}${x.sale.customerName ? ' cho ' + x.sale.customerName : ''}`)
      .join('\n');
    alert(`❌ Không thể lưu lần nhập này.\n\nCác IMEI/số seri sau đã bán ra trước đó, không thể nhập lại (kiểm tra lại xem có nhầm máy không):\n${detail}`);
    return;
  }

  const dupImeis = findDuplicateImeis(imeiList, formDraft.editId);
  if (dupImeis.length) {
    const ok = confirmDialog(
      `⚠️ IMEI/số seri sau đã tồn tại trong hệ thống (đã từng nhập trước đó):\n${dupImeis.join(', ')}\n\nBạn có chắc muốn lưu lần nhập này không?`
    );
    if (!ok) return;
  }

  const p = {
    id: formDraft.editId,
    itemId: formDraft.itemId,
    date: document.getElementById('f-date').value || todayStr(),
    quantity: Number(document.getElementById('f-qty').value) || 1,
    costPrice: parseMoneyInput(document.getElementById('f-cost-price').value),
    imei,
    note: document.getElementById('f-note').value.trim(),
  };
  DB.savePurchase(p);
  toast('Đã lưu lần nhập hàng');
  closeSheet();
  render();
}

// ---------------------------------------------------------------------
// SALES (Bán hàng)
// ---------------------------------------------------------------------
function renderSales(app) {
  const periodRows = filterRowsByPeriodState(DB.getSales(), 'sale');

  app.innerHTML = `
    ${periodTabsHtml('sale', 'set-sale-period')}
    ${state.salePeriod === 'custom' ? customRangeHtml('sale') : ''}
    <input type="text" class="searchbox" id="sale-search" placeholder="🔍 Tìm theo tên mặt hàng, khách hàng, IMEI..." value="${escapeHtml(state.saleSearch || '')}" />
    <div id="sale-summary"></div>
    <div id="stock-list"></div>
    <button class="fab" data-action="add-sale">+</button>
  `;

  function updateList() {
    const q = (state.saleSearch || '').toLowerCase();
    const rows = periodRows.filter((s) => {
      if (!q) return true;
      const item = DB.getItem(s.itemId);
      return (
        (item?.name || '').toLowerCase().includes(q) ||
        (s.customerName || '').toLowerCase().includes(q) ||
        (s.customerPhone || '').toLowerCase().includes(q) ||
        (s.imei || '').toLowerCase().includes(q)
      );
    });
    const summaryEl = document.getElementById('sale-summary');
    const totalRevenue = rows.reduce((s, x) => s + x.sellPrice * x.quantity, 0);
    summaryEl.innerHTML = `<div class="stat-grid" style="margin-bottom:10px">
      <div class="stat-card"><div class="label">Số đơn bán</div><div class="value">${rows.length}</div></div>
      <div class="stat-card"><div class="label">Tổng doanh thu</div><div class="value pos">${formatMoney(totalRevenue)}</div></div>
    </div>`;

    const listEl = document.getElementById('stock-list');
    if (rows.length === 0) {
      listEl.innerHTML = `<div class="empty-state">Không có lần bán hàng nào phù hợp.<br/>Bấm nút + để bán hàng.</div>`;
      return;
    }
    listEl.innerHTML = groupRowsByDate(rows)
      .map(({ date, rows: dayRows }) => {
        const header = dateGroupHeaderHtml(date, dayRows, (s) => s.sellPrice * s.quantity);
        const items = dayRows
          .map((s) => {
            const item = DB.getItem(s.itemId);
            return `
          <div class="list-item">
            <div class="item-icon" ${item ? `data-action="view-item-detail" data-id="${item.id}"` : ''}>${categoryIcon(item?.category)}</div>
            <div class="li-main" ${item ? `data-action="view-item-detail" data-id="${item.id}"` : ''}>
              <div class="li-title">${escapeHtml(item ? item.name : '(Mặt hàng đã xoá)')} <span class="badge ban">Bán</span></div>
              <div class="li-sub">SL ${s.quantity} × ${formatMoney(s.sellPrice)}</div>
              <div class="li-sub">👤 ${escapeHtml(s.customerName || 'Khách lẻ')}${s.customerPhone ? ' · ' + escapeHtml(s.customerPhone) : ''}${s.customerAddress ? ' · ' + escapeHtml(s.customerAddress) : ''}</div>
              ${s.imei ? `<div class="li-sub">🔢 IMEI: ${escapeHtml(s.imei)}</div>` : ''}
            </div>
            <div class="li-right">
              <div class="li-amount">${formatMoney(s.sellPrice * s.quantity)}</div>
              <div class="li-actions">
                <button class="icon-btn" data-action="print-invoice" data-id="${s.id}">🖨️</button>
                <button class="icon-btn" data-action="edit-sale" data-id="${s.id}">✏️</button>
                <button class="icon-btn" data-action="delete-sale" data-id="${s.id}">🗑️</button>
              </div>
            </div>
          </div>`;
          })
          .join('');
        return header + items;
      })
      .join('');
  }

  updateList();
  const searchEl = document.getElementById('sale-search');
  searchEl.addEventListener('input', () => {
    state.saleSearch = searchEl.value;
    updateList();
  });
  if (state.salePeriod === 'custom') wireCustomRangeInputs('sale');
}

function openSaleForm(s) {
  const isEdit = !!s;
  formDraft = { editId: s ? s.id : null, itemId: s ? s.itemId : null, formType: 'sale', customerId: s ? s.customerId : null };
  const item = s ? DB.getItem(s.itemId) : null;
  openSheet(`
    <div class="sheet-title">${isEdit ? 'Sửa lần bán hàng' : 'Bán hàng mới'}</div>
    <div class="form-group">
      <label>Mặt hàng *</label>
      <div class="picked-item-box" id="picked-item-box" data-action="open-item-picker-for-form">${itemPickBoxHtml(item)}</div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Ngày bán</label>
        <input type="date" id="f-date" value="${s?.date || todayStr()}" />
      </div>
      <div class="form-group">
        <label>Số lượng</label>
        <input type="number" id="f-qty" value="${s?.quantity ?? 1}" min="1" />
      </div>
    </div>
    <div class="form-group">
      <label>Giá bán / đơn vị</label>
      <input type="number" id="f-sell-price" value="${s?.sellPrice ?? ''}" min="0" placeholder="0" />
    </div>
    <div class="form-group">
      <label>IMEI / Số seri máy bán (tuỳ chọn)</label>
      <div class="input-with-btn">
        <input type="text" id="f-sale-imei" value="${escapeHtml(s?.imei || '')}" placeholder="Quét hoặc nhập tay" />
        <button type="button" data-action="scan-for-sale-imei">📷</button>
      </div>
      <div id="sale-imei-suggestions" class="chip-row" style="flex-wrap:wrap; margin-bottom:0"></div>
      <p class="help-text">Dùng để tra cứu bảo hành sau này theo từng máy đã bán.</p>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Hình thức thanh toán</label>
        <select id="f-payment-method">
          ${['Tiền mặt', 'Chuyển khoản', 'Khác'].map((m) => `<option value="${m}" ${(s?.paymentMethod || 'Tiền mặt') === m ? 'selected' : ''}>${m}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Chiết khấu (%)</label>
        <input type="number" id="f-discount-percent" value="${s?.discountPercent ?? 0}" min="0" max="100" />
      </div>
    </div>
    <div class="form-group">
      <label>Tiền khách đưa (tuỳ chọn, để tính tiền thừa trên hoá đơn)</label>
      <input type="number" id="f-cash-given" value="${s?.cashGiven ?? ''}" min="0" placeholder="Bỏ trống nếu không cần in tiền thừa" />
    </div>
    <div class="section-title" style="margin-top:4px">Thông tin khách hàng</div>
    <button type="button" class="btn btn-secondary" data-action="open-customer-picker-for-sale" style="margin-bottom:12px">📇 Chọn khách đã lưu</button>
    <div class="form-group">
      <label>Tên khách hàng</label>
      <input type="text" id="f-cust-name" value="${escapeHtml(s?.customerName || '')}" placeholder="Khách lẻ" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Số điện thoại</label>
        <input type="tel" id="f-cust-phone" value="${escapeHtml(s?.customerPhone || '')}" placeholder="09xxxxxxxx" />
      </div>
    </div>
    <div class="form-group">
      <label>Địa chỉ</label>
      <input type="text" id="f-cust-address" value="${escapeHtml(s?.customerAddress || '')}" placeholder="Địa chỉ giao hàng..." />
    </div>
    <p class="help-text" style="margin:-6px 0 14px">Có thể nhập tay cho khách lẻ, hoặc bấm "Chọn khách đã lưu" để lấy nhanh từ danh bạ.</p>
    <div class="form-group">
      <label>Ghi chú</label>
      <textarea id="f-note">${escapeHtml(s?.note || '')}</textarea>
    </div>
    <div class="btn-row">
      <button class="btn btn-secondary" data-action="close-sheet">Huỷ</button>
      <button class="btn btn-primary" data-action="submit-sale-form">Lưu</button>
    </div>
  `);
  renderSaleImeiSuggestions();
  document.getElementById('f-sale-imei').addEventListener('input', renderSaleImeiSuggestions);
}

function submitSaleForm() {
  if (!formDraft.itemId) { toast('Vui lòng chọn mặt hàng', true); return; }
  const item = DB.getItem(formDraft.itemId);
  const costBasis = item ? getLatestCostPrice(item.id) : 0;

  // Chặn cứng: không cho bán quá số lượng còn tồn kho thực tế — đây chính là
  // lỗi "hết hàng vẫn bán được" đã xảy ra do trước đây không có bước kiểm
  // tra này. excludeSaleId để khi SỬA lại 1 đơn cũ không bị tự trừ đôi.
  const quantity = Number(document.getElementById('f-qty').value) || 1;
  const availableStock = item ? getAvailableStockForItem(item.id, formDraft.editId) : 0;
  if (quantity > availableStock) {
    if (availableStock <= 0) {
      toast(`⚠️ "${item?.name || 'Mặt hàng'}" đã HẾT HÀNG (tồn kho: 0), không thể bán thêm.`, true);
    } else {
      toast(`⚠️ Không đủ hàng: "${item?.name || ''}" chỉ còn ${availableStock} ${item?.unit || ''} trong kho (đang bán ${quantity}).`, true);
    }
    return;
  }

  // Chặn cứng: không cho bán trùng 1 IMEI/số seri đã được bán ở đơn khác.
  const imeiRaw = document.getElementById('f-sale-imei').value.trim();
  const imeiList = imeiRaw.split(',').map((s) => s.trim()).filter(Boolean);
  const dupSoldImeis = findImeisAlreadySold(imeiList, formDraft.editId);
  if (dupSoldImeis.length) {
    const detail = dupSoldImeis
      .map((x) => `• ${x.imei} — đã bán ngày ${formatDateVN(x.sale.date)}${x.sale.customerName ? ' cho ' + x.sale.customerName : ''}`)
      .join('\n');
    alert(`❌ Không thể lưu lần bán này.\n\nCác IMEI/số seri sau đã được bán ở 1 đơn khác trước đó (trùng lặp):\n${detail}`);
    return;
  }

  const customerName = document.getElementById('f-cust-name').value.trim();
  const customerPhone = document.getElementById('f-cust-phone').value.trim();
  const customerAddress = document.getElementById('f-cust-address').value.trim();

  // Tự động lưu/khớp vào danh bạ Khách hàng nếu có nhập tên, kể cả khi
  // gõ tay (không dùng "Chọn khách đã lưu"), để khách hiện lên ở tab Khách hàng.
  let customerId = formDraft.customerId || null;
  if (customerName) {
    if (customerId) {
      const existing = DB.getCustomer(customerId);
      if (existing) {
        DB.saveCustomer({ ...existing, name: customerName, phone: customerPhone, address: customerAddress });
      }
    } else {
      const matched = customerPhone ? DB.getCustomers().find((c) => c.phone && c.phone === customerPhone) : null;
      if (matched) {
        customerId = matched.id;
        DB.saveCustomer({ ...matched, name: customerName, address: customerAddress || matched.address });
      } else {
        const created = DB.saveCustomer({ name: customerName, phone: customerPhone, address: customerAddress });
        customerId = created.id;
      }
    }
  }

  const s = {
    id: formDraft.editId,
    itemId: formDraft.itemId,
    customerId,
    date: document.getElementById('f-date').value || todayStr(),
    quantity,
    sellPrice: parseMoneyInput(document.getElementById('f-sell-price').value),
    costPriceAtSale: costBasis,
    imei: imeiRaw,
    customerName,
    customerPhone,
    customerAddress,
    note: document.getElementById('f-note').value.trim(),
    paymentMethod: document.getElementById('f-payment-method').value,
    discountPercent: Number(document.getElementById('f-discount-percent').value) || 0,
    cashGiven: document.getElementById('f-cash-given').value === '' ? null : Number(document.getElementById('f-cash-given').value),
  };
  const isNewSale = !s.id;
  // Gán số hoá đơn 1 lần duy nhất khi tạo mới, giữ nguyên khi sửa lại sau này.
  if (isNewSale) {
    s.invoiceNo = 'HD' + String(DB.getSales().length + 1).padStart(6, '0');
  } else {
    const old = DB.getSales().find((x) => x.id === s.id);
    s.invoiceNo = old?.invoiceNo || 'HD' + String(DB.getSales().length).padStart(6, '0');
  }
  const saved = DB.saveSale(s);
  toast('Đã lưu lần bán hàng');
  closeSheet();
  render();
  if (isNewSale) printInvoice(saved);
}

// Xác định ảnh QR chuyển khoản sẽ in trên hoá đơn: ưu tiên tự tạo theo
// ngân hàng/STK đã lưu (điền sẵn đúng số tiền hoá đơn nếu bật tuỳ chọn đó),
// nếu chưa cấu hình thì dùng ảnh QR tĩnh đã tải lên (nếu có).
function resolveInvoiceQr(shop, sale, total) {
  const bank = VIETQR_BANKS.find((b) => b.code === shop.bankCode);
  if (bank && shop.bankAccountNo) {
    const useAmount = shop.qrDynamicAmount !== false;
    const idSuffix = sale.id ? String(sale.id).slice(-6) : '';
    const payload = buildVietQrPayload({
      bin: bank.bin,
      accountNo: shop.bankAccountNo,
      accountName: shop.bankAccountName || shop.name,
      amount: useAmount ? total : null,
      purpose: `Thanh toan HD ${idSuffix}`.trim(),
    });
    const dataUrl = qrPayloadToDataUrl(payload, 5);
    if (dataUrl) {
      const caption = shop.bankInfo || `${bank.name} - ${shop.bankAccountNo}${shop.bankAccountName ? ' - ' + shop.bankAccountName : ''}`;
      return { dataUrl, caption };
    }
  }
  if (shop.bankQr) {
    return { dataUrl: shop.bankQr, caption: shop.bankInfo || '' };
  }
  return null;
}

function printInvoice(sale) {
  if (!sale) { toast('Không tìm thấy đơn bán để in', true); return; }
  const item = DB.getItem(sale.itemId);
  const shop = DB.getShopInfo();
  const subtotal = sale.sellPrice * sale.quantity;
  const discountPercent = sale.discountPercent || 0;
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const total = subtotal - discountAmount;
  const hasCashInfo = sale.paymentMethod !== 'Chuyển khoản' && sale.cashGiven != null && sale.cashGiven >= 0;
  const changeAmount = hasCashInfo ? Math.max(0, sale.cashGiven - total) : 0;
  const invoiceQr = resolveInvoiceQr(shop, sale, total);
  const invoiceNo = sale.invoiceNo || ('HD' + String(DB.getSales().findIndex((x) => x.id === sale.id) + 1).padStart(6, '0'));

  // Khổ giấy in — lấy theo lựa chọn đã lưu ở Cài đặt (mặc định 80mm nếu chưa
  // chọn), tự tính @page size + độ rộng nội dung + tỉ lệ cỡ chữ tương ứng để
  // hộp thoại in nhận đúng khổ giấy nhiệt (57/58/80mm) thay vì chỉ hiện các
  // khổ giấy văn phòng A4/A5/A6 mặc định của trình duyệt.
  const paper = getPrintPaperSize(shop.printPaperSize);
  const isThermal = paper.value.endsWith('mm');
  const pageSizeCss = isThermal ? `${paper.widthMm}mm auto` : paper.value;
  const pageMarginCss = isThermal ? '3mm' : paper.value === 'A4' ? '14mm' : '10mm';
  const bodyWidthCss = isThermal ? `${paper.widthMm - 4}mm` : paper.value === 'A4' ? '182mm' : '128mm';
  const fs = paper.fontScale;
  const popupWidth = isThermal ? 380 : 500;
  const win = window.open('', '_blank', `width=${popupWidth},height=650`);
  if (!win) {
    toast('Trình duyệt đang chặn cửa sổ in. Hãy cho phép popup rồi bấm in lại.', true);
    return;
  }
  win.document.write(`<!DOCTYPE html>
<html lang="vi"><head><meta charset="UTF-8" />
<title>Hoá đơn bán hàng</title>
<style>
  @page { size: ${pageSizeCss}; margin: ${pageMarginCss}; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, 'Segoe UI', sans-serif; width: ${bodyWidthCss}; margin: 0 auto; padding: 6px; font-size: ${(13.5 * fs).toFixed(1)}px; line-height: 1.45; color: #000; }
  .center { text-align: center; }
  .shop-name { font-size: ${(19 * fs).toFixed(1)}px; font-weight: bold; }
  hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; font-size: ${(13.5 * fs).toFixed(1)}px; }
  td, th { padding: 3px 0; vertical-align: top; text-align: left; }
  th { font-weight: bold; font-size: ${(12.5 * fs).toFixed(1)}px; border-bottom: 1px solid #000; }
  .right, td.right, th.right { text-align: right; }
  .cc { text-align: center; }
  .invoice-title { font-weight: bold; text-align: center; margin: 10px 0 2px; letter-spacing: 1px; font-size: ${(16 * fs).toFixed(1)}px; }
  .section-gap { margin-top: 10px; }
  .customer-block div { margin-bottom: 2px; }
  .summary-block { width: 88%; margin: 10px auto 0; }
  .summary-block .row-line { margin-bottom: 2px; }
  .summary-block .row-line.grand { font-weight: bold; font-size: ${(15 * fs).toFixed(1)}px; margin-top: 4px; }
  .footer { text-align: center; margin-top: 14px; font-size: ${(13 * fs).toFixed(1)}px; font-style: italic; }
  .row-line { display: flex; justify-content: space-between; gap: 8px; }
  .amount-words { text-align: center; font-style: italic; margin: 10px 0; font-size: ${(13 * fs).toFixed(1)}px; }
  .warranty-box { font-size: ${(12.5 * fs).toFixed(1)}px; line-height: 1.6; margin-top: 14px; }
  .warranty-box p { margin: 6px 0; }
  .qr-box img { border: 1px solid #ccc; border-radius: 6px; }
</style>
</head>
<body>
  <div class="center">
    ${shop.name ? `<div class="shop-name">${escapeHtml(shop.name)}</div>` : ''}
    ${shop.address ? `<div>Địa chỉ: ${escapeHtml(shop.address)}</div>` : ''}
    ${shop.phone ? `<div>Điện thoại: ${escapeHtml(shop.phone)}</div>` : ''}
  </div>
  <div class="invoice-title">HÓA ĐƠN BÁN HÀNG</div>
  <div class="center">Số HĐ: ${escapeHtml(invoiceNo)}</div>
  <div class="center">${formatDateVNFull(sale.date)}</div>
  <div class="customer-block section-gap">
    <div>Khách hàng: ${escapeHtml(sale.customerName || 'Khách lẻ')}</div>
    ${sale.customerPhone ? `<div>SĐT: ${escapeHtml(sale.customerPhone)}</div>` : ''}
    <div>Địa chỉ: ${sale.customerAddress ? escapeHtml(sale.customerAddress) : '-'}</div>
    <div>Hình thức thanh toán: ${escapeHtml(sale.paymentMethod || 'Tiền mặt')}</div>
  </div>
  <table class="section-gap">
    <tr><th>Đơn giá</th><th class="cc">SL</th><th class="right">Thành tiền</th></tr>
    <tr><td colspan="3">${escapeHtml(item ? item.name : '(Mặt hàng đã xoá)')}</td></tr>
    ${sale.imei ? `<tr><td colspan="3">IMEI: ${escapeHtml(sale.imei)}</td></tr>` : ''}
    <tr>
      <td>${formatMoney(sale.sellPrice)}</td>
      <td class="cc">${sale.quantity}</td>
      <td class="right">${formatMoney(subtotal)}</td>
    </tr>
  </table>
  <hr />
  <div class="summary-block">
    <div class="row-line"><span>Tổng tiền hàng:</span><span>${formatMoney(subtotal)}</span></div>
    <div class="row-line"><span>Chiết khấu ${discountPercent}%:</span><span>${formatMoney(discountAmount)}</span></div>
    <div class="row-line grand"><span>Tổng thanh toán:</span><span>${formatMoney(total)}</span></div>
    ${hasCashInfo ? `<div class="row-line"><span>Tiền khách đưa:</span><span>${formatMoney(sale.cashGiven)}</span></div>` : ''}
    ${hasCashInfo ? `<div class="row-line"><span>Tiền thừa trả khách:</span><span>${formatMoney(changeAmount)}</span></div>` : ''}
  </div>
  <div class="amount-words">(${soTienBangChu(total)} chẵn)</div>
  ${sale.note ? `<div>Ghi chú: ${escapeHtml(sale.note)}</div>` : ''}
  ${
    invoiceQr
      ? `<div class="center qr-box section-gap">
          <img src="${invoiceQr.dataUrl}" style="width:140px;height:140px;object-fit:contain" />
          ${invoiceQr.caption ? `<div style="font-size:12px;margin-top:4px">${escapeHtml(invoiceQr.caption)}</div>` : ''}
        </div>`
      : ''
  }
  ${
    shop.warranty
      ? `<div class="warranty-box">${mdBoldToHtml(escapeHtml(shop.warranty)).replace(/\n/g, '<br/>')}</div>`
      : ''
  }
  <div class="footer">Cảm ơn và hẹn gặp lại!</div>
</body></html>`);
  win.document.close();
  setTimeout(() => {
    try {
      win.focus();
      win.print();
    } catch (e) {
      // bỏ qua nếu cửa sổ đã bị đóng
    }
  }, 350);
}

// ---------------------------------------------------------------------
// CUSTOMERS (Khách hàng)
// ---------------------------------------------------------------------
function renderCustomers(app) {
  app.innerHTML = `
    ${backToMoreLink()}
    <input type="text" class="searchbox" id="customer-search" placeholder="🔍 Tìm khách hàng (tên/sđt)..." value="${escapeHtml(state.customerSearch)}" />
    <button class="btn btn-secondary" data-action="share-customers" style="margin-bottom:12px">📤 Chia sẻ danh sách qua Gmail...</button>
    <div id="customers-list"></div>
    <button class="fab" data-action="add-customer">+</button>
  `;

  // Chỉ cập nhật danh sách kết quả khi gõ tìm kiếm, KHÔNG render lại toàn bộ
  // app.innerHTML — tránh tạo lại ô input mỗi lần gõ (mất focus/tắt bàn phím).
  function updateCustomersList() {
    const customers = DB.getCustomers().filter(
      (c) => !state.customerSearch || c.name.toLowerCase().includes(state.customerSearch.toLowerCase()) || (c.phone || '').includes(state.customerSearch)
    );
    const listEl = document.getElementById('customers-list');
    if (!listEl) return;
    if (customers.length === 0) {
      listEl.innerHTML = `<div class="empty-state">Chưa có khách hàng nào.<br/>Bấm nút + để thêm khách hàng.</div>`;
    } else {
      const allSales = DB.getSales();
      listEl.innerHTML = customers
        .map((c) => {
          const sales = allSales.filter((s) => s.customerId === c.id);
          const totalSpent = sales.reduce((sum, s) => sum + s.sellPrice * s.quantity, 0);
          return `
        <div class="list-item" data-action="view-customer-detail" data-id="${c.id}">
          <div class="li-main">
            <div class="li-title">${escapeHtml(c.name)}</div>
            <div class="li-sub">${escapeHtml(c.phone || '')}${c.address ? ' · ' + escapeHtml(c.address) : ''}</div>
            <div class="li-sub">${sales.length} đơn đã mua · Tổng ${formatMoney(totalSpent)}</div>
          </div>
          <div class="li-actions">
            <button class="icon-btn" data-action="edit-customer" data-id="${c.id}">✏️</button>
            <button class="icon-btn" data-action="delete-customer" data-id="${c.id}">🗑️</button>
          </div>
        </div>`;
        })
        .join('');
    }
  }

  updateCustomersList();

  document.getElementById('customer-search').addEventListener('input', (e) => {
    state.customerSearch = e.target.value;
    updateCustomersList();
  });
}

// Sheet chi tiết 1 khách hàng — hiện đầy đủ thông tin liên hệ + TOÀN BỘ lịch
// sử mua hàng (từng lần bán, mặt hàng, số lượng, giá, lãi, IMEI, hình thức
// thanh toán), có thể in lại hoá đơn hoặc sửa/xoá ngay tại đây — cùng kiểu
// bấm-vào-để-xem-chi-tiết như mục Mặt hàng/Tồn kho cho đồng nhất.
function openCustomerDetailSheet(customerId) {
  const c = DB.getCustomer(customerId);
  if (!c) { toast('Không tìm thấy khách hàng', true); return; }
  const sales = DB.getSales()
    .filter((s) => s.customerId === c.id)
    .sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0));
  const totalSpent = sales.reduce((sum, s) => sum + s.sellPrice * s.quantity, 0);
  const totalProfit = sales.reduce((sum, s) => sum + (s.sellPrice - (s.costPriceAtSale || 0)) * s.quantity, 0);
  const lastDate = sales.length ? sales[0].date : null;

  const salesHtml =
    sales.length === 0
      ? '<div class="empty-state" style="padding:16px">Khách hàng này chưa mua lần nào.</div>'
      : sales
          .map((s) => {
            const item = DB.getItem(s.itemId);
            const total = s.sellPrice * s.quantity;
            const profit = (s.sellPrice - (s.costPriceAtSale || 0)) * s.quantity;
            return `
      <div class="list-item">
        <div class="item-icon">${categoryIcon(item?.category)}</div>
        <div class="li-main">
          <div class="li-title">${escapeHtml(item ? item.name : '(Mặt hàng đã xoá)')}</div>
          <div class="li-sub">${formatDateVN(s.date)} <span class="badge ban">Bán</span></div>
          <div class="li-sub">SL ${s.quantity} × ${formatMoney(s.sellPrice)} = ${formatMoney(total)}</div>
          <div class="li-sub">Giá vốn ${formatMoney(s.costPriceAtSale || 0)} · Lãi <span class="${profit >= 0 ? 'pos' : 'neg'}">${formatMoney(profit)}</span> · ${escapeHtml(s.paymentMethod || 'Tiền mặt')}</div>
          ${s.imei ? `<div class="li-sub">🔢 IMEI: ${escapeHtml(s.imei)}</div>` : ''}
          ${s.note ? `<div class="li-sub">📝 ${escapeHtml(s.note)}</div>` : ''}
        </div>
        <div class="li-actions">
          <button class="icon-btn" data-action="print-invoice" data-id="${s.id}">🖨️</button>
          <button class="icon-btn" data-action="edit-sale" data-id="${s.id}">✏️</button>
        </div>
      </div>`;
          })
          .join('');

  openSheet(`
    <div class="sheet-title">👤 ${escapeHtml(c.name)}</div>
    <div class="customer-block" style="margin-top:-6px">
      ${c.phone ? `<div>📞 ${escapeHtml(c.phone)}</div>` : '<div class="help-text" style="margin:0">Chưa có số điện thoại</div>'}
      ${c.address ? `<div>📍 ${escapeHtml(c.address)}</div>` : ''}
      ${c.note ? `<div>📝 ${escapeHtml(c.note)}</div>` : ''}
    </div>
    <div class="stat-grid" style="margin-top:14px">
      <div class="stat-card">
        <div class="label">Số đơn đã mua</div>
        <div class="value">${sales.length}</div>
      </div>
      <div class="stat-card">
        <div class="label">Tổng đã chi</div>
        <div class="value">${formatMoney(totalSpent)}</div>
      </div>
      <div class="stat-card wide">
        <div class="label">Lãi mang lại cho shop</div>
        <div class="value ${totalProfit >= 0 ? 'pos' : 'neg'}">${formatMoney(totalProfit)}</div>
      </div>
      ${
        lastDate
          ? `<div class="stat-card wide">
        <div class="label">Lần mua gần nhất</div>
        <div class="value" style="font-size:16px">${formatDateVN(lastDate)}</div>
      </div>`
          : ''
      }
    </div>
    <div class="section-title" style="margin-top:18px">🛒 Lịch sử mua hàng (${sales.length})</div>
    ${salesHtml}
    <div class="btn-row" style="margin-top:18px">
      <button class="btn btn-secondary" data-action="edit-customer" data-id="${c.id}">✏️ Sửa khách hàng</button>
      <button class="btn btn-danger" data-action="delete-customer" data-id="${c.id}">🗑️ Xoá</button>
    </div>
  `);
}

function csvEscape(v) {
  v = String(v ?? '');
  return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}
function customersToCSV() {
  const rows = [['Tên', 'Số điện thoại', 'Địa chỉ', 'Ghi chú']];
  DB.getCustomers().forEach((c) => rows.push([c.name, c.phone || '', c.address || '', c.note || '']));
  return rows.map((r) => r.map(csvEscape).join(',')).join('\r\n');
}
async function shareCustomers() {
  const customers = DB.getCustomers();
  if (customers.length === 0) { toast('Chưa có khách hàng nào để chia sẻ', true); return; }
  const csv = customersToCSV();
  const filename = `khach-hang-${todayStr()}.csv`;
  const blob = new Blob(['﻿' + csv], { type: 'text/csv' });
  try {
    const file = new File([blob], filename, { type: 'text/csv' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Danh sách khách hàng', text: 'Danh sách khách hàng xuất từ app Quản lý thu chi' });
      toast('Đã mở hộp thoại chia sẻ — chọn Gmail để gửi');
      return;
    }
  } catch (err) {
    if (err && err.name === 'AbortError') return; // người dùng tự huỷ, không cần báo lỗi
  }
  // Fallback: tải file CSV về để tự đính kèm vào Gmail (luôn hoạt động, kể cả khi mở file trực tiếp)
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast('Đã tải file CSV khách hàng — mở Gmail và đính kèm file này để gửi');
}

function openCustomerForm(c) {
  const isEdit = !!c;
  formDraft.editId = c ? c.id : null;
  openSheet(`
    <div class="sheet-title">${isEdit ? 'Sửa khách hàng' : 'Thêm khách hàng mới'}</div>
    <div class="form-group">
      <label>Tên khách hàng *</label>
      <input type="text" id="f-c-name" value="${escapeHtml(c?.name || '')}" placeholder="Nguyễn Văn A" />
    </div>
    <div class="form-group">
      <label>Số điện thoại</label>
      <input type="tel" id="f-c-phone" value="${escapeHtml(c?.phone || '')}" placeholder="09xxxxxxxx" />
    </div>
    <div class="form-group">
      <label>Địa chỉ</label>
      <input type="text" id="f-c-address" value="${escapeHtml(c?.address || '')}" placeholder="Địa chỉ..." />
    </div>
    <div class="form-group">
      <label>Ghi chú</label>
      <textarea id="f-c-note">${escapeHtml(c?.note || '')}</textarea>
    </div>
    <div class="btn-row">
      <button class="btn btn-secondary" data-action="close-sheet">Huỷ</button>
      <button class="btn btn-primary" data-action="submit-customer-form">Lưu</button>
    </div>
  `);
}

function submitCustomerForm() {
  const name = document.getElementById('f-c-name').value.trim();
  if (!name) { toast('Vui lòng nhập tên khách hàng', true); return; }
  const c = {
    id: formDraft.editId,
    name,
    phone: document.getElementById('f-c-phone').value.trim(),
    address: document.getElementById('f-c-address').value.trim(),
    note: document.getElementById('f-c-note').value.trim(),
  };
  DB.saveCustomer(c);
  toast('Đã lưu khách hàng');
  closeSheet();
  render();
}

// ---------------------------------------------------------------------
// MORE (menu Thêm: Mặt hàng / Thu chi / Cài đặt)
// ---------------------------------------------------------------------
function renderMore(app) {
  app.innerHTML = `
    <div class="list-item" data-action="go-tab" data-tab="customers">
      <div class="li-main"><div class="li-title">👥 Khách hàng</div><div class="li-sub">Danh bạ khách hàng, lịch sử mua hàng</div></div>
      <span>›</span>
    </div>
    <div class="list-item" data-action="go-tab" data-tab="inventory">
      <div class="li-main"><div class="li-title">📊 Tồn kho</div><div class="li-sub">Số lượng còn lại theo mặt hàng (tự tính từ nhập/bán)</div></div>
      <span>›</span>
    </div>
    <div class="list-item" data-action="go-tab" data-tab="lookup">
      <div class="li-main"><div class="li-title">🔍 Tra cứu</div><div class="li-sub">Tìm theo IMEI máy hoặc số điện thoại khách</div></div>
      <span>›</span>
    </div>
    <div class="list-item" data-action="go-tab" data-tab="cashflow">
      <div class="li-main"><div class="li-title">💰 Thu chi</div><div class="li-sub">Các khoản thu/chi ngoài mua bán hàng</div></div>
      <span>›</span>
    </div>
    <div class="list-item" data-action="go-tab" data-tab="settings">
      <div class="li-main"><div class="li-title">⚙️ Cài đặt</div><div class="li-sub">Backup, restore, thông tin app</div></div>
      <span>›</span>
    </div>
  `;
}

// ---------------------------------------------------------------------
// CASHFLOW (Thu chi độc lập)
// ---------------------------------------------------------------------
function renderCashflow(app) {
  const { start, end } = getPeriodRange(state.cashPeriod);
  const rows = DB.getTransactions().filter((t) => isInRange(t.date, start, end));
  const thu = rows.filter((t) => t.type === 'thu').reduce((s, t) => s + t.amount, 0);
  const chi = rows.filter((t) => t.type === 'chi').reduce((s, t) => s + t.amount, 0);

  const periodBtn = (p, label) =>
    `<button class="${state.cashPeriod === p ? 'active' : ''}" data-action="set-cash-period" data-period="${p}">${label}</button>`;

  app.innerHTML = `
    ${backToMoreLink()}
    <div class="period-tabs">
      ${periodBtn('day', 'Hôm nay')}
      ${periodBtn('week', 'Tuần này')}
      ${periodBtn('month', 'Tháng này')}
      ${periodBtn('all', 'Tất cả')}
    </div>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="label">Tổng thu</div>
        <div class="value pos">${formatMoney(thu)}</div>
      </div>
      <div class="stat-card">
        <div class="label">Tổng chi</div>
        <div class="value neg">${formatMoney(chi)}</div>
      </div>
    </div>
    <div id="tx-list" style="margin-top:12px"></div>
    <button class="fab" data-action="add-transaction">+</button>
  `;
  const listEl = document.getElementById('tx-list');
  listEl.innerHTML =
    rows.length === 0
      ? `<div class="empty-state">Chưa có khoản thu/chi nào trong kỳ này.</div>`
      : rows
          .map(
            (t) => `
      <div class="list-item">
        <div class="li-main">
          <div class="li-title">${escapeHtml(t.category || (t.type === 'thu' ? 'Khoản thu' : 'Khoản chi'))} <span class="badge ${t.type}">${t.type === 'thu' ? 'Thu' : 'Chi'}</span></div>
          <div class="li-sub">${formatDateVN(t.date)}${t.note ? ' · ' + escapeHtml(t.note) : ''}</div>
        </div>
        <div class="li-right">
          <div class="li-amount ${t.type === 'thu' ? 'pos' : 'neg'}">${t.type === 'thu' ? '+' : '-'}${formatMoney(t.amount)}</div>
          <div class="li-actions">
            <button class="icon-btn" data-action="edit-transaction" data-id="${t.id}">✏️</button>
            <button class="icon-btn" data-action="delete-transaction" data-id="${t.id}">🗑️</button>
          </div>
        </div>
      </div>`
          )
          .join('');
}

function refreshTxTypeUI() {
  document.querySelectorAll('.radio-opt').forEach((el) => {
    el.classList.toggle('selected', el.dataset.type === formDraft.txType);
  });
}

function openTransactionForm(t) {
  const isEdit = !!t;
  formDraft = { editId: t ? t.id : null, txType: t?.type || 'chi' };
  openSheet(`
    <div class="sheet-title">${isEdit ? 'Sửa thu/chi' : 'Thêm thu / chi'}</div>
    <div class="form-group">
      <label>Loại</label>
      <div class="radio-row">
        <div class="radio-opt thu" data-action="set-tx-type" data-type="thu">💰 Khoản thu</div>
        <div class="radio-opt chi" data-action="set-tx-type" data-type="chi">💸 Khoản chi</div>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Ngày</label>
        <input type="date" id="f-date" value="${t?.date || todayStr()}" />
      </div>
      <div class="form-group">
        <label>Số tiền</label>
        <input type="number" id="f-amount" value="${t?.amount ?? ''}" min="0" placeholder="0" />
      </div>
    </div>
    <div class="form-group">
      <label>Danh mục</label>
      <input type="text" id="f-category" value="${escapeHtml(t?.category || '')}" placeholder="VD: Tiền điện, tiền thuê nhà, lương..." />
    </div>
    <div class="form-group">
      <label>Ghi chú</label>
      <textarea id="f-note">${escapeHtml(t?.note || '')}</textarea>
    </div>
    <div class="btn-row">
      <button class="btn btn-secondary" data-action="close-sheet">Huỷ</button>
      <button class="btn btn-primary" data-action="submit-transaction-form">Lưu</button>
    </div>
  `);
  refreshTxTypeUI();
}

function submitTransactionForm() {
  const amount = parseMoneyInput(document.getElementById('f-amount').value);
  if (!amount) { toast('Vui lòng nhập số tiền', true); return; }
  const t = {
    id: formDraft.editId,
    type: formDraft.txType,
    date: document.getElementById('f-date').value || todayStr(),
    amount,
    category: document.getElementById('f-category').value.trim(),
    note: document.getElementById('f-note').value.trim(),
  };
  DB.saveTransaction(t);
  toast('Đã lưu');
  closeSheet();
  render();
}

// ---------------------------------------------------------------------
// SETTINGS (Backup / Restore)
// ---------------------------------------------------------------------
// Đọc file ảnh, thu nhỏ về tối đa maxSize x maxSize (giữ tỉ lệ) rồi trả về
// data URL (PNG) — tránh lưu ảnh QR gốc quá nặng vào localStorage/đồng bộ.
function resizeImageToDataUrl(file, maxSize) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Ảnh không hợp lệ'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const scale = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function shopQrBlockHtml(shop) {
  return `
    <div id="shop-qr-preview" style="margin-bottom:8px">
      ${
        shop.bankQr
          ? `<img src="${shop.bankQr}" alt="Mã QR chuyển khoản" style="width:120px;height:120px;object-fit:contain;border:1px solid var(--border);border-radius:8px;background:#fff" />`
          : `<div class="help-text">Chưa có ảnh QR. Chọn ảnh mã QR chuyển khoản (chụp/tải từ app ngân hàng) để tự động in ở cuối hoá đơn.</div>`
      }
    </div>
    <div class="btn-row">
      <button type="button" class="btn btn-secondary" data-action="trigger-shop-qr-upload">📷 ${shop.bankQr ? 'Đổi ảnh QR' : 'Chọn ảnh QR'}</button>
      ${shop.bankQr ? `<button type="button" class="btn btn-danger" data-action="remove-shop-qr">Xoá QR</button>` : ''}
    </div>
  `;
}

// Vẽ lại QR xem trước ngay trong màn Cài đặt mỗi khi đổi ngân hàng/STK/tên —
// QR xem trước không có sẵn số tiền (số tiền chỉ tự điền lúc in hoá đơn thật).
function updateShopQrAutoPreview() {
  const previewEl = document.getElementById('shop-qr-auto-preview');
  if (!previewEl) return;
  const bankCode = document.getElementById('f-shop-bank-code')?.value;
  const accountNo = document.getElementById('f-shop-bank-account')?.value.trim();
  const accountName = document.getElementById('f-shop-bank-holder')?.value.trim();
  const bank = VIETQR_BANKS.find((b) => b.code === bankCode);
  if (!bank || !accountNo) {
    previewEl.innerHTML = '';
    return;
  }
  const payload = buildVietQrPayload({ bin: bank.bin, accountNo, accountName, purpose: 'Xem truoc' });
  const dataUrl = qrPayloadToDataUrl(payload, 4);
  previewEl.innerHTML = dataUrl
    ? `<img src="${dataUrl}" alt="Xem trước mã QR" style="width:120px;height:120px;border:1px solid var(--border);border-radius:8px;background:#fff" /><div class="help-text">Xem trước — số tiền sẽ tự điền khi in hoá đơn thật</div>`
    : `<div class="help-text">Không tạo được mã xem trước, kiểm tra lại số tài khoản.</div>`;
}

function renderSettings(app) {
  const counts = {
    items: DB.getItems().length,
    purchases: DB.getPurchases().length,
    sales: DB.getSales().length,
    transactions: DB.getTransactions().length,
    customers: DB.getCustomers().length,
  };
  const shop = DB.getShopInfo();
  app.innerHTML = `
    ${backToMoreLink()}
    <div class="settings-item">
      <h3>📦 Dữ liệu hiện có</h3>
      <p>${counts.items} mặt hàng · ${counts.purchases} lần nhập · ${counts.sales} lần bán · ${counts.transactions} khoản thu/chi · ${counts.customers} khách hàng</p>
    </div>
    <div class="settings-item">
      <h3>🔗 Gộp mặt hàng trùng tên thành 1 mã</h3>
      <p>Ở màn hình Mặt hàng, những sản phẩm cùng tên đang chỉ được gộp để HIỂN THỊ (nhãn "🔗 Gộp"), thực chất phía sau vẫn là nhiều mã riêng biệt. Bấm nút dưới để gộp thật sự tất cả các nhóm này thành đúng 1 mã/mặt hàng cho dễ nhìn — toàn bộ lịch sử nhập/bán được giữ nguyên, chỉ gộp mã mặt hàng, không thể hoàn tác trừ khi phục hồi từ backup.</p>
      <button class="btn btn-primary" data-action="do-merge-duplicates">🔗 Gộp tất cả mặt hàng trùng tên</button>
    </div>
    <div class="settings-item">
      <h3>☁️ Đồng bộ nhiều người dùng (GitHub riêng tư)</h3>
      <p>Cho phép nhiều nhân viên trên nhiều máy cùng dùng chung 1 bộ dữ liệu, lưu trên 1 repository <b>private</b> riêng trên GitHub (khác với repo chứa mã nguồn app đang public). <b>Bắt buộc phải có mạng</b> khi đã bật đồng bộ. Mỗi máy cần nhập cấu hình này 1 lần.</p>
      ${cloudSyncFormHtml()}
    </div>
    <div class="settings-item">
      <h3>🏪 Thông tin cửa hàng (hiện trên hoá đơn in)</h3>
      <div class="form-group">
        <label>Tên cửa hàng</label>
        <input type="text" id="f-shop-name" value="${escapeHtml(shop.name || '')}" placeholder="VD: Điện máy ABC" />
      </div>
      <div class="form-group">
        <label>Số điện thoại</label>
        <input type="tel" id="f-shop-phone" value="${escapeHtml(shop.phone || '')}" placeholder="09xxxxxxxx" />
      </div>
      <div class="form-group">
        <label>Địa chỉ</label>
        <input type="text" id="f-shop-address" value="${escapeHtml(shop.address || '')}" placeholder="Địa chỉ cửa hàng..." />
      </div>
      <div class="form-group">
        <label>Thông tin bảo hành (in ở cuối hoá đơn)</label>
        <textarea id="f-shop-warranty" rows="3" placeholder="VD: Bảo hành 12 tháng lỗi phần cứng NSX. Không áp dụng với cháy nổ, vào nước, rơi vỡ, tự ý sửa chữa...">${escapeHtml(shop.warranty || '')}</textarea>
      </div>
      <div class="form-group">
        <label>🖨️ Khổ giấy in hoá đơn</label>
        <p class="help-text" style="margin-bottom:8px">Chọn đúng khổ giấy của máy in để hộp thoại in tự nhận đúng kích thước, không phải tự chọn A4/A5/A6 mỗi lần in nữa.</p>
        <select id="f-shop-print-size">
          ${PRINT_PAPER_SIZES.map((p) => `<option value="${p.value}" ${(shop.printPaperSize || '80mm') === p.value ? 'selected' : ''}>${escapeHtml(p.label)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>🏦 Tự tạo mã QR chuyển khoản theo số tài khoản</label>
        <p class="help-text" style="margin-bottom:8px">Chọn ngân hàng + nhập số tài khoản, app tự vẽ mã QR chuẩn VietQR ngay trên máy (không cần mạng). Khi in hoá đơn, mã QR tự điền sẵn đúng số tiền của đơn đó.</p>
        <div class="form-group">
          <label>Ngân hàng</label>
          <select id="f-shop-bank-code">
            <option value="">-- Chọn ngân hàng --</option>
            ${VIETQR_BANKS.map((b) => `<option value="${b.code}" ${shop.bankCode === b.code ? 'selected' : ''}>${escapeHtml(b.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Số tài khoản</label>
          <input type="text" inputmode="numeric" id="f-shop-bank-account" value="${escapeHtml(shop.bankAccountNo || '')}" placeholder="VD: 0123456789" />
        </div>
        <div class="form-group">
          <label>Tên chủ tài khoản (không dấu)</label>
          <input type="text" id="f-shop-bank-holder" value="${escapeHtml(shop.bankAccountName || '')}" placeholder="VD: NGUYEN VAN A" />
        </div>
        <label style="display:flex;align-items:center;gap:8px;font-weight:400;font-size:13.5px;margin-bottom:10px">
          <input type="checkbox" id="f-shop-qr-dynamic" ${shop.qrDynamicAmount === false ? '' : 'checked'} style="width:auto" />
          Tự điền đúng số tiền hoá đơn vào mã QR khi in
        </label>
        <div id="shop-qr-auto-preview"></div>
      </div>
      <div class="form-group">
        <label>Thông tin chuyển khoản (hiện dưới mã QR)</label>
        <input type="text" id="f-shop-bank-info" value="${escapeHtml(shop.bankInfo || '')}" placeholder="VD: MB Bank - 0123456789 - NGUYEN VAN A" />
      </div>
      <div class="form-group">
        <label>Hoặc dùng ảnh QR có sẵn (nếu ngân hàng không có trong danh sách trên)</label>
        <div id="shop-qr-block">${shopQrBlockHtml(shop)}</div>
        <input type="file" id="f-shop-qr-file" accept="image/*" style="display:none" />
      </div>
      <button class="btn btn-primary" data-action="save-shop-info">Lưu thông tin cửa hàng</button>
    </div>
    <div class="settings-item">
      <h3>🛒 Nhập danh sách mặt hàng đầy đủ (từ KiotViet, Sapo...)</h3>
      <p>Dành cho file Excel xuất trực tiếp từ phần mềm bán hàng khác (VD: "Danh sách sản phẩm" của KiotViet) — app tự nhận diện các cột <b>Tên hàng, Nhóm hàng, Mã vạch, Giá bán, Giá vốn, Tồn kho, Serial/IMEI</b>. Mỗi dòng sẽ tạo/cập nhật 1 mặt hàng VÀ tạo luôn 1 lô "tồn kho ban đầu" đúng bằng số Tồn kho + giá vốn ghi trong file (kèm từng IMEI nếu có). Nhập lại cùng file sẽ tự bỏ qua phần tồn kho đã tạo trước đó, không bị cộng dồn/nhân đôi.</p>
      ${importRowHtml('productlist', '🛒 Danh sách mặt hàng đầy đủ (.xlsx)')}
    </div>
    <div class="settings-item">
      <h3>🗂️ Nhập từ file quản lý IMEI (nhiều sheet)</h3>
      <p>Dành cho file Excel kiểu quản lý theo từng máy/IMEI, có nhiều sheet theo tháng (VD: JAN2026, FEB2026...) với các cột <b>IMEI, Product_Name, Model, Status, Giá nhập, Giá bán, Ngày nhập, Ngày bán, Notes</b>. App sẽ tự quét tất cả sheet có đúng cột này (bỏ qua các sheet khác như LISTS/HELP), mỗi dòng là 1 máy: dòng có Status = <b>SOLD</b> sẽ tạo cả lượt nhập lẫn lượt bán, các trạng thái khác (IN_STOCK, WARRANTY, RETURNED, UNDER_REPAIR, LOST...) chỉ tạo lượt nhập (vẫn tính vào tồn kho) kèm ghi chú trạng thái gốc. Nhập lại file đã nhập trước đó sẽ tự bỏ qua các dòng trùng, không tạo dữ liệu đôi.</p>
      ${importRowHtml('imeifile', '🗂️ File quản lý IMEI (.xlsx nhiều sheet)')}
    </div>
    <div class="settings-item">
      <h3>📥 Nhập dữ liệu từ Excel</h3>
      <p>Nhập nhanh dữ liệu có sẵn từ file Excel (.xlsx) hoặc CSV thay vì gõ tay từng dòng. Tải file mẫu trước để điền đúng cột — dòng nào thiếu thông tin bắt buộc sẽ bị bỏ qua và báo lại sau khi nhập.</p>
      ${importRowHtml('items', '📦 Danh sách mặt hàng')}
      ${importRowHtml('customers', '👥 Danh sách khách hàng')}
      ${importRowHtml('purchases', '📥 Lịch sử nhập hàng')}
      ${importRowHtml('sales', '💵 Lịch sử bán hàng')}
    </div>
    <div class="settings-item">
      <h3>⬇️ Sao lưu dữ liệu (Backup)</h3>
      <p>Xuất toàn bộ dữ liệu ra 1 file .json để lưu trữ hoặc chuyển sang máy khác.</p>
      <button class="btn btn-primary" data-action="do-backup">Xuất file backup</button>
    </div>
    <div class="settings-item">
      <h3>⬆️ Phục hồi dữ liệu (Restore)</h3>
      <p>Chọn file backup .json đã lưu trước đó để khôi phục dữ liệu (sẽ thay thế toàn bộ dữ liệu hiện tại).</p>
      <button class="btn btn-secondary" data-action="trigger-restore">Chọn file backup...</button>
      <input type="file" id="restore-file-input" accept="application/json,.json" style="display:none" />
    </div>
    <div class="settings-item">
      <h3>🗑️ Xoá toàn bộ dữ liệu</h3>
      <p>Xoá sạch mặt hàng, khách hàng, lịch sử nhập/bán và thu chi. Hãy backup trước khi làm điều này!</p>
      <button class="btn btn-danger" data-action="do-clear-all">Xoá toàn bộ dữ liệu</button>
    </div>
    <div class="settings-item">
      <h3>ℹ️ Cài app vào màn hình chính (Android)</h3>
      <p>Mở app này bằng Chrome → bấm nút ⋮ (menu 3 chấm góc trên) → chọn "Thêm vào Màn hình chính" / "Install app". App sẽ chạy như app thật, có icon riêng. Dữ liệu lưu ngay trên điện thoại — nhớ backup định kỳ để tránh mất dữ liệu khi đổi máy hoặc xoá cache.</p>
    </div>
    <div class="settings-item">
      <h3>📷 Về tính năng quét mã vạch</h3>
      <p>Quét mã vạch bằng camera cần mở app qua địa chỉ http/https (không phải mở file trực tiếp). Nếu chưa quét được, bạn vẫn có thể gõ tay mã vạch vào ô "Mã vạch" khi thêm mặt hàng, hoặc dùng tạm app quét mã có sẵn trên máy rồi copy mã vào.</p>
    </div>
  `;
  document.getElementById('restore-file-input').addEventListener('change', handleRestoreFile);
  document.getElementById('f-shop-qr-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Vui lòng chọn 1 file ảnh (JPG/PNG)', true);
      return;
    }
    try {
      const dataUrl = await resizeImageToDataUrl(file, 300);
      const info = DB.getShopInfo();
      info.bankQr = dataUrl;
      DB.saveShopInfo(info);
      toast('Đã lưu ảnh mã QR');
      const block = document.getElementById('shop-qr-block');
      if (block) block.innerHTML = shopQrBlockHtml(info);
    } catch (err) {
      toast('Không đọc được ảnh, thử lại nhé', true);
    }
  });
  updateShopQrAutoPreview();
  ['f-shop-bank-code', 'f-shop-bank-account', 'f-shop-bank-holder'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateShopQrAutoPreview);
  });
  IMPORT_TYPES.forEach((type) => {
    document.getElementById(`f-import-${type}`).addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) EXCEL_IMPORTERS[type](file);
      e.target.value = '';
    });
  });
}

function cloudSyncFormHtml() {
  const cfg = typeof Cloud !== 'undefined' ? Cloud.getConfig() : null;
  const everSynced = cfg && !!localStorage.getItem(CLOUD_STATE_KEY);
  if (cfg && everSynced) {
    const lastSync = Cloud._lastSyncedAt
      ? new Date(Cloud._lastSyncedAt).toLocaleString('vi-VN')
      : 'chưa đồng bộ ở phiên làm việc này';
    return `
      <div class="li-sub">Đang kết nối tới: <b>${escapeHtml(cfg.owner)}/${escapeHtml(cfg.repo)}</b> (nhánh ${escapeHtml(cfg.branch || 'main')})</div>
      <div class="li-sub">File dữ liệu: <code>${escapeHtml(cfg.path)}</code></div>
      <div class="li-sub">Đồng bộ gần nhất: ${lastSync}</div>
      <div class="btn-row">
        <button class="btn btn-secondary" data-action="cloud-sync-now">🔄 Đồng bộ lại ngay</button>
        <button class="btn btn-danger" data-action="cloud-disconnect">Ngắt kết nối</button>
      </div>
    `;
  }
  return `
    <div class="form-group">
      <label>Chủ tài khoản/tổ chức GitHub (owner)</label>
      <input type="text" id="f-cloud-owner" value="${escapeHtml(cfg?.owner || '')}" placeholder="VD: vietng228" />
    </div>
    <div class="form-group">
      <label>Tên repository (private)</label>
      <input type="text" id="f-cloud-repo" value="${escapeHtml(cfg?.repo || '')}" placeholder="VD: quanly-data" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Nhánh</label>
        <input type="text" id="f-cloud-branch" value="${escapeHtml(cfg?.branch || 'main')}" />
      </div>
      <div class="form-group">
        <label>Đường dẫn file dữ liệu</label>
        <input type="text" id="f-cloud-path" value="${escapeHtml(cfg?.path || 'data/store-data.json')}" />
      </div>
    </div>
    <div class="form-group">
      <label>Personal Access Token</label>
      <input type="password" id="f-cloud-token" value="${escapeHtml(cfg?.token || '')}" placeholder="ghp_... hoặc github_pat_..." />
    </div>
    <button class="btn btn-primary" data-action="cloud-save-config">Lưu & Kết nối</button>
  `;
}

function importRowHtml(type, label) {
  return `
    <div style="margin-bottom:14px">
      <div class="li-title" style="margin-bottom:6px">${label}</div>
      <div class="btn-row" style="margin-top:0">
        <button class="btn btn-secondary" data-action="download-import-template" data-type="${type}">Tải file mẫu</button>
        <button class="btn btn-primary" data-action="trigger-import" data-type="${type}">Chọn file...</button>
      </div>
      <input type="file" id="f-import-${type}" accept=".xlsx,.xls,.csv" style="display:none" />
    </div>`;
}

function doBackup() {
  const payload = DB.exportAll();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = todayStr();
  a.href = url;
  a.download = `backup-thuchi-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast('Đã xuất file backup');
}

function handleRestoreFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(reader.result);
      const summary = payload?.data
        ? `${(payload.data.items || []).length} mặt hàng, ${(payload.data.purchases || []).length} lần nhập, ${(payload.data.sales || []).length} lần bán, ${(payload.data.transactions || []).length} thu/chi, ${(payload.data.customers || []).length} khách hàng`
        : '';
      const cloudWarn =
        typeof Cloud !== 'undefined' && Cloud.isConfigured()
          ? '\n\n⚠️ Máy này đang đồng bộ chung với GitHub — phục hồi sẽ THAY THẾ luôn dữ liệu dùng chung của cả nhóm!'
          : '';
      if (!confirmDialog(`File backup có: ${summary}.\n\nPhục hồi sẽ THAY THẾ toàn bộ dữ liệu hiện tại. Tiếp tục?${cloudWarn}`)) return;
      DB.importAll(payload, 'replace');
      toast('Phục hồi dữ liệu thành công');
      render();
    } catch (err) {
      toast('File backup không hợp lệ: ' + err.message, true);
    } finally {
      e.target.value = '';
    }
  };
  reader.readAsText(file);
}

function doClearAll() {
  const cloudWarn =
    typeof Cloud !== 'undefined' && Cloud.isConfigured()
      ? ' Máy này đang đồng bộ chung với GitHub — xoá sẽ xoá luôn dữ liệu dùng chung của cả nhóm!'
      : '';
  if (!confirmDialog('Chắc chắn xoá TOÀN BỘ dữ liệu? Hành động này không thể hoàn tác (trừ khi bạn có file backup).' + cloudWarn)) return;
  if (!confirmDialog('Xác nhận lần cuối: xoá hết dữ liệu?')) return;
  DB.clearAll();
  toast('Đã xoá toàn bộ dữ liệu');
  render();
}

// ---------------------------------------------------------------------
// NHẬP DỮ LIỆU TỪ EXCEL (.xlsx / .xls / .csv) — dùng thư viện SheetJS (XLSX)
// ---------------------------------------------------------------------
const IMPORT_TYPES = ['items', 'productlist', 'customers', 'purchases', 'sales', 'imeifile'];

const IMPORT_ALIASES = {
  itemName: ['Tên mặt hàng', 'Tên mặt hàng*', 'Tên', 'Mặt hàng', 'Tên hàng'],
  category: ['Danh mục', 'Nhóm hàng(3 Cấp)', 'Nhóm hàng'],
  barcode: ['Mã vạch', 'Mã vạch/QR', 'Barcode'],
  productCode: ['Mã hàng', 'Mã sản phẩm', 'Mã SP', 'SKU'],
  model: ['Model', 'Tên model'],
  costPrice: ['Giá nhập', 'Giá nhập*', 'Giá nhập mặc định', 'Giá vốn'],
  sellPrice: ['Giá bán', 'Giá bán*', 'Giá bán mặc định'],
  unit: ['Đơn vị', 'Đơn vị tính'],
  note: ['Ghi chú'],
  custName: ['Tên khách hàng', 'Tên khách hàng*', 'Tên'],
  phone: ['Số điện thoại', 'Số điện thoại*', 'SĐT', 'Số điện thoại khách', 'Số điện thoại khách hàng'],
  address: ['Địa chỉ', 'Địa chỉ khách', 'Địa chỉ khách hàng'],
  date: ['Ngày', 'Ngày (yyyy-mm-dd)', 'Ngày (yyyy-mm-dd)*'],
  quantity: ['Số lượng', 'Số lượng*'],
  imei: ['IMEI', 'IMEI/Seri', 'IMEI/Seri (cách nhau bởi dấu phẩy)', 'Số seri', 'Serial/IMEI'],
  stockQty: ['Tồn kho'],
};

// Cột của file quản lý theo từng máy/IMEI (nhiều sheet theo tháng) — khớp với
// kiểu file phổ biến dùng để quản lý điện thoại/điện máy theo từng IMEI.
const IMEI_FILE_ALIASES = {
  imei: ['IMEI'],
  productName: ['Product_Name', 'Tên sản phẩm', 'Tên mặt hàng'],
  model: ['Model'],
  status: ['Status', 'Trạng thái'],
  costPrice: ['Giá nhập'],
  sellPrice: ['Giá bán'],
  purchaseDate: ['Ngày nhập'],
  saleDate: ['Ngày bán'],
  notes: ['Notes', 'Ghi chú'],
};

const TEMPLATE_HEADERS = {
  items: ['Tên mặt hàng', 'Danh mục', 'Mã vạch', 'Mã sản phẩm', 'Model', 'Giá nhập', 'Giá bán', 'Đơn vị', 'Ghi chú'],
  productlist: ['Tên hàng', 'Nhóm hàng(3 Cấp)', 'Mã hàng', 'Mã vạch', 'Model', 'Giá bán', 'Giá vốn', 'Tồn kho', 'Serial/IMEI'],
  customers: ['Tên khách hàng', 'Số điện thoại', 'Địa chỉ', 'Ghi chú'],
  purchases: ['Ngày (yyyy-mm-dd)', 'Tên mặt hàng', 'Số lượng', 'Giá nhập', 'IMEI/Seri', 'Ghi chú'],
  sales: [
    'Ngày (yyyy-mm-dd)', 'Tên mặt hàng', 'Số lượng', 'Giá bán', 'IMEI/Seri',
    'Tên khách hàng', 'Số điện thoại khách', 'Địa chỉ khách', 'Ghi chú',
  ],
  imeifile: ['IMEI', 'Product_Name', 'Model', 'Status', 'Giá nhập', 'Giá bán', 'Ngày nhập', 'Ngày bán', 'Notes'],
};
const TEMPLATE_SAMPLE_ROW = {
  items: ['Tai nghe Bluetooth ABC', 'Khác', '', 'SP001', '', 150000, 250000, 'cái', ''],
  productlist: [
    ['Tivi Xiaomi 55 inch', 'Tivi xiaomi', 'SP-TV001', '6941948700000', '', 8300000, 6800000, 5, '355600000101|355600000102|355600000103'],
    ['Tai nghe Bluetooth ABC', 'Phụ kiện', '', '', '', 250000, 150000, 10, ''],
  ],
  customers: ['Nguyễn Văn A', '0909123456', '123 Đường ABC, Quận 1', ''],
  purchases: [todayStr(), 'Tai nghe Bluetooth ABC', 5, 150000, '', ''],
  sales: [todayStr(), 'Tai nghe Bluetooth ABC', 1, 250000, '', 'Nguyễn Văn A', '0909123456', '', ''],
  imeifile: [
    ['355600000184', 'Redmi Note 13', 'L13-ABC', 'SOLD', 3000000, 4200000, todayStr(), todayStr(), 'Anh Nam - Việt Trì'],
    ['355600000185', 'Redmi Note 13', 'L13-ABC', 'IN_STOCK', 3000000, '', todayStr(), '', ''],
  ],
};
const TEMPLATE_FILENAMES = {
  items: 'mau-nhap-mat-hang.xlsx',
  productlist: 'mau-danh-sach-mat-hang-day-du.xlsx',
  customers: 'mau-nhap-khach-hang.xlsx',
  purchases: 'mau-nhap-lich-su-nhap-hang.xlsx',
  sales: 'mau-nhap-lich-su-ban-hang.xlsx',
  imeifile: 'mau-nhap-file-imei.xlsx',
};

function downloadExcelTemplate(type) {
  const sample = TEMPLATE_SAMPLE_ROW[type];
  const sampleRows = Array.isArray(sample[0]) ? sample : [sample];
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS[type], ...sampleRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Mẫu');
  XLSX.writeFile(wb, TEMPLATE_FILENAMES[type]);
}

function readExcelWorkbook(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('không đọc được file'));
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        resolve(XLSX.read(data, { type: 'array', cellDates: true }));
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

function readExcelRows(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('không đọc được file'));
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        resolve(XLSX.utils.sheet_to_json(ws, { defval: '', raw: true }));
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

function normHeader(h) {
  return String(h || '').trim().toLowerCase();
}
function getField(row, aliases) {
  const keys = Object.keys(row);
  for (const k of keys) {
    const nk = normHeader(k);
    if (aliases.some((a) => normHeader(a) === nk)) return row[k];
  }
  return undefined;
}
function fieldText(row, aliases) {
  const v = getField(row, aliases);
  return v === undefined || v === null ? '' : String(v).trim();
}

function parseImportDate(val) {
  if (val instanceof Date && !isNaN(val)) return toISODate(val);
  if (typeof val === 'number') {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(d)) return toISODate(d);
  }
  if (typeof val === 'string') {
    const s = val.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) {
      const [, d, mo, y] = m;
      return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }
  return null;
}

function findOrCreateItemForImport(name, barcode) {
  const trimmedName = String(name || '').trim();
  if (!trimmedName) return null;
  const items = DB.getItems();
  let item = null;
  if (barcode) item = items.find((i) => i.barcode && i.barcode === String(barcode).trim());
  if (!item) item = items.find((i) => i.name.trim().toLowerCase() === trimmedName.toLowerCase());
  if (!item) {
    item = DB.saveItem({
      name: trimmedName,
      category: '',
      barcode: barcode ? String(barcode).trim() : '',
      defaultCostPrice: 0,
      defaultSellPrice: 0,
      unit: 'cái',
      note: '',
    });
  }
  return item;
}

function findOrCreateCustomerForImport(name, phone, address) {
  const trimmedName = String(name || '').trim();
  if (!trimmedName) return null;
  const customers = DB.getCustomers();
  let existing = phone ? customers.find((c) => c.phone && c.phone === String(phone).trim()) : null;
  if (!existing) existing = customers.find((c) => c.name.trim().toLowerCase() === trimmedName.toLowerCase());
  const c = {
    id: existing ? existing.id : null,
    name: trimmedName,
    phone: phone ? String(phone).trim() : existing?.phone || '',
    address: address ? String(address).trim() : existing?.address || '',
    note: existing?.note || '',
  };
  return DB.saveCustomer(c);
}

function showImportResult(title, successCount, errors, summaryOverride) {
  const ERROR_DISPLAY_CAP = 100;
  const shown = errors.slice(0, ERROR_DISPLAY_CAP);
  const moreCount = errors.length - shown.length;
  const errHtml = errors.length
    ? `<div class="section-title" style="margin-top:10px">Bỏ qua / cảnh báo (${errors.length} dòng)</div>
       <div style="max-height:220px; overflow-y:auto; font-size:12.5px; color:var(--muted); line-height:1.6">${shown
         .map((e) => escapeHtml(e))
         .join('<br/>')}${moreCount > 0 ? `<br/>... và ${moreCount} dòng khác` : ''}</div>`
    : '';
  const summaryText = summaryOverride || `Đã nhập thành công <b>${successCount}</b> dòng.`;
  openSheet(`
    <div class="sheet-title">${escapeHtml(title)}</div>
    <p>${summaryText}${errors.length ? ` Bỏ qua/cảnh báo ${errors.length} dòng (xem chi tiết bên dưới).` : ''}</p>
    ${errHtml}
    <div class="btn-row">
      <button class="btn btn-primary" data-action="close-sheet">Đóng</button>
    </div>
  `);
}

async function importItemsFromExcel(file) {
  let rows;
  try {
    rows = await readExcelRows(file);
  } catch (err) {
    toast('Không đọc được file: ' + err.message, true);
    return;
  }
  let success = 0;
  const errors = [];
  rows.forEach((row, idx) => {
    const name = fieldText(row, IMPORT_ALIASES.itemName);
    if (!name) {
      errors.push(`Dòng ${idx + 2}: thiếu tên mặt hàng`);
      return;
    }
    const existing = DB.getItems().find((i) => i.name.trim().toLowerCase() === name.toLowerCase());
    const item = {
      id: existing ? existing.id : null,
      name,
      category: fieldText(row, IMPORT_ALIASES.category) || existing?.category || '',
      barcode: fieldText(row, IMPORT_ALIASES.barcode) || existing?.barcode || '',
      productCode: fieldText(row, IMPORT_ALIASES.productCode) || existing?.productCode || '',
      model: fieldText(row, IMPORT_ALIASES.model) || existing?.model || '',
      defaultCostPrice: parseMoneyInput(getField(row, IMPORT_ALIASES.costPrice) ?? existing?.defaultCostPrice ?? 0),
      defaultSellPrice: parseMoneyInput(getField(row, IMPORT_ALIASES.sellPrice) ?? existing?.defaultSellPrice ?? 0),
      unit: fieldText(row, IMPORT_ALIASES.unit) || existing?.unit || 'cái',
      note: fieldText(row, IMPORT_ALIASES.note) || existing?.note || '',
    };
    if (existing) {
      item.lastCostPrice = existing.lastCostPrice;
      item.createdAt = existing.createdAt;
    }
    DB.saveItem(item);
    success++;
  });
  showImportResult('Nhập mặt hàng từ Excel', success, errors);
  render();
}

// Đánh dấu các lô "tồn kho ban đầu" được tạo ra bởi import danh sách mặt
// hàng đầy đủ (productlist) — nhờ đó nếu người dùng nhập lại cùng 1 file,
// app tự bỏ qua để không cộng dồn/nhân đôi tồn kho.
const PRODUCTLIST_OPENING_STOCK_TAG = '[Tồn kho ban đầu - nhập từ danh sách mặt hàng]';

// Nhập 1 file Excel xuất từ phần mềm bán hàng (KiotViet, Sapo...) có đầy đủ
// cột Tên hàng/Nhóm hàng/Giá bán/Giá vốn/Tồn kho/Serial-IMEI — tạo/cập nhật
// mặt hàng VÀ tạo luôn 1 lô nhập kho ban đầu giữ đúng số tồn + giá vốn hiện
// tại của từng mặt hàng, kèm IMEI nếu có.
async function importProductListFromExcel(file) {
  let rows;
  try {
    rows = await readExcelRows(file);
  } catch (err) {
    toast('Không đọc được file: ' + err.message, true);
    return;
  }
  let itemCount = 0;
  let stockCount = 0;
  let skippedStockCount = 0;
  const errors = [];
  rows.forEach((row, idx) => {
    const name = fieldText(row, IMPORT_ALIASES.itemName);
    if (!name) {
      errors.push(`Dòng ${idx + 2}: thiếu tên mặt hàng, bỏ qua`);
      return;
    }
    const barcode = fieldText(row, IMPORT_ALIASES.barcode);
    const productCode = fieldText(row, IMPORT_ALIASES.productCode);
    const model = fieldText(row, IMPORT_ALIASES.model);
    // Ưu tiên khớp theo Mã sản phẩm (mã hàng, ổn định nhất), rồi tới Mã vạch,
    // cuối cùng mới tới tên — để "cập nhật lại toàn bộ sản phẩm" không bị tạo
    // trùng khi tên hàng đổi nhẹ giữa các lần xuất file.
    const existing = DB.getItems().find(
      (i) =>
        (productCode && i.productCode && i.productCode === productCode) ||
        (barcode && i.barcode && i.barcode === barcode) ||
        i.name.trim().toLowerCase() === name.toLowerCase()
    );
    const costPrice = parseMoneyInput(getField(row, IMPORT_ALIASES.costPrice) ?? existing?.defaultCostPrice ?? 0);
    const item = {
      id: existing ? existing.id : null,
      name,
      category: fieldText(row, IMPORT_ALIASES.category) || existing?.category || '',
      barcode: barcode || existing?.barcode || '',
      productCode: productCode || existing?.productCode || '',
      model: model || existing?.model || '',
      defaultCostPrice: costPrice,
      defaultSellPrice: parseMoneyInput(getField(row, IMPORT_ALIASES.sellPrice) ?? existing?.defaultSellPrice ?? 0),
      unit: existing?.unit || 'cái',
      note: existing?.note || '',
    };
    if (existing) item.createdAt = existing.createdAt;
    const saved = DB.saveItem(item);
    itemCount++;

    const stockQtyRaw = getField(row, IMPORT_ALIASES.stockQty);
    const stockQty = Math.round(Number(stockQtyRaw)) || 0;
    if (stockQty > 0) {
      const alreadyImported = DB.getPurchases().some(
        (p) => p.itemId === saved.id && p.note === PRODUCTLIST_OPENING_STOCK_TAG
      );
      if (alreadyImported) {
        skippedStockCount++;
      } else {
        const imeiList = fieldText(row, IMPORT_ALIASES.imei)
          .split(/[,|]/)
          .map((s) => s.trim())
          .filter(Boolean);
        DB.savePurchase({
          id: null,
          itemId: saved.id,
          date: todayStr(),
          quantity: imeiList.length > 0 ? imeiList.length : stockQty,
          costPrice,
          imei: imeiList.join(', '),
          note: PRODUCTLIST_OPENING_STOCK_TAG,
        });
        stockCount++;
      }
    }
  });
  const summary = `Đã nhập/cập nhật <b>${itemCount}</b> mặt hàng · tạo <b>${stockCount}</b> lô tồn kho ban đầu${
    skippedStockCount ? ` · bỏ qua <b>${skippedStockCount}</b> mặt hàng đã có tồn kho ban đầu từ lần nhập trước` : ''
  }.`;
  showImportResult('Nhập danh sách mặt hàng đầy đủ', itemCount, errors, summary);
  render();
}

async function importCustomersFromExcel(file) {
  let rows;
  try {
    rows = await readExcelRows(file);
  } catch (err) {
    toast('Không đọc được file: ' + err.message, true);
    return;
  }
  let success = 0;
  const errors = [];
  rows.forEach((row, idx) => {
    const name = fieldText(row, IMPORT_ALIASES.custName);
    if (!name) {
      errors.push(`Dòng ${idx + 2}: thiếu tên khách hàng`);
      return;
    }
    findOrCreateCustomerForImport(name, fieldText(row, IMPORT_ALIASES.phone), fieldText(row, IMPORT_ALIASES.address));
    const note = fieldText(row, IMPORT_ALIASES.note);
    if (note) {
      const customers = DB.getCustomers();
      const c = customers.find((x) => x.name.trim().toLowerCase() === name.toLowerCase());
      if (c) DB.saveCustomer({ ...c, note });
    }
    success++;
  });
  showImportResult('Nhập khách hàng từ Excel', success, errors);
  render();
}

async function importPurchasesFromExcel(file) {
  let rows;
  try {
    rows = await readExcelRows(file);
  } catch (err) {
    toast('Không đọc được file: ' + err.message, true);
    return;
  }
  let success = 0;
  const errors = [];
  rows.forEach((row, idx) => {
    const name = fieldText(row, IMPORT_ALIASES.itemName);
    if (!name) {
      errors.push(`Dòng ${idx + 2}: thiếu tên mặt hàng`);
      return;
    }
    const qtyRaw = getField(row, IMPORT_ALIASES.quantity);
    const quantity = Math.round(Number(qtyRaw));
    if (!qtyRaw || !quantity || quantity < 1) {
      errors.push(`Dòng ${idx + 2}: số lượng không hợp lệ`);
      return;
    }
    const date = parseImportDate(getField(row, IMPORT_ALIASES.date)) || todayStr();
    const item = findOrCreateItemForImport(name, fieldText(row, IMPORT_ALIASES.barcode));
    DB.savePurchase({
      id: null,
      itemId: item.id,
      date,
      quantity,
      costPrice: parseMoneyInput(getField(row, IMPORT_ALIASES.costPrice)),
      imei: fieldText(row, IMPORT_ALIASES.imei),
      note: fieldText(row, IMPORT_ALIASES.note),
    });
    success++;
  });
  showImportResult('Nhập lịch sử NHẬP hàng từ Excel', success, errors);
  render();
}

async function importSalesFromExcel(file) {
  let rows;
  try {
    rows = await readExcelRows(file);
  } catch (err) {
    toast('Không đọc được file: ' + err.message, true);
    return;
  }
  let success = 0;
  const errors = [];
  rows.forEach((row, idx) => {
    const name = fieldText(row, IMPORT_ALIASES.itemName);
    if (!name) {
      errors.push(`Dòng ${idx + 2}: thiếu tên mặt hàng`);
      return;
    }
    const qtyRaw = getField(row, IMPORT_ALIASES.quantity);
    const quantity = Math.round(Number(qtyRaw));
    if (!qtyRaw || !quantity || quantity < 1) {
      errors.push(`Dòng ${idx + 2}: số lượng không hợp lệ`);
      return;
    }
    const date = parseImportDate(getField(row, IMPORT_ALIASES.date)) || todayStr();
    const item = findOrCreateItemForImport(name, fieldText(row, IMPORT_ALIASES.barcode));
    const custName = fieldText(row, IMPORT_ALIASES.custName);
    const custPhone = fieldText(row, IMPORT_ALIASES.phone);
    const custAddress = fieldText(row, IMPORT_ALIASES.address);
    let customerId = null;
    if (custName) {
      const c = findOrCreateCustomerForImport(custName, custPhone, custAddress);
      customerId = c ? c.id : null;
    }
    const costBasis = getLatestCostPrice(item.id);
    DB.saveSale({
      id: null,
      itemId: item.id,
      customerId,
      date,
      quantity,
      sellPrice: parseMoneyInput(getField(row, IMPORT_ALIASES.sellPrice)),
      costPriceAtSale: costBasis,
      imei: fieldText(row, IMPORT_ALIASES.imei),
      customerName: custName,
      customerPhone: custPhone,
      customerAddress: custAddress,
      note: fieldText(row, IMPORT_ALIASES.note),
    });
    success++;
  });
  showImportResult('Nhập lịch sử BÁN hàng từ Excel', success, errors);
  render();
}

async function importImeiFileFromExcel(file) {
  let wb;
  try {
    wb = await readExcelWorkbook(file);
  } catch (err) {
    toast('Không đọc được file: ' + err.message, true);
    return;
  }

  let purchaseCount = 0;
  let saleCount = 0;
  let dupCount = 0;
  let matchedSheets = 0;
  const errors = [];

  wb.SheetNames.forEach((sheetName) => {
    const ws = wb.Sheets[sheetName];
    const headerRow = (XLSX.utils.sheet_to_json(ws, { header: 1, range: 0, defval: '' })[0] || []).map(normHeader);
    const hasImei = IMEI_FILE_ALIASES.imei.some((a) => headerRow.includes(normHeader(a)));
    const hasProductName = IMEI_FILE_ALIASES.productName.some((a) => headerRow.includes(normHeader(a)));
    if (!hasImei || !hasProductName) return; // sheet khác định dạng (VD: LISTS, HELP) -> bỏ qua êm

    matchedSheets++;
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '', raw: true });
    rows.forEach((row, idx) => {
      const rowLabel = `${sheetName} dòng ${idx + 2}`;
      const productName = fieldText(row, IMEI_FILE_ALIASES.productName);
      if (!productName) return; // dòng trống (rất nhiều dòng trắng cuối sheet) -> bỏ qua êm, không tính lỗi

      const imei = fieldText(row, IMEI_FILE_ALIASES.imei);
      const model = fieldText(row, IMEI_FILE_ALIASES.model);
      const status = fieldText(row, IMEI_FILE_ALIASES.status).toUpperCase();
      const costPrice = parseMoneyInput(getField(row, IMEI_FILE_ALIASES.costPrice));
      const sellPrice = parseMoneyInput(getField(row, IMEI_FILE_ALIASES.sellPrice));
      const purchaseDate = parseImportDate(getField(row, IMEI_FILE_ALIASES.purchaseDate));
      const saleDate = parseImportDate(getField(row, IMEI_FILE_ALIASES.saleDate));
      const notes = fieldText(row, IMEI_FILE_ALIASES.notes);

      const item = findOrCreateItemForImport(productName, '');
      if (model && item.model !== model) DB.saveItem({ ...item, model });

      if (!purchaseDate) {
        errors.push(`${rowLabel}: thiếu/sai Ngày nhập, bỏ qua dòng này`);
        return;
      }

      const existingPurchase = DB.getPurchases().find(
        (p) => p.itemId === item.id && p.date === purchaseDate && (imei ? p.imei === imei : p.costPrice === costPrice)
      );
      if (existingPurchase) {
        dupCount++;
      } else {
        DB.savePurchase({
          id: null,
          itemId: item.id,
          date: purchaseDate,
          quantity: 1,
          costPrice,
          imei,
          note: status && status !== 'SOLD' ? `[${status}]${notes ? ' ' + notes : ''}` : '',
        });
        purchaseCount++;
      }

      if (status === 'SOLD' && saleDate) {
        const existingSale = DB.getSales().find(
          (s) => s.itemId === item.id && s.date === saleDate && (imei ? s.imei === imei : s.sellPrice === sellPrice)
        );
        if (existingSale) {
          dupCount++;
        } else {
          const cust = notes ? findOrCreateCustomerForImport(notes, '', '') : null;
          DB.saveSale({
            id: null,
            itemId: item.id,
            customerId: cust ? cust.id : null,
            date: saleDate,
            quantity: 1,
            sellPrice,
            costPriceAtSale: costPrice,
            imei,
            customerName: notes,
            customerPhone: '',
            customerAddress: '',
            note: '',
          });
          saleCount++;
        }
      } else if (status === 'SOLD' && !saleDate) {
        errors.push(`${rowLabel}: Status=SOLD nhưng thiếu/sai Ngày bán -> chỉ nhập lượt nhập hàng, bỏ qua lượt bán`);
      }
    });
  });

  if (matchedSheets === 0) {
    toast('Không tìm thấy sheet nào đúng định dạng (cần có cột IMEI và Product_Name)', true);
    return;
  }

  const summary = `Đã quét <b>${matchedSheets}</b> sheet dữ liệu · <b>${purchaseCount}</b> lượt nhập hàng · <b>${saleCount}</b> lượt bán hàng${
    dupCount ? ` · bỏ qua <b>${dupCount}</b> dòng đã có sẵn (trùng với dữ liệu đã nhập trước đó)` : ''
  }.`;
  showImportResult('Nhập từ file quản lý IMEI', purchaseCount + saleCount, errors, summary);
  render();
}

const EXCEL_IMPORTERS = {
  items: importItemsFromExcel,
  productlist: importProductListFromExcel,
  customers: importCustomersFromExcel,
  purchases: importPurchasesFromExcel,
  sales: importSalesFromExcel,
  imeifile: importImeiFileFromExcel,
};

// ---------------------------------------------------------------------
// SERVICE WORKER (chạy offline)
// ---------------------------------------------------------------------
function registerServiceWorker() {
  // sw.js được đăng ký kèm ?v= để tránh bị CDN của GitHub Pages cache cứng
  // (đường dẫn không có query trước đây từng bị kẹt bản cũ nhiều phút sau khi
  // deploy bản mới). Bump số này mỗi khi sw.js thay đổi.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js?v=24').catch((err) => console.warn('SW lỗi:', err));
  }
}

document.addEventListener('DOMContentLoaded', init);
