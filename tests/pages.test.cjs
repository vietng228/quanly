const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const { webcrypto } = require('node:crypto');

function shop(role = 'admin') {
  const storage = new Map();
  const session = new Map();
  const localStorage = {
    getItem: key => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key),
  };
  const context = vm.createContext({
    window: {}, console, crypto: webcrypto, TextEncoder, TextDecoder, Uint8Array,
    btoa, atob, localStorage,
    sessionStorage: { getItem: key => session.get(key) || null, setItem: (key, value) => session.set(key, value) },
    state: { tab: 'sales' },
    document: { body: { classList: { add() {}, remove() {} } }, querySelectorAll: () => [] },
    toast() {}, setTimeout: () => 1, clearTimeout() {},
  });
  for (const file of ['js/db.js', 'js/cloud.js', 'js/access.js']) vm.runInContext(fs.readFileSync(file, 'utf8'), context);
  context.role = role;
  vm.runInContext(`
    DB.saveAccess({ users: [
      { id: 'admin', username: 'admin', role: 'admin', version: '1', disabled: false },
      { id: 'staff', username: 'staff', role: 'staff', version: '1', disabled: false },
    ] });
    DB.saveItem({ id: 'tv', name: 'Tivi', lastCostPrice: 100 });
    DB.savePurchase({ id: 'p1', itemId: 'tv', date: '2026-10-20', quantity: 5, costPrice: 100 });
    DB.saveSale({ id: 's1', itemId: 'tv', date: '2026-10-20', quantity: 1, sellPrice: 200 });
    DB.saveCustomer({ id: 'c1', name: 'Khách cũ' });
    Cloud.saveConfig({ owner: 'test', repo: 'private-data', branch: 'main', path: 'data/store.json', token: 'test-only' });
    Cloud._wrapDB();
    Access.wrapDB();
    Access.signIn(DB.getAccess().users.find(user => user.role === role));
    const originalPush = Cloud.push.bind(Cloud);
    Cloud.push = async () => ({ ok: true });
  `, context);
  return context;
}

test('GitHub Pages mở trực tiếp, không còn phụ thuộc API hoặc .env', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  const access = fs.readFileSync('js/access.js', 'utf8');
  const bundled = fs.readFileSync('QuanLyThuChi.html', 'utf8');
  assert.ok(html.includes('js/access.js'));
  assert.ok(!html.includes('js/api.js'));
  assert.ok(!access.includes("fetch('/api"));
  assert.ok(bundled.includes('const Access = {'));
  assert.ok(bundled.includes('id="f-cloud-token"'));
  assert.ok(!bundled.includes('ADMIN_PASSWORD'));
});

test('Nhân viên tạo khách hàng, phiếu nhập, đơn bán trong app', async () => {
  const context = shop('staff');
  assert.equal(await vm.runInContext(`Access.run(() => {
    DB.saveCustomer({ name: 'Khách mới' });
    DB.savePurchase({ itemId: 'tv', quantity: 2, date: '2026-10-20', costPrice: 150 });
    DB.saveSale({ itemId: 'tv', quantity: 1, date: '2026-10-20', sellPrice: 200 });
  })`, context), true);
  assert.equal(vm.runInContext('DB.getCustomers().length', context), 2);
  assert.equal(vm.runInContext('DB.getSales().length', context), 2);
  assert.equal(vm.runInContext('DB.getPurchases().length', context), 2);
});

test('Nhân viên bị chặn sửa/xóa chứng từ, danh mục, trả NCC và tài khoản', () => {
  const context = shop('staff');
  for (const action of [
    "DB.deleteSale('s1')", "DB.deleteItem('tv')", "DB.deletePurchase('p1')", "DB.deleteCustomer('c1')",
    "DB.saveSale({ id: 's1' })", "DB.savePurchase({ id: 'p1' })", "DB.saveCustomer({ id: 'c1' })",
    "DB.saveItem({ name: 'Mặt hàng mới' })", "DB.savePurchaseReturn({ itemId: 'tv' })",
    "DB.saveAccess({ users: [] })", 'DB.clearAll()', "DB.importAll({ data: {} })", "DB.saveShopInfo({ name: 'Khác' })",
  ]) assert.throws(() => vm.runInContext(action, context), /không có quyền/);
  assert.equal(vm.runInContext('DB.getSales().length', context), 1);
});

