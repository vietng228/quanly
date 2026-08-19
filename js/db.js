/* db.js — lớp lưu trữ dữ liệu bằng localStorage, thuần JS, không cần mạng */

const DB_PREFIX = 'qls_'; // quản lý shop
const DB_KEYS = {
  items: DB_PREFIX + 'items',
  purchases: DB_PREFIX + 'purchases',
  sales: DB_PREFIX + 'sales',
  transactions: DB_PREFIX + 'transactions',
  customers: DB_PREFIX + 'customers',
  meta: DB_PREFIX + 'meta',
};

function uid() {
  return Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
}

function readList(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Lỗi đọc dữ liệu', key, e);
    return [];
  }
}

function writeList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

const DB = {
  // ---------- ITEMS (Mặt hàng) ----------
  getItems() {
    return readList(DB_KEYS.items).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  },
  getItem(id) {
    return readList(DB_KEYS.items).find((i) => i.id === id) || null;
  },
  getItemByBarcode(barcode) {
    if (!barcode) return null;
    return readList(DB_KEYS.items).find((i) => i.barcode === barcode) || null;
  },
  saveItem(item) {
    const list = readList(DB_KEYS.items);
    if (item.id) {
      const idx = list.findIndex((i) => i.id === item.id);
      if (idx >= 0) list[idx] = item;
      else list.push(item);
    } else {
      item.id = uid();
      item.createdAt = Date.now();
      list.push(item);
    }
    writeList(DB_KEYS.items, list);
    return item;
  },
  deleteItem(id) {
    const list = readList(DB_KEYS.items).filter((i) => i.id !== id);
    writeList(DB_KEYS.items, list);
  },

  // ---------- PURCHASES (Nhập hàng) ----------
  getPurchases() {
    return readList(DB_KEYS.purchases).sort((a, b) => b.date.localeCompare(a.date));
  },
  savePurchase(p) {
    const list = readList(DB_KEYS.purchases);
    if (p.id) {
      const idx = list.findIndex((x) => x.id === p.id);
      if (idx >= 0) list[idx] = p;
      else list.push(p);
    } else {
      p.id = uid();
      p.createdAt = Date.now();
      list.push(p);
    }
    writeList(DB_KEYS.purchases, list);
    // cập nhật giá nhập gần nhất & mặc định cho item
    const item = DB.getItem(p.itemId);
    if (item) {
      item.lastCostPrice = p.costPrice;
      DB.saveItem(item);
    }
    return p;
  },
  deletePurchase(id) {
    writeList(DB_KEYS.purchases, readList(DB_KEYS.purchases).filter((x) => x.id !== id));
  },

  // ---------- SALES (Bán hàng) ----------
  getSales() {
    return readList(DB_KEYS.sales).sort((a, b) => b.date.localeCompare(a.date));
  },
  saveSale(s) {
    const list = readList(DB_KEYS.sales);
    if (s.id) {
      const idx = list.findIndex((x) => x.id === s.id);
      if (idx >= 0) list[idx] = s;
      else list.push(s);
    } else {
      s.id = uid();
      s.createdAt = Date.now();
      list.push(s);
    }
    writeList(DB_KEYS.sales, list);
    return s;
  },
  deleteSale(id) {
    writeList(DB_KEYS.sales, readList(DB_KEYS.sales).filter((x) => x.id !== id));
  },

  // ---------- CUSTOMERS (Khách hàng) ----------
  getCustomers() {
    return readList(DB_KEYS.customers).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  },
  getCustomer(id) {
    return readList(DB_KEYS.customers).find((c) => c.id === id) || null;
  },
  saveCustomer(c) {
    const list = readList(DB_KEYS.customers);
    if (c.id) {
      const idx = list.findIndex((x) => x.id === c.id);
      if (idx >= 0) list[idx] = c;
      else list.push(c);
    } else {
      c.id = uid();
      c.createdAt = Date.now();
      list.push(c);
    }
    writeList(DB_KEYS.customers, list);
    return c;
  },
  deleteCustomer(id) {
    writeList(DB_KEYS.customers, readList(DB_KEYS.customers).filter((x) => x.id !== id));
  },

  // ---------- TRANSACTIONS (Thu chi độc lập) ----------
  getTransactions() {
    return readList(DB_KEYS.transactions).sort((a, b) => b.date.localeCompare(a.date));
  },
  saveTransaction(t) {
    const list = readList(DB_KEYS.transactions);
    if (t.id) {
      const idx = list.findIndex((x) => x.id === t.id);
      if (idx >= 0) list[idx] = t;
      else list.push(t);
    } else {
      t.id = uid();
      t.createdAt = Date.now();
      list.push(t);
    }
    writeList(DB_KEYS.transactions, list);
    return t;
  },
  deleteTransaction(id) {
    writeList(DB_KEYS.transactions, readList(DB_KEYS.transactions).filter((x) => x.id !== id));
  },

  // ---------- BACKUP / RESTORE ----------
  exportAll() {
    return {
      app: 'quan-ly-thu-chi-ban-hang',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        items: readList(DB_KEYS.items),
        purchases: readList(DB_KEYS.purchases),
        sales: readList(DB_KEYS.sales),
        transactions: readList(DB_KEYS.transactions),
        customers: readList(DB_KEYS.customers),
      },
    };
  },
  importAll(payload, mode = 'replace') {
    if (!payload || !payload.data) throw new Error('File backup không hợp lệ');
    const { items = [], purchases = [], sales = [], transactions = [], customers = [] } = payload.data;
    if (mode === 'replace') {
      writeList(DB_KEYS.items, items);
      writeList(DB_KEYS.purchases, purchases);
      writeList(DB_KEYS.sales, sales);
      writeList(DB_KEYS.transactions, transactions);
      writeList(DB_KEYS.customers, customers);
    } else {
      // merge: giữ dữ liệu cũ, thêm dữ liệu mới (theo id, không trùng)
      const mergeIn = (key, incoming) => {
        const cur = readList(key);
        const ids = new Set(cur.map((x) => x.id));
        incoming.forEach((x) => {
          if (!ids.has(x.id)) cur.push(x);
        });
        writeList(key, cur);
      };
      mergeIn(DB_KEYS.items, items);
      mergeIn(DB_KEYS.purchases, purchases);
      mergeIn(DB_KEYS.sales, sales);
      mergeIn(DB_KEYS.transactions, transactions);
      mergeIn(DB_KEYS.customers, customers);
    }
  },
  clearAll() {
    writeList(DB_KEYS.items, []);
    writeList(DB_KEYS.purchases, []);
    writeList(DB_KEYS.sales, []);
    writeList(DB_KEYS.transactions, []);
    writeList(DB_KEYS.customers, []);
  },

  // ---------- THÔNG TIN CỬA HÀNG (hiện trên hoá đơn in) ----------
  getShopInfo() {
    try {
      const raw = localStorage.getItem(DB_KEYS.meta);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  },
  saveShopInfo(info) {
    localStorage.setItem(DB_KEYS.meta, JSON.stringify(info || {}));
  },
};

window.DB = DB;
window.uid = uid;
