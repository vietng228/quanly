const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');

function clockShop() {
  const clock = { value: new Date(2026, 9, 26, 10, 17).getTime() };
  class ClockDate extends Date {
    constructor(...args) { super(...(args.length ? args : [clock.value])); }
    static now() { return clock.value; }
  }
  const storage = new Map();
  const context = vm.createContext({ Date: ClockDate, window: {}, document: { addEventListener() {} },
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) } });
  for (const file of ['js/utils.js', 'js/db.js', 'js/app.js']) vm.runInContext(fs.readFileSync(file, 'utf8'), context);
  return { context, clock };
}

test('Phiếu mới tự ghi giờ tại lúc lưu, sửa giữ nguyên giờ và thời điểm tạo', () => {
  for (const suffix of ['Purchase', 'PurchaseReturn', 'Sale', 'Transaction']) {
    const { context, clock } = clockShop();
    context.suffix = suffix;
    vm.runInContext("const first = DB['save' + suffix]({date: '2026-10-26', itemId: 'x'});", context);
    assert.equal(vm.runInContext('first.time', context), '10:17');
    const created = vm.runInContext('first.createdAt', context);
    clock.value = new Date(2026, 9, 26, 11, 42).getTime();
    vm.runInContext("const edited = DB['save' + suffix]({id: first.id, date: first.date, itemId: 'x'});", context);
    assert.equal(vm.runInContext('edited.time', context), '10:17');
    assert.equal(vm.runInContext('edited.createdAt', context), created);
    assert.equal(vm.runInContext('edited.updatedAt', context), clock.value);
    vm.runInContext("const chosen = DB['save' + suffix]({...edited, time: '09:05'});", context);
    assert.equal(vm.runInContext('formatRecordDateTime(chosen)', context), '26/10/2026 · 09:05');
  }
});

test('Dữ liệu cũ và lịch sử nhập Excel thiếu giờ không bị tự gán giờ giả', () => {
  const { context } = clockShop();
  vm.runInContext("localStorage.setItem('qls_purchases', JSON.stringify([{id:'old', date:'2020-01-01', createdAt:1}])); const old = DB.savePurchase({id:'old', date:'2020-01-01'}); const imported = DB.saveSale({date:'2020-01-01', time:''});", context);
  assert.equal(vm.runInContext('recordTimeLabel(old)', context), 'Chưa có giờ');
  assert.equal(vm.runInContext('recordTimeLabel(imported)', context), 'Chưa có giờ');
});

test('Mọi bộ lọc mặc định Hôm nay; giờ 23:59 vẫn thuộc đúng ngày chứng từ', () => {
  const { context } = clockShop();
  for (const key of ['period', 'cashPeriod', 'lookupPeriod', 'purchasePeriod', 'salePeriod', 'purchaseReturnPeriod']) {
    assert.equal(vm.runInContext('state.' + key, context), 'day');
  }
  const rows = vm.runInContext("filterRowsByPeriodState([{date:'2026-10-26',time:'23:59'},{date:'2026-10-25',time:'23:59'}], 'sale')", context);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].date, '2026-10-26');
});

test('Danh sách xếp giờ mới trước, không sửa dữ liệu gốc; định dạng chỉ đến phút', () => {
  const { context } = clockShop();
  vm.runInContext("const rows = [{date:'2026-10-26', time:'09:00'},{date:'2026-10-26', time:'15:30'}]; const groups = groupRowsByDate(rows);", context);
  assert.equal(vm.runInContext('groups[0].rows[0].time', context), '15:30');
  assert.equal(vm.runInContext('rows[0].time', context), '09:00');
  assert.equal(vm.runInContext('formatTimestampMinute(Date.now())', context), '26/10/2026 10:17');
});

test('Tạo và sửa mặt hàng/khách hàng giữ thời điểm tạo và ghi nhận lần cập nhật', () => {
  for (const suffix of ['Item', 'Customer']) {
    const { context, clock } = clockShop();
    context.suffix = suffix;
    vm.runInContext("const first = DB['save' + suffix]({name:'Mẫu'});", context);
    const created = clock.value;
    clock.value += 120000;
    vm.runInContext("const edited = DB['save' + suffix]({id:first.id,name:'Đã sửa'});", context);
    assert.equal(vm.runInContext('edited.createdAt', context), created);
    assert.equal(vm.runInContext('edited.updatedAt', context), clock.value);
  }
});

test('Hóa đơn đơn/gộp có giờ bán và giờ xuất/in riêng; in lại không đổi phiếu', () => {
  const { context, clock } = clockShop();
  vm.runInContext(`
    let printed = '';
    Access = { defer: () => false };
    toast = () => {};
    setTimeout = () => {};
    window.open = () => ({document: {write(html) {printed = html;}, close() {}}});
    DB.saveItem({id:'tv',name:'Tivi'});
    const sale = DB.saveSale({itemId:'tv',date:'2026-10-26',time:'09:05',quantity:1,sellPrice:100});
    printInvoice(sale);
  `, context);
  assert.ok(vm.runInContext("printed.includes('09:05') && printed.includes('Xuất/in hóa đơn: 26/10/2026 10:17')", context));
  clock.value = new Date(2026, 9, 26, 11, 42).getTime();
  vm.runInContext('printInvoice(sale);', context);
  assert.ok(vm.runInContext("printed.includes('09:05') && printed.includes('Xuất/in hóa đơn: 26/10/2026 11:42')", context));
  assert.equal(vm.runInContext('DB.getSales()[0].time', context), '09:05');
  vm.runInContext('printOrderInvoice([sale, {...sale, id:"second"}]);', context);
  assert.ok(vm.runInContext("printed.includes('09:05') && printed.includes('Xuất/in hóa đơn: 26/10/2026 11:42')", context));
});
