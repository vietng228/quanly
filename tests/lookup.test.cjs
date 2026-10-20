const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');

function lookup(date = '2026-10-20T12:00:00') {
  const fixed = new Date(date).getTime();
  class ClockDate extends Date {
    constructor(...args) { super(...(args.length ? args : [fixed])); }
    static now() { return fixed; }
  }
  const fixtures = {
    items: [{ id: 'tv', name: 'Tivi', productCode: 'TV01' }],
    customers: [{ id: 'kh', name: 'Khách A', phone: '0901234567' }],
    sales: [
      { id: 's-today', itemId: 'tv', customerId: 'kh', date: '2026-10-20', imei: 'SERIAL-1', quantity: 1, sellPrice: 200, costPriceAtSale: 100 },
      { id: 's-yesterday', itemId: 'tv', customerId: 'kh', date: '2026-10-19', imei: 'SERIAL-2', quantity: 2, sellPrice: 100, costPriceAtSale: 50 },
      { id: 's-old', itemId: 'tv', date: '2026-09-30', imei: 'SERIAL-3', quantity: 3, sellPrice: 50, costPriceAtSale: 20 },
    ],
    purchases: [
      { id: 'p-start', itemId: 'tv', date: '2026-10-12', imei: 'SERIAL-1', quantity: 1, costPrice: 10 },
      { id: 'p-end', itemId: 'tv', date: '2026-10-18', imei: 'SERIAL-2', quantity: 2, costPrice: 10 },
      { id: 'p-outside', itemId: 'tv', date: '2026-10-11', imei: 'SERIAL-3', quantity: 3, costPrice: 10 },
    ],
    returns: [{ id: 'r-old', itemId: 'tv', date: '2026-09-01', imei: 'RETURN-1' }],
    transactions: [
      { id: 't-yesterday', date: '2026-10-19', type: 'thu', amount: 40 },
      { id: 't-last-week', date: '2026-10-12', type: 'chi', amount: 7 },
      { id: 't-last-month', date: '2026-09-30', type: 'thu', amount: 90 },
    ],
  };
  const nodes = new Map();
  const context = vm.createContext({ Date: ClockDate, window: {}, document: {
    addEventListener() {},
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, { value: '', innerHTML: '', addEventListener() {} });
      return nodes.get(id);
    },
  },
    DB: {
      getItems: () => fixtures.items, getCustomers: () => fixtures.customers,
      getItem: id => fixtures.items.find(item => item.id === id),
      getSales: () => fixtures.sales, getPurchases: () => fixtures.purchases,
      getPurchaseReturns: () => fixtures.returns,
      getTransactions: () => fixtures.transactions,
    },
  });
  for (const file of ['js/utils.js', 'js/app.js']) vm.runInContext(fs.readFileSync(file, 'utf8'), context);
  return context;
}
const plain = value => JSON.parse(JSON.stringify(value));

test('Tra cứu có đủ hôm nay, hôm qua, tuần/tháng này, tuần/tháng trước, tất cả và tùy chỉnh', () => {
  const context = lookup();
  const expected = {
    day: ['2026-10-20', '2026-10-20'], yesterday: ['2026-10-19', '2026-10-19'],
    week: ['2026-10-19', '2026-10-20'], lastWeek: ['2026-10-12', '2026-10-18'],
    month: ['2026-10-01', '2026-10-20'], lastMonth: ['2026-09-01', '2026-09-30'],
    all: ['0000-01-01', '9999-12-31'],
  };
  for (const [period, dates] of Object.entries(expected)) {
    context.period = period;
    const range = vm.runInContext('getPeriodRange(period)', context);
    assert.deepEqual([range.start, range.end], dates);
  }
  const html = vm.runInContext("periodTabsHtml('lookup', 'set-lookup-period')", context);
  for (const period of [...Object.keys(expected), 'custom']) assert.ok(html.includes(`data-period="${period}"`));
});

test('Khoảng ngày đúng khi qua đầu tuần, đầu năm và tháng nhuận', () => {
  const cases = [
    ['2027-01-01T12:00:00', 'lastMonth', ['2026-12-01', '2026-12-31']],
    ['2027-01-01T12:00:00', 'lastWeek', ['2026-12-21', '2026-12-27']],
    ['2026-10-19T12:00:00', 'yesterday', ['2026-10-18', '2026-10-18']],
    ['2026-10-18T12:00:00', 'week', ['2026-10-12', '2026-10-18']],
    ['2028-03-01T12:00:00', 'lastMonth', ['2028-02-01', '2028-02-29']],
  ];
  for (const [date, period, expected] of cases) {
    const context = lookup(date);
    context.period = period;
    const range = vm.runInContext('getPeriodRange(period)', context);
    assert.deepEqual([range.start, range.end], expected);
  }
});

test('Lọc lịch sử kết hợp mã SP, IMEI, số điện thoại và khoảng ngày', () => {
  const context = lookup();
  for (const query of ['TV01', 'SERIAL', '0901234567']) {
    context.query = query;
    const result = vm.runInContext("state.lookupQuery = query; state.lookupPeriod = 'day'; getLookupResults()", context);
    assert.deepEqual(plain(result.sales.map(row => row.id)), ['s-today']);
    assert.equal(result.purchases.length, 0);
    assert.equal(result.returns.length, 0);
  }
});

