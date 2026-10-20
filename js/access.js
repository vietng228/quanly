/* Phân quyền trong app dành cho GitHub Pages; đồng bộ trực tiếp repo private. */
const Access = {
  session: null,
  settingUp: false,
  running: false,
  dirty: false,
  effects: [],
  get user() {
    if (!this.session || (this.session.expires !== null && this.session.expires < Date.now())) return null;
    return DB.getAccess().users.find(user => user.id === this.session.id && user.version === this.session.version && !user.disabled) || null;
  },
  isAdmin() { return this.settingUp || this.user?.role === 'admin'; },
  permissionGroups: { sale: 'Bán hàng', purchase: 'Nhập hàng', item: 'Mặt hàng', customer: 'Khách hàng', 'purchase-return': 'Trả NCC', transaction: 'Thu chi' },
  defaultPermissions: ['sale.create', 'purchase.create', 'customer.create'],
  permissionsFor(user) { return Array.isArray(user.permissions) ? user.permissions : this.defaultPermissions; },
  can(permission) { return this.isAdmin() || !!this.user && this.permissionsFor(this.user).includes(permission); },
  async credentials(password, salt) {
    const bytes = salt ? Uint8Array.from(salt.match(/../g), part => parseInt(part, 16)) : crypto.getRandomValues(new Uint8Array(16));
    const hex = value => Array.from(new Uint8Array(value), byte => byte.toString(16).padStart(2, '0')).join('');
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: bytes, iterations: 210000, hash: 'SHA-256' }, key, 256);
    return { salt: hex(bytes), hash: hex(bits) };
  },
  validate(username, password) {
    if (!/^[\w.-]{3,40}$/.test(username)) throw new Error('Tên đăng nhập gồm 3–40 chữ, số, dấu . _ -');
    if (password.length < 8 || password.length > 128) throw new Error('Mật khẩu cần 8–128 ký tự.');
  },
  signIn(user, remember = true) {
    this.clearSession();
    this.session = { id: user.id, version: user.version, expires: remember ? null : Date.now() + 8 * 3600000 };
    (remember ? localStorage : sessionStorage).setItem('qls_session', JSON.stringify(this.session));
  },
  clearSession() {
    this.session = null;
    sessionStorage.removeItem('qls_session');
    localStorage.removeItem('qls_session');
  },
  restoreSession() {
    try { this.session = JSON.parse(sessionStorage.getItem('qls_session') || localStorage.getItem('qls_session')); }
    catch { this.session = null; }
    if (!this.user) this.clearSession();
  },
  wrapDB() {
    const entities = {
      Item: ['item', 'getItems'], Purchase: ['purchase', 'getPurchases'], PurchaseReturn: ['purchase-return', 'getPurchaseReturns'],
      Sale: ['sale', 'getSales'], Customer: ['customer', 'getCustomers'], Transaction: ['transaction', 'getTransactions'],
    };
    for (const name of ['saveItem', 'deleteItem', 'savePurchase', 'deletePurchase', 'savePurchaseReturn', 'deletePurchaseReturn',
      'saveSale', 'deleteSale', 'saveCustomer', 'deleteCustomer', 'saveTransaction', 'deleteTransaction', 'saveShopInfo', 'saveAccess', 'importAll', 'clearAll']) {
      const original = DB[name];
      DB[name] = (...args) => {
        if (!Cloud._applying) {
          if (!this.isAdmin()) {
            const match = /^(save|delete)(.+)$/.exec(name);
            const entity = match && entities[match[2]];
            const operation = match?.[1] === 'delete' ? 'delete' : entity && DB[entity[1]]().some(row => row.id === args[0]?.id) ? 'edit' : 'create';
            if (!entity || !this.can(entity[0] + '.' + operation)) throw new Error('Bạn không có quyền sửa/xóa dữ liệu này.');
          }
          this.dirty = true;
        }
        return original.apply(DB, args);
      };
    }
  },
  async run(action) {
    if (this.running || Cloud._flushing) { toast('Đang đồng bộ, vui lòng chờ.'); return false; }
    const snapshot = DB.exportAll();
    this.running = true;
    this.dirty = false;
    this.effects = [];
    let effects = [];
    let success = false;
    document.body.classList.add('access-busy');
    try {
      await action();
      if (this.dirty && Cloud.isConfigured()) {
        Cloud._dirty = true;
        const result = await Cloud.push('Cập nhật dữ liệu từ app');
        if (!result.ok) throw Object.assign(new Error(result.error || 'Dữ liệu vừa thay đổi trên máy khác. Vui lòng thử lại.'), { conflict: result.conflict });
      }
      effects = this.effects;
      success = true;
    } catch (error) {
      Cloud._applying = true;
      try { DB.importAll(snapshot, 'replace'); } finally { Cloud._applying = false; }
      Cloud._dirty = false;
      this.running = false;
      if (error.conflict) await Cloud.pullLatest();
      Cloud._setStatus('error', error.message);
      toast('Chưa xác nhận lưu: ' + error.message, true);
    } finally {
      this.running = false;
      this.dirty = false;
      this.effects = [];
      document.body.classList.remove('access-busy');
    }
    if (success) {
      try { for (const effect of effects) effect(); this.decorate(); }
      catch { toast('Đã lưu dữ liệu. Vui lòng tải lại giao diện.', true); }
    }
    return success;
  },
  dispatch(action, callback) {
    if (/^(delete-|submit-|save-shop-info|remove-shop-qr|do-clear-all|do-merge-duplicates|do-recompute-sale-costs|merge-item)/.test(action)) return this.run(callback);
    if (!this.running) return callback();
  },
  defer(effect) {
    if (!this.running) return false;
    this.effects.push(effect);
    return true;
  },
  async connection(message = '') {
    document.getElementById('bottomnav').hidden = true;
    document.getElementById('topbar-title').textContent = 'Kết nối dữ liệu cửa hàng';
    document.getElementById('app').innerHTML = `<div class="settings-item"><h3>Đồng bộ GitHub</h3>
      <p>Nhập repo private và token như ở app cũ. Cấu hình một lần trên mỗi điện thoại.</p>
      <p id="connect-error" role="alert">${escapeHtml(message)}</p>
      <form id="connect-form">
        <div class="form-group"><label>Chủ repo (owner)</label><input name="owner" required value="${escapeHtml(Cloud.getConfig()?.owner || '')}" placeholder="vietng228"></div>
        <div class="form-group"><label>Repo dữ liệu private</label><input name="repo" required value="${escapeHtml(Cloud.getConfig()?.repo || '')}"></div>
        <div class="form-group"><label>Nhánh</label><input name="branch" required value="${escapeHtml(Cloud.getConfig()?.branch || 'main')}"></div>
        <div class="form-group"><label>Đường dẫn file dữ liệu</label><input name="path" required value="${escapeHtml(Cloud.getConfig()?.path || 'data/store-data.json')}"></div>
        <div class="form-group"><label>Token GitHub</label><input name="token" type="password" required autocomplete="off"></div>
        <button class="btn btn-primary" type="submit">Kết nối</button>
      </form></div>`;
    await new Promise(resolve => document.getElementById('connect-form').addEventListener('submit', async event => {
      event.preventDefault();
      const button = event.currentTarget.querySelector('button');
      button.disabled = true;
      const cfg = Object.fromEntries(new FormData(event.currentTarget));
      for (const key of Object.keys(cfg)) cfg[key] = cfg[key].trim();
      Cloud.saveConfig(cfg);
      const result = await Cloud.pullLatest();
      if (result.ok || result.notFound) resolve();
      else { document.getElementById('connect-error').textContent = result.error; button.disabled = false; }
    }));
  },
  async start() {
    document.getElementById('bottomnav').hidden = true;
    if (!Cloud.isConfigured()) await this.connection();
    const result = await Cloud.init();
    if (!result.ok && !result.notFound) await this.connection(result.error);
    this.wrapDB();
    this.restoreSession();
    if (!this.user) await this.loginForm();
    document.getElementById('bottomnav').hidden = false;
    if (!this.isAdmin()) state.tab = 'sales';
    const observer = new MutationObserver(() => this.decorate());
    for (const id of ['app', 'sheet-content']) observer.observe(document.getElementById(id), { childList: true, subtree: true });
    setInterval(async () => {
      if (document.hidden || this.running || Cloud._dirty || state.tab === 'settings' || document.querySelector('.sheet-overlay.open, .modal-overlay.open') || document.activeElement?.matches('input, textarea, select')) return;
      const result = await Cloud.pullLatest();
      if (result.ok) {
        if (!this.user) { this.clearSession(); location.reload(); }
        else render();
      }
    }, 60000);
    window.addEventListener('beforeunload', event => {
      if (this.running || Cloud._dirty) { event.preventDefault(); event.returnValue = ''; }
    });
  },
  async loginForm() {
    const setup = DB.getAccess().users.length === 0;
    document.getElementById('topbar-title').textContent = setup ? 'Tạo admin lần đầu' : 'Đăng nhập cửa hàng';
    document.getElementById('app').innerHTML = `<form id="shop-login" class="settings-item">
      <h3>${setup ? 'Tạo tài khoản admin' : 'Đăng nhập'}</h3>
      <p>${setup ? 'Chưa có tài khoản. Chủ cửa hàng tạo admin một lần tại đây.' : 'Dùng tài khoản do admin cấp.'}</p>
      <div class="form-group"><label>Tên đăng nhập</label><input name="username" required minlength="3" maxlength="40" autocomplete="username" value="${setup ? 'admin' : ''}"></div>
      <div class="form-group"><label>Mật khẩu${setup ? ' (ít nhất 8 ký tự)' : ''}</label><input name="password" type="password" required maxlength="128" autocomplete="${setup ? 'new-password' : 'current-password'}"></div>
      ${setup ? '<div class="form-group"><label>Nhập lại mật khẩu</label><input name="confirm" type="password" required autocomplete="new-password"></div>' : ''}
      <label><input name="remember" type="checkbox" checked> Ghi nhớ đăng nhập trên thiết bị này</label>
      <p id="login-error" role="alert"></p><button class="btn btn-primary" type="submit">${setup ? 'Tạo admin' : 'Đăng nhập'}</button>
    </form>`;
    await new Promise(resolve => document.getElementById('shop-login').addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const button = form.querySelector('button');
      button.disabled = true;
      try {
        const input = Object.fromEntries(new FormData(form));
        let user;
        if (setup) {
          this.validate(input.username, input.password);
          if (input.password !== input.confirm) throw new Error('Hai mật khẩu chưa giống nhau.');
          if (DB.getAccess().users.length) throw new Error('Đã có admin. Vui lòng tải lại để đăng nhập.');
          user = { id: uid(), username: input.username, role: 'admin', disabled: false, version: uid(), credentials: await this.credentials(input.password) };
          this.settingUp = true;
          const saved = await this.run(() => DB.saveAccess({ users: [user] }));
          this.settingUp = false;
          if (!saved) throw new Error('Chưa tạo được admin trên GitHub. Kiểm tra kết nối rồi thử lại.');
        } else {
          user = DB.getAccess().users.find(user => user.username === input.username && !user.disabled);
          const computed = await this.credentials(input.password, user?.credentials.salt);
          if (!user || computed.hash !== user.credentials.hash) throw new Error('Tên đăng nhập hoặc mật khẩu chưa đúng.');
        }
        this.signIn(user, input.remember === 'on');
        form.reset();
        resolve();
      } catch (error) { document.getElementById('login-error').textContent = error.message; }
      finally { this.settingUp = false; button.disabled = false; }
    }));
  },
  canTab(tab) {
    if (this.isAdmin()) return true;
    if (tab === 'dashboard') return this.can('reports.view');
    const group = { purchaseReturns: 'purchase-return', cashflow: 'transaction' }[tab];
    if (group) return ['create', 'edit', 'delete'].some(op => this.can(group + '.' + op));
    return !!this.user && ['sales', 'purchases', 'customers', 'more', 'items', 'inventory', 'lookup'].includes(tab);
  },
  canAction(action, element) {
    if (this.isAdmin()) return true;
    const entityAction = /^(add|edit|delete)-(item|purchase-return|purchase|sale|customer|transaction)$/.exec(action);
    if (entityAction) return this.can(entityAction[2] + '.' + ({ add: 'create', edit: 'edit', delete: 'delete' }[entityAction[1]]));
    const submit = /^submit-(item|purchase-return|purchase|sale|customer|transaction)-form$/.exec(action);
    if (submit) return this.can(submit[1] + '.create') || this.can(submit[1] + '.edit');
    if (action === 'submit-new-sale-order') return this.can('sale.create');
    if (['collect-debt', 'submit-collect-debt'].includes(action)) return this.can('sale.edit');
    if (/^(delete-|edit-|merge-|do-|trigger-import|trigger-restore|download-import|save-shop|remove-shop|trigger-shop|cloud-)/.test(action)) return false;
    if (action === 'share-customers') return false;
    return action !== 'go-tab' || this.canTab(element.dataset.tab);
  },
  decorate() {
    if (!this.user) return;
    for (const el of document.querySelectorAll('[data-action]')) el.hidden = !this.canAction(el.dataset.action, el);
    for (const el of document.querySelectorAll('.nav-btn')) el.hidden = !this.canTab(el.dataset.tab);
    if (state.tab === 'more' && !document.getElementById('account-panel')) {
      const panel = document.createElement('div');
      panel.id = 'account-panel'; panel.className = 'settings-item';
      panel.innerHTML = `<p>${escapeHtml(this.user.username)} · ${this.isAdmin() ? 'Admin' : 'Nhân viên'}</p>
        ${this.isAdmin() ? '<button class="btn btn-secondary" id="manage-users">Quản lý tài khoản</button>' : ''}
        <button class="btn btn-secondary" id="shop-logout">Đăng xuất</button>`;
      document.getElementById('app').prepend(panel);
      panel.querySelector('#manage-users')?.addEventListener('click', () => this.usersForm());
      panel.querySelector('#shop-logout').addEventListener('click', () => {
        if (this.running || Cloud._dirty) { toast('Vui lòng chờ đồng bộ xong.'); return; }
        this.clearSession(); location.reload();
      });
    }
  },
  usersForm() {
    if (!this.isAdmin()) return;
    const users = DB.getAccess().users;
    openSheet(`<div class="sheet-title">Quản lý tài khoản</div>
      <p>Chọn Phân quyền để cấp quyền riêng cho từng nhân viên. Cài đặt hệ thống và quản lý tài khoản chỉ dành cho admin.</p>
      ${users.map(user => `<div class="settings-item"><b>${escapeHtml(user.username)}</b> · ${user.role === 'admin' ? 'Admin' : 'Nhân viên'} · ${user.disabled ? 'Đã khóa' : 'Hoạt động'}
        <div class="btn-row">${user.role === 'staff' ? `<button type="button" data-user-id="${user.id}" data-user-op="permissions">Phân quyền</button>` : ''}<button type="button" data-user-id="${user.id}" data-user-op="password">Đổi mật khẩu</button>
        <button type="button" data-user-id="${user.id}" data-user-op="toggle">${user.disabled ? 'Mở khóa' : 'Khóa'}</button></div></div>`).join('')}
      <form id="create-user"><h3>Thêm nhân viên</h3>
        <div class="form-group"><label>Tên đăng nhập</label><input name="username" required minlength="3" maxlength="40" autocomplete="off"></div>
        <div class="form-group"><label>Mật khẩu (ít nhất 8 ký tự)</label><input name="password" type="password" required minlength="8" maxlength="128" autocomplete="new-password"></div>
        <button class="btn btn-primary" type="submit">Tạo nhân viên</button></form>
      <button data-action="close-sheet">Đóng</button>`);
    document.getElementById('create-user').addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const input = Object.fromEntries(new FormData(form));
      await this.run(async () => {
        this.validate(input.username, input.password);
        const access = DB.getAccess();
        if (access.users.some(user => user.username.toLowerCase() === input.username.toLowerCase())) throw new Error('Tên đăng nhập đã có.');
        access.users.push({ id: uid(), username: input.username, role: 'staff', permissions: [...this.defaultPermissions], disabled: false, version: uid(), credentials: await this.credentials(input.password) });
        DB.saveAccess(access);
        this.defer(() => this.usersForm());
      });
    });
    document.querySelectorAll('[data-user-op]').forEach(button => button.addEventListener('click', async () => {
      if (button.dataset.userOp === 'permissions') { this.permissionsForm(button.dataset.userId); return; }
      if (button.dataset.userOp === 'password') { this.passwordForm(button.dataset.userId); return; }
      if (!confirmDialog('Thay đổi trạng thái tài khoản này?')) return;
      await this.run(() => {
        const access = DB.getAccess();
        const target = access.users.find(user => user.id === button.dataset.userId);
        target.disabled = !target.disabled;
        if (!access.users.some(user => user.role === 'admin' && !user.disabled)) throw new Error('Phải giữ một admin hoạt động.');
        target.version = uid();
        DB.saveAccess(access);
        this.defer(() => this.usersForm());
      });
    }));
  },
  savePermissions(id, permissions) {
    if (!this.isAdmin()) throw new Error('Chỉ admin được phân quyền.');
    const access = DB.getAccess();
    const target = access.users.find(user => user.id === id && user.role === 'staff');
    if (!target) throw new Error('Không tìm thấy nhân viên.');
    const allowed = Object.keys(this.permissionGroups).flatMap(group => ['create', 'edit', 'delete'].map(op => group + '.' + op)).concat('reports.view');
    target.permissions = allowed.filter(permission => permissions.includes(permission));
    DB.saveAccess(access);
  },
  permissionsForm(id) {
    if (!this.isAdmin()) return;
    const target = DB.getAccess().users.find(user => user.id === id && user.role === 'staff');
    if (!target) return;
    const selected = this.permissionsFor(target);
    const checkbox = (permission, label) => `<label style="display:block;margin:10px 0"><input type="checkbox" name="permission" value="${permission}" ${selected.includes(permission) ? 'checked' : ''}> ${label}</label>`;
    openSheet(`<div class="sheet-title">Phân quyền: ${escapeHtml(target.username)}</div>
      <form id="staff-permissions"><p>Bỏ chọn để thu hồi quyền. Nhân viên vẫn được xem danh mục và lịch sử như hiện tại.</p>
      ${Object.entries(this.permissionGroups).map(([group, label]) => `<fieldset class="settings-item"><legend>${label}</legend>
        ${['create', 'edit', 'delete'].map((op, i) => checkbox(group + '.' + op, ['Thêm mới', 'Sửa', 'Xóa'][i])).join('')}</fieldset>`).join('')}
      ${checkbox('reports.view', 'Xem báo cáo Tổng quan')}
      <p>Quyền sửa hóa đơn bán hàng bao gồm thu nợ. Quyền mới áp dụng trên máy nhân viên khi đồng bộ dữ liệu.</p>
      <button class="btn btn-primary" type="submit">Lưu quyền</button></form>
      <button type="button" id="back-to-users">Quay lại</button>`);
    document.getElementById('back-to-users').addEventListener('click', () => this.usersForm());
    document.getElementById('staff-permissions').addEventListener('submit', async event => {
      event.preventDefault();
      const permissions = new FormData(event.currentTarget).getAll('permission');
      await this.run(() => {
        this.savePermissions(id, permissions);
        this.defer(() => { toast('Đã lưu quyền nhân viên'); this.usersForm(); });
      });
    });
  },
  passwordForm(id) {
    if (!this.isAdmin()) return;
    openSheet(`<div class="sheet-title">Đổi mật khẩu</div><form id="change-password">
      <div class="form-group"><label>Mật khẩu mới (ít nhất 8 ký tự)</label><input name="password" type="password" required minlength="8" maxlength="128" autocomplete="new-password"></div>
      <button class="btn btn-primary" type="submit">Lưu mật khẩu</button></form><button data-action="close-sheet">Đóng</button>`);
    document.getElementById('change-password').addEventListener('submit', async event => {
      event.preventDefault();
      const password = new FormData(event.currentTarget).get('password');
      await this.run(async () => {
        const access = DB.getAccess();
        const target = access.users.find(user => user.id === id);
        this.validate(target.username, password);
        target.credentials = await this.credentials(password);
        target.version = uid();
        DB.saveAccess(access);
        this.defer(() => { if (!this.user) { this.clearSession(); location.reload(); } else this.usersForm(); });
      });
    });
  },
};
window.Access = Access;
