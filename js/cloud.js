/* cloud.js — đồng bộ dữ liệu nhiều thiết bị qua 1 file JSON trong GitHub
   private repo (dùng GitHub Contents API). Mục tiêu: nhiều nhân viên cùng
   dùng chung 1 bộ dữ liệu (mặt hàng, nhập/bán hàng, khách hàng, thu chi).

   Cách hoạt động:
   - Mỗi thiết bị lưu cấu hình kết nối (owner/repo/branch/path/token) riêng
     trong localStorage của máy đó (KHÔNG đồng bộ chính cấu hình này).
   - Khi mở app: tự tải bản dữ liệu mới nhất từ GitHub xuống, ghi đè dữ liệu
     local (yêu cầu phải có mạng — đã thống nhất với người dùng).
   - Mọi thao tác sửa dữ liệu (thêm/sửa/xoá mặt hàng, nhập hàng, bán hàng,
     khách hàng, thu chi...) được "gắn móc" (monkeypatch) vào các hàm ghi
     của DB, tự gộp nhiều thay đổi liên tiếp và đẩy lên GitHub 1 lần
     (debounce ~900ms) — tránh tạo hàng loạt commit nhỏ khi nhập Excel.
   - Trước mỗi lần đẩy lên, app kiểm tra xem dữ liệu trên GitHub có bị
     người khác cập nhật sau lần đồng bộ gần nhất của mình không (so sánh
     "sha" của file). Nếu có tranh chấp: KHÔNG ghi đè — cảnh báo và tải lại
     trang để lấy bản mới nhất, tránh mất dữ liệu của người khác.
*/

const CLOUD_CFG_KEY = 'qls_cloud_cfg';
const CLOUD_STATE_KEY = 'qls_cloud_state';