test('Chọn khoảng ngày không cần từ khóa, bao gồm hai ngày biên và tự đổi thứ tự ngày tùy chỉnh', () => {
  const context = lookup();
  const previousWeek = vm.runInContext("state.lookupPeriod = 'lastWeek'; getLookupResults()", context);
  assert.deepEqual(plain(previousWeek.purchases.map(row => row.id)), ['p-start', 'p-end']);
  const custom = vm.runInContext(`
    state.lookupPeriod = 'custom'; state.lookupCustomStart = '2026-10-20'; state.lookupCustomEnd = '2026-10-19';
    getLookupResults();`, context);
  assert.deepEqual(plain(custom.sales.map(row => row.id)), ['s-today', 's-yesterday']);
});

test('Tất cả màn hình có đủ hôm qua, tuần trước, tháng trước và tùy chỉnh', () => {
  const context = lookup();
  for (const renderer of ['renderDashboard', 'renderSales', 'renderPurchases', 'renderPurchaseReturns', 'renderCashflow', 'renderLookup']) {
    const html = vm.runInContext(`(() => { const app = { innerHTML: '' }; ${renderer}(app); return app.innerHTML; })()`, context);
    for (const period of ['day', 'yesterday', 'week', 'lastWeek', 'month', 'lastMonth', 'all', 'custom']) {
      assert.ok(html.includes(`data-period="${period}"`), `${renderer} thiếu ${period}`);
    }
  }
});

test('Tổng quan tính đúng doanh thu, tiền nhập và thu chi của các kỳ trước', () => {
  const context = lookup();
  const expected = {
    yesterday: { revenue: 200, purchaseSpend: 0, netProfit: 140 },
    lastWeek: { revenue: 0, purchaseSpend: 30, netProfit: -7 },
    lastMonth: { revenue: 150, purchaseSpend: 0, netProfit: 180 },
  };
  for (const [period, values] of Object.entries(expected)) {
    context.period = period;
    const stats = vm.runInContext('computeStats(period)', context);
    for (const [key, value] of Object.entries(values)) assert.equal(stats[key], value, `${period}: ${key}`);
  }
});

test('Thu chi chọn kỳ trước và tùy chỉnh lọc đúng ngày chứng từ', () => {
  const context = lookup();
  for (const [period, expected] of [['yesterday', ['t-yesterday']], ['lastWeek', ['t-last-week']], ['lastMonth', ['t-last-month']]]) {
    context.period = period;
    const ids = vm.runInContext("state.cashPeriod = period; filterRowsByPeriodState(DB.getTransactions(), 'cash').map(row => row.id)", context);
    assert.deepEqual(plain(ids), expected);
  }
  const ids = vm.runInContext(`state.cashPeriod = 'custom'; state.cashCustomStart = '2026-10-19'; state.cashCustomEnd = '2026-10-12';
    filterRowsByPeriodState(DB.getTransactions(), 'cash').map(row => row.id)`, context);
  assert.deepEqual(plain(ids), ['t-yesterday', 't-last-week']);
});


test('Nhập hàng và trả NCC lưu tên nhà cung cấp, mở sửa và dữ liệu cũ vẫn dùng được', () => {
  const context = lookup();
  vm.runInContext(`
    let html = '';
    openSheet = value => { html = value; };
    closeSheet = () => {};
    render = () => {};
    toast = () => {};
    confirmDialog = () => true;
    renderImeiLines = () => {};
    renderReturnImeiSuggestions = () => {};
    syncImeiLinesFromDom = () => {};
    DB.savePurchase = row => { savedPurchase = row; };
    DB.savePurchaseReturn = row => { savedReturn = row; };
    document.getElementById('f-date').value = '2026-10-20';
    document.getElementById('f-qty').value = '1';
    document.getElementById('f-cost-price').value = '10';
    document.getElementById('f-note').value = '';
    for (const type of ['purchase', 'return']) {
      const open = type === 'purchase' ? openPurchaseForm : openPurchaseReturnForm;
      const submit = type === 'purchase' ? submitPurchaseForm : submitPurchaseReturnForm;
      open(null);
      if (!html.includes('id="f-supplier-name" value=""')) throw new Error('Form mới thiếu NCC');
      formDraft.itemId = 'tv'; formDraft.imeiLines = [];
      document.getElementById('f-supplier-name').value = '  Công ty A & B  ';
      submit();
      const row = type === 'purchase' ? savedPurchase : savedReturn;
      if (row.supplierName !== 'Công ty A & B') throw new Error('Chưa lưu tên NCC');
      open({ ...row, id: 'existing' });
      if (!html.includes('Công ty A &amp; B')) throw new Error('Mở sửa sai tên NCC');
      open({ id: 'legacy', itemId: 'tv', quantity: 1 });
      if (!html.includes('id="f-supplier-name" value=""')) throw new Error('Lỗi phiếu cũ');
    }
  `, context);
});
