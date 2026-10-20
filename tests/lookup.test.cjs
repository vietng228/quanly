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
      { id: 's-today', itemId: 'tv', customerId: 'kh', date: '2026-10-20', imei: 'SERIAL-1' },
      { id: 's-yesterday', itemId: 'tv', customerId: 'kh', date: '2026-10-19', imei: 'SERIAL-2' },
      { id: 's-old', itemId: 'tv', date: '2026-09-30', imei: 'SERIAL-3' },
    ],
    purchases: [
      { id: 'p-start', itemId: 'tv', date: '2026-10-12', imei: 'SERIAL-1' },
      { id: 'p-end', itemId: 'tv', date: '2026-10-18', imei: 'SERIAL-2' },
      { id: 'p-outside', itemId: 'tv', date: '2026-10-11', imei: 'SERIAL-3' },
    ],
    returns: [{ id: 'r-old', itemId: 'tv', date: '2026-09-01', imei: 'RETURN-1' }],
  };
  const context = vm.createContext({ Date: ClockDate, window: {}, document: { addEventListener() {} },
    DB: {
      getItems: () => fixtures.items, getCustomers: () => fixtures.customers,
      getSales: () => fixtures.sales, getPurchases: () => fixtures.purchases,
      getPurchaseReturns: () => fixtures.returns,
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