const Cloud = {
  _flushTimer: null,
  _flushing: false,
  _dirty: false,
  _applying: false,
  _lastSha: null,
  _status: 'idle', // idle | pulling | pushing | conflict | error
  _lastError: '',
  _lastSyncedAt: null,
  _statusListeners: [],

  getConfig() {
    try {
      const raw = localStorage.getItem(CLOUD_CFG_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },
  saveConfig(cfg) {
    localStorage.setItem(CLOUD_CFG_KEY, JSON.stringify(cfg));
  },
  clearConfig() {
    localStorage.removeItem(CLOUD_CFG_KEY);
    localStorage.removeItem(CLOUD_STATE_KEY);
    this._lastSha = null;
    this._dirty = false;
  },
  isConfigured() {
    const c = this.getConfig();
    return !!(c && c.owner && c.repo && c.path && c.token);
  },

  onStatusChange(fn) {
    this._statusListeners.push(fn);
  },
  _setStatus(status, err) {
    this._status = status;
    this._lastError = err || '';
    this._statusListeners.forEach((fn) => {
      try {
        fn(status, err);
      } catch (e) {
        /* bỏ qua lỗi listener */
      }
    });
  },

  _apiUrl(cfg) {
    const path = (cfg.path || '').replace(/^\/+/, '');
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
    return `https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/contents/${encodedPath}`;
  },
  _headers(cfg) {
    return {
      Authorization: `Bearer ${cfg.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  },

  // GitHub trả nội dung file dạng base64 của các byte UTF-8 — atob() thường
  // không giải mã đúng ký tự có dấu tiếng Việt nếu không xử lý qua
  // TextDecoder, nên phải làm đúng bước này để không bị lỗi font khi đồng bộ.
  _b64DecodeUtf8(b64) {
    const binary = atob((b64 || '').replace(/\n/g, ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  },
  _b64EncodeUtf8(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  },

  async _describeError(res) {
    let detail = '';
    try {
      const j = await res.json();
      detail = j.message || '';
    } catch (e) {
      /* không đọc được body lỗi */
    }
    if (res.status === 401) return 'Token không hợp lệ hoặc đã hết hạn.';
    if (res.status === 403) return 'Không đủ quyền truy cập repo, hoặc đã vượt giới hạn API GitHub. ' + detail;
    if (res.status === 404) return 'Không tìm thấy repo hoặc đường dẫn file — kiểm tra lại Owner/Repo/Đường dẫn.';
    return `Lỗi GitHub (${res.status}): ${detail}`;
  },

  // Tải dữ liệu mới nhất từ GitHub, ghi đè dữ liệu local.
  async pullLatest() {
    const cfg = this.getConfig();
    if (!cfg) return { ok: false, error: 'Chưa cấu hình đồng bộ' };
    this._setStatus('pulling');
    try {
      const res = await fetch(`${this._apiUrl(cfg)}?ref=${encodeURIComponent(cfg.branch || 'main')}`, {
        headers: this._headers(cfg),
        cache: 'no-store',
      });
      if (res.status === 404) {
        this._setStatus('idle');
        return { ok: false, notFound: true };
      }
      if (!res.ok) {
        const msg = await this._describeError(res);
        this._setStatus('error', msg);
        return { ok: false, error: msg };
      }
      const json = await res.json();
      const text = this._b64DecodeUtf8(json.content);
      const payload = JSON.parse(text);

      this._applying = true;
      DB.importAll(payload, 'replace');
      this._applying = false;

      this._lastSha = json.sha;
      localStorage.setItem(CLOUD_STATE_KEY, JSON.stringify({ sha: json.sha, syncedAt: Date.now() }));
      this._lastSyncedAt = Date.now();
      this._dirty = false;
      this._setStatus('idle');
      return { ok: true };
    } catch (err) {
      this._applying = false;
      this._setStatus('error', 'Không kết nối được GitHub: ' + err.message);
      return { ok: false, error: err.message };
    }
  },

  // Đẩy toàn bộ dữ liệu hiện tại lên GitHub. Có kiểm tra tranh chấp trước.
  async push(message) {
    const cfg = this.getConfig();
    if (!cfg) return { ok: false, error: 'Chưa cấu hình đồng bộ' };
    this._setStatus('pushing');
    try {
      const checkRes = await fetch(`${this._apiUrl(cfg)}?ref=${encodeURIComponent(cfg.branch || 'main')}`, {
        headers: this._headers(cfg),
        cache: 'no-store',
      });
      let remoteSha = null;
      if (checkRes.status === 200) {
        const j = await checkRes.json();
        remoteSha = j.sha;
      } else if (checkRes.status !== 404) {
        const msg = await this._describeError(checkRes);
        this._setStatus('error', msg);
        return { ok: false, error: msg };
      }

      if (this._lastSha && remoteSha && remoteSha !== this._lastSha) {
        this._setStatus('conflict');
        return { ok: false, conflict: true };
      }

      const payload = DB.exportAll();
      const content = this._b64EncodeUtf8(JSON.stringify(payload, null, 2));
      const body = {
        message: message || 'Cập nhật dữ liệu từ app',
        content,
        branch: cfg.branch || 'main',
      };
      if (remoteSha) body.sha = remoteSha;

      const res = await fetch(this._apiUrl(cfg), {
        method: 'PUT',
        headers: { ...this._headers(cfg), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 409) {
        this._setStatus('conflict');
        return { ok: false, conflict: true };
      }
      if (!res.ok) {
        const msg = await this._describeError(res);
        this._setStatus('error', msg);
        return { ok: false, error: msg };
      }
      const json = await res.json();
      this._lastSha = json.content.sha;
      localStorage.setItem(CLOUD_STATE_KEY, JSON.stringify({ sha: json.content.sha, syncedAt: Date.now() }));
      this._lastSyncedAt = Date.now();
      this._dirty = false;
      this._setStatus('idle');
      return { ok: true };
    } catch (err) {
      this._setStatus('error', 'Không kết nối được GitHub: ' + err.message);
      return { ok: false, error: err.message };
    }
  },

  // Đánh dấu có thay đổi cần đồng bộ & lên lịch đẩy lên GitHub — gộp nhiều
  // thay đổi liên tiếp (VD: nhập Excel hàng trăm dòng) thành 1 lần đẩy duy
  // nhất thay vì tạo hàng trăm commit riêng lẻ.
  scheduleFlush() {
    if (!this.isConfigured()) return;
    if (this._applying) return; // đang nạp dữ liệu TỪ cloud xuống, không phải người dùng sửa
    this._dirty = true;
    if (this._flushTimer) clearTimeout(this._flushTimer);
    this._flushTimer = setTimeout(() => this._flush(), 900);
  },

  async _flush() {
    this._flushTimer = null;
    if (!this._dirty || this._flushing) return;
    this._flushing = true;
    const result = await this.push('Cập nhật dữ liệu từ app');
    this._flushing = false;
    if (result.conflict) {
      this._handleConflict();
    } else if (!result.ok && result.error) {
      if (typeof toast === 'function') toast('⚠️ Đồng bộ GitHub lỗi: ' + result.error, true);
    }
  },

  _handleConflict() {
    alert(
      '⚠️ Dữ liệu vừa được người khác cập nhật trên GitHub trong lúc bạn đang thao tác.\n\n' +
        'Để tránh mất dữ liệu, trang sẽ tải lại để lấy bản mới nhất. Vui lòng thực hiện lại thao tác vừa rồi sau khi trang tải xong.'
    );
    location.reload();
  },

  // Gắn (monkeypatch) vào các hàm ghi của DB để tự động lên lịch đồng bộ
  // mỗi khi dữ liệu local thay đổi — không cần sửa từng chỗ gọi DB trong app.js.
  _wrapDB() {
    const mutators = [
      'saveItem',
      'deleteItem',
      'savePurchase',
      'deletePurchase',
      'saveSale',
      'deleteSale',
      'saveCustomer',
      'deleteCustomer',
      'saveTransaction',
      'deleteTransaction',
      'saveShopInfo',
      'importAll',
      'clearAll',
    ];
    mutators.forEach((name) => {
      const orig = DB[name];
      if (typeof orig !== 'function') return;
      DB[name] = (...args) => {
        const result = orig.apply(DB, args);
        Cloud.scheduleFlush();
        return result;
      };
    });
  },

  async init() {
    this._wrapDB();
    const raw = localStorage.getItem(CLOUD_STATE_KEY);
    if (raw) {
      try {
        this._lastSha = JSON.parse(raw).sha;
      } catch (e) {
        /* bỏ qua state hỏng */
      }
    }
    if (!this.isConfigured()) return { ok: true, skipped: true };
    return this.pullLatest();
  },
};

window.Cloud = Cloud;