test('Admin lưu nguyên đơn một lần và chỉ báo thành công sau đồng bộ GitHub', async () => {
  const context = shop();
  await vm.runInContext(`(async () => {
    let calls = 0;
    let confirmed = false;
    Cloud.push = async () => {
      if (confirmed || DB.getSales().length !== 3) throw new Error('Đơn không được ghi nguyên khối');
      calls++; return { ok: true };
    };
    await Access.run(() => {
      DB.saveSale({ itemId: 'tv', date: '2026-10-20', quantity: 1 });
      DB.saveSale({ itemId: 'tv', date: '2026-10-20', quantity: 1 });
      Access.defer(() => { confirmed = true; });
    });
    if (calls !== 1 || !confirmed) throw new Error('Không đồng bộ đúng');
  })()`, context);
});

test('Trả NCC: thêm/sửa/xóa đều đẩy dữ liệu lên GitHub', async () => {
  const context = shop();
  await vm.runInContext(`(async () => {
    const sent = [];
    Cloud.push = async () => { sent.push(DB.getPurchaseReturns().map(row => row.quantity)); return { ok: true }; };
    let record;
    await Access.run(() => { record = DB.savePurchaseReturn({ itemId: 'tv', date: '2026-10-20', quantity: 1 }); });
    await Access.run(() => DB.savePurchaseReturn({ ...record, quantity: 2 }));
    await Access.run(() => DB.deletePurchaseReturn(record.id));
    if (JSON.stringify(sent) !== '[[1],[2],[]]') throw new Error('Thiếu cập nhật trả NCC');
  })()`, context);
});

test('Luồng ghi GitHub thật gửi trả NCC, tài khoản và SHA trong cùng file', async () => {
  const context = shop();
  await vm.runInContext(`(async () => {
    Cloud.push = originalPush;
    Cloud._lastSha = 'old-sha';
    let calls = 0;
    fetch = async (url, options) => {
      calls++;
      if (options.headers.Authorization !== 'Bearer test-only') throw new Error('Sai token');
      if (options.method === 'PUT') {
        const body = JSON.parse(options.body);
        const payload = JSON.parse(Cloud._b64DecodeUtf8(body.content));
        if (body.sha !== 'old-sha' || payload.data.purchaseReturns.length !== 1 || payload.access.users.length !== 2) throw new Error('Thiếu dữ liệu đồng bộ');
        return { ok: true, status: 200, json: async () => ({ content: { sha: 'new-sha' } }) };
      }
      return { ok: true, status: 200, json: async () => ({ sha: 'old-sha' }) };
    };
    const saved = await Access.run(() => DB.savePurchaseReturn({ itemId: 'tv', date: '2026-10-20', quantity: 1 }));
    if (!saved || calls !== 2 || Cloud._lastSha !== 'new-sha') throw new Error('Đồng bộ GitHub thất bại');
  })()`, context);
});

test('Lỗi đồng bộ không báo thành công và giữ dữ liệu đã có', async () => {
  const context = shop();
  await vm.runInContext(`(async () => {
    let confirmed = false;
    Cloud.push = async () => ({ ok: false, error: 'Mất mạng' });
    const result = await Access.run(() => { DB.deleteSale('s1'); Access.defer(() => { confirmed = true; }); });
    if (result || confirmed || DB.getSales().length !== 1 || Cloud._dirty) throw new Error('Rollback sai');
  })()`, context);
});

test('Tài khoản và thông tin cửa hàng đi cùng backup/đồng bộ', () => {
  const context = shop();
  vm.runInContext(`
    DB.saveShopInfo({ name: 'Cửa hàng' });
    const payload = DB.exportAll();
    if (payload.access.users.length !== 2 || payload.shopInfo.name !== 'Cửa hàng') throw new Error('Thiếu tài khoản/thông tin cửa hàng');
    Cloud._applying = true;
    DB.importAll(payload);
    Cloud._applying = false;
  `, context);
});

test('Mật khẩu băm có salt, dùng được trên thiết bị khác', async () => {
  const context = shop();
  await vm.runInContext(`(async () => {
    const first = await Access.credentials('password-for-test');
    const again = await Access.credentials('password-for-test', first.salt);
    const other = await Access.credentials('password-for-test');
    const wrong = await Access.credentials('wrong-password', first.salt);
    if (first.hash !== again.hash || first.hash === other.hash || first.hash === wrong.hash) throw new Error('Băm mật khẩu sai');
  })()`, context);
});

test('Khóa/đổi mật khẩu làm phiên nhân viên hết hiệu lực khi nhận dữ liệu mới', () => {
  const context = shop('staff');
  assert.equal(vm.runInContext('!!Access.user', context), true);
  vm.runInContext(`Cloud._applying = true; const access = DB.getAccess(); access.users[1].version = '2'; DB.saveAccess(access); Cloud._applying = false;`, context);
  assert.equal(vm.runInContext('Access.user', context), null);
});
