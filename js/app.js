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

const state = {
  tab: 'dashboard',
  period: 'day',
  cashPeriod: 'all',
  itemSearch: '',
  itemCategoryFilter: 'all',
  customerSearch: '',
};

const TITLES = {
  dashboard: 'Tổng quan',
  sales: 'Bán hàng',
  purchases: 'Nhập hàng',
  customers: 'Khách hàng',
  more: 'Thêm',
  items: 'Mặt hàng',
  cashflow: 'Thu chi',
  settings: 'Cài đặt',
};

// các tab con nằm trong menu "Thêm"
const MORE_SUBTABS = ['items', 'cashflow', 'settings'];

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
    'add-customer': () => openCustomerForm(null),
    'edit-customer': () => openCustomerForm(DB.getCustomer(id)),
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
    'share-customers': shareCustomers,
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
    'scan-for-sale-imei': () => {
      Scanner.open((code) => {
        document.getElementById('f-sale-imei').value = code;
      });
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
  const { start, end, label } = getPeriodRange(period);
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

  // top mặt hàng bán chạy trong kỳ
  const byItem = {};
  sales.forEach((s) => {
    byItem[s.itemId] = byItem[s.itemId] || { qty: 0, revenue: 0 };
    byItem[s.itemId].qty += s.quantity;
    byItem[s.itemId].revenue += s.sellPrice * s.quantity;
  });
  const top = Object.entries(byItem)
    .map(([itemId, v]) => ({ item: DB.getItem(itemId), ...v }))
    .filter((x) => x.item)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return { label, revenue, costOfSold, grossProfit, purchaseSpend, thuKhac, chiKhac, netProfit, salesCount: sales.length, top };
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
    </div>
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
    <div class="section-title">Mặt hàng bán chạy</div>
    ${
      s.top.length === 0
        ? '<div class="empty-state">Chưa có dữ liệu bán hàng trong kỳ này.</div>'
        : s.top
            .map(
              (x) => `
      <div class="list-item">
        <div class="li-main">
          <div class="li-title">${escapeHtml(x.item.name)}</div>
          <div class="li-sub">Đã bán ${x.qty} · Doanh thu ${formatMoney(x.revenue)}</div>
        </div>
      </div>`
            )
            .join('')
    }
    <p class="help-text" style="margin-top:14px">* Lợi nhuận gộp tính theo giá nhập tại thời điểm bán (giá nhập gần nhất của mặt hàng khi đó).</p>
  `;
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

  let items = allItems.filter((i) => !state.itemSearch || i.name.toLowerCase().includes(state.itemSearch.toLowerCase()));
  if (state.itemCategoryFilter !== 'all') {
    items = items.filter((i) => (i.category || 'Khác') === state.itemCategoryFilter);
  }

  app.innerHTML = `
    ${backToMoreLink()}
    <input type="text" class="searchbox" id="item-search" placeholder="🔍 Tìm mặt hàng..." value="${escapeHtml(state.itemSearch)}" />
    <div class="chip-row">${chips}</div>
    <div id="items-list"></div>
    <button class="fab" data-action="add-item">+</button>
  `;
  const listEl = document.getElementById('items-list');
  if (items.length === 0) {
    listEl.innerHTML = `<div class="empty-state">Chưa có mặt hàng nào phù hợp.<br/>Bấm nút + để thêm mặt hàng.</div>`;
  } else {
    const groups = {};
    items.forEach((i) => {
      const cat = i.category || 'Khác';
      groups[cat] = groups[cat] || [];
      groups[cat].push(i);
    });
    const sortedCats = Object.keys(groups).sort((a, b) => a.localeCompare(b, 'vi'));
    listEl.innerHTML = sortedCats
      .map(
        (cat) => `
      <div class="section-title">${categoryIcon(cat)} ${escapeHtml(cat)} (${groups[cat].length})</div>
      ${groups[cat]
        .map(
          (i) => `
        <div class="list-item">
          <div class="item-icon">${categoryIcon(i.category)}</div>
          <div class="li-main">
            <div class="li-title">${escapeHtml(i.name)}</div>
            <div class="li-sub">Nhập ${formatMoney(i.defaultCostPrice)} · Bán ${formatMoney(i.defaultSellPrice)}${i.barcode ? ' · #' + escapeHtml(i.barcode) : ''}</div>
          </div>
          <div class="li-actions">
            <button class="icon-btn" data-action="edit-item" data-id="${i.id}">✏️</button>
            <button class="icon-btn" data-action="delete-item" data-id="${i.id}">🗑️</button>
          </div>
        </div>`
        )
        .join('')}`
      )
      .join('');
  }
  document.getElementById('item-search').addEventListener('input', (e) => {
    state.itemSearch = e.target.value;
    renderItems(app);
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
function renderPurchases(app) {
  const rows = DB.getPurchases();
  app.innerHTML = `
    <div id="stock-list"></div>
    <button class="fab" data-action="add-purchase">+</button>
  `;
  const listEl = document.getElementById('stock-list');
  listEl.innerHTML =
    rows.length === 0
      ? `<div class="empty-state">Chưa có lần nhập hàng nào.<br/>Bấm nút + để nhập hàng.</div>`
      : rows
          .map((p) => {
            const item = DB.getItem(p.itemId);
            return `
        <div class="list-item">
          <div class="item-icon">${categoryIcon(item?.category)}</div>
          <div class="li-main">
            <div class="li-title">${escapeHtml(item ? item.name : '(Mặt hàng đã xoá)')} <span class="badge nhap">Nhập</span></div>
            <div class="li-sub">${formatDateVN(p.date)} · SL ${p.quantity} × ${formatMoney(p.costPrice)}${p.note ? ' · ' + escapeHtml(p.note) : ''}</div>
            ${p.imei ? `<div class="li-sub">🔢 IMEI: ${escapeHtml(p.imei)}</div>` : ''}
          </div>
          <div class="li-main" style="flex:0">
            <div class="li-amount">${formatMoney(p.costPrice * p.quantity)}</div>
          </div>
          <div class="li-actions">
            <button class="icon-btn" data-action="edit-purchase" data-id="${p.id}">✏️</button>
            <button class="icon-btn" data-action="delete-purchase" data-id="${p.id}">🗑️</button>
          </div>
        </div>`;
          })
          .join('');
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
  }
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

function submitPurchaseForm() {
  if (!formDraft.itemId) { toast('Vui lòng chọn mặt hàng', true); return; }
  syncImeiLinesFromDom();
  const imei = formDraft.imeiLines.map((s) => (s || '').trim()).filter(Boolean).join(', ');
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
  const rows = DB.getSales();
  app.innerHTML = `
    <div id="stock-list"></div>
    <button class="fab" data-action="add-sale">+</button>
  `;
  const listEl = document.getElementById('stock-list');
  listEl.innerHTML =
    rows.length === 0
      ? `<div class="empty-state">Chưa có lần bán hàng nào.<br/>Bấm nút + để bán hàng.</div>`
      : rows
          .map((s) => {
            const item = DB.getItem(s.itemId);
            return `
        <div class="list-item">
          <div class="item-icon">${categoryIcon(item?.category)}</div>
          <div class="li-main">
            <div class="li-title">${escapeHtml(item ? item.name : '(Mặt hàng đã xoá)')} <span class="badge ban">Bán</span></div>
            <div class="li-sub">${formatDateVN(s.date)} · SL ${s.quantity} × ${formatMoney(s.sellPrice)}</div>
            <div class="li-sub">👤 ${escapeHtml(s.customerName || 'Khách lẻ')}${s.customerPhone ? ' · ' + escapeHtml(s.customerPhone) : ''}${s.customerAddress ? ' · ' + escapeHtml(s.customerAddress) : ''}</div>
            ${s.imei ? `<div class="li-sub">🔢 IMEI: ${escapeHtml(s.imei)}</div>` : ''}
          </div>
          <div class="li-main" style="flex:0">
            <div class="li-amount">${formatMoney(s.sellPrice * s.quantity)}</div>
          </div>
          <div class="li-actions">
            <button class="icon-btn" data-action="edit-sale" data-id="${s.id}">✏️</button>
            <button class="icon-btn" data-action="delete-sale" data-id="${s.id}">🗑️</button>
          </div>
        </div>`;
          })
          .join('');
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
      <p class="help-text">Dùng để tra cứu bảo hành sau này theo từng máy đã bán.</p>
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
}

function submitSaleForm() {
  if (!formDraft.itemId) { toast('Vui lòng chọn mặt hàng', true); return; }
  const item = DB.getItem(formDraft.itemId);
  const costBasis = item ? (item.lastCostPrice ?? item.defaultCostPrice ?? 0) : 0;

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
    quantity: Number(document.getElementById('f-qty').value) || 1,
    sellPrice: parseMoneyInput(document.getElementById('f-sell-price').value),
    costPriceAtSale: costBasis,
    imei: document.getElementById('f-sale-imei').value.trim(),
    customerName,
    customerPhone,
    customerAddress,
    note: document.getElementById('f-note').value.trim(),
  };
  DB.saveSale(s);
  toast('Đã lưu lần bán hàng');
  closeSheet();
  render();
}

// ---------------------------------------------------------------------
// CUSTOMERS (Khách hàng)
// ---------------------------------------------------------------------
function renderCustomers(app) {
  const customers = DB.getCustomers().filter(
    (c) => !state.customerSearch || c.name.toLowerCase().includes(state.customerSearch.toLowerCase()) || (c.phone || '').includes(state.customerSearch)
  );
  app.innerHTML = `
    <input type="text" class="searchbox" id="customer-search" placeholder="🔍 Tìm khách hàng (tên/sđt)..." value="${escapeHtml(state.customerSearch)}" />
    <button class="btn btn-secondary" data-action="share-customers" style="margin-bottom:12px">📤 Chia sẻ danh sách qua Gmail...</button>
    <div id="customers-list"></div>
    <button class="fab" data-action="add-customer">+</button>
  `;
  const listEl = document.getElementById('customers-list');
  if (customers.length === 0) {
    listEl.innerHTML = `<div class="empty-state">Chưa có khách hàng nào.<br/>Bấm nút + để thêm khách hàng.</div>`;
  } else {
    const allSales = DB.getSales();
    listEl.innerHTML = customers
      .map((c) => {
        const sales = allSales.filter((s) => s.customerId === c.id);
        const totalSpent = sales.reduce((sum, s) => sum + s.sellPrice * s.quantity, 0);
        return `
      <div class="list-item">
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
  document.getElementById('customer-search').addEventListener('input', (e) => {
    state.customerSearch = e.target.value;
    renderCustomers(app);
  });
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
    <div class="list-item" data-action="go-tab" data-tab="items">
      <div class="li-main"><div class="li-title">📦 Mặt hàng</div><div class="li-sub">Quản lý danh mục sản phẩm</div></div>
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
        <div class="li-main" style="flex:0">
          <div class="li-amount ${t.type === 'thu' ? 'pos' : 'neg'}">${t.type === 'thu' ? '+' : '-'}${formatMoney(t.amount)}</div>
        </div>
        <div class="li-actions">
          <button class="icon-btn" data-action="edit-transaction" data-id="${t.id}">✏️</button>
          <button class="icon-btn" data-action="delete-transaction" data-id="${t.id}">🗑️</button>
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
function renderSettings(app) {
  const counts = {
    items: DB.getItems().length,
    purchases: DB.getPurchases().length,
    sales: DB.getSales().length,
    transactions: DB.getTransactions().length,
    customers: DB.getCustomers().length,
  };
  app.innerHTML = `
    ${backToMoreLink()}
    <div class="settings-item">
      <h3>📦 Dữ liệu hiện có</h3>
      <p>${counts.items} mặt hàng · ${counts.purchases} lần nhập · ${counts.sales} lần bán · ${counts.transactions} khoản thu/chi · ${counts.customers} khách hàng</p>
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
      if (!confirmDialog(`File backup có: ${summary}.\n\nPhục hồi sẽ THAY THẾ toàn bộ dữ liệu hiện tại. Tiếp tục?`)) return;
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
  if (!confirmDialog('Chắc chắn xoá TOÀN BỘ dữ liệu? Hành động này không thể hoàn tác (trừ khi bạn có file backup).')) return;
  if (!confirmDialog('Xác nhận lần cuối: xoá hết dữ liệu?')) return;
  DB.clearAll();
  toast('Đã xoá toàn bộ dữ liệu');
  render();
}

// ---------------------------------------------------------------------
// SERVICE WORKER (chạy offline)
// ---------------------------------------------------------------------
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch((err) => console.warn('SW lỗi:', err));
  }
}

document.addEventListener('DOMContentLoaded', init);
