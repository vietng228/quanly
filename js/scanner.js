/* scanner.js — bọc thư viện html5-qrcode thành 1 modal quét mã vạch/QR dùng lại được */

const Scanner = {
  _html5Qr: null,
  _onResult: null,
  _continuous: false,
  _lastCode: null,
  _lastTime: 0,
  _count: 0,

  // opts.continuous = true: không tự đóng camera sau khi quét được 1 mã —
  // dùng để quét liên tiếp nhiều IMEI/số seri liền nhau (VD khi nhập hàng
  // nhiều máy 1 lúc) mà không phải mở lại camera cho từng máy. Người dùng
  // tự bấm "Xong" hoặc ✕ khi quét xong.
  open(onResult, opts) {
    opts = opts || {};
    this._onResult = onResult;
    this._continuous = !!opts.continuous;
    this._lastCode = null;
    this._lastTime = 0;
    this._count = 0;

    const modal = document.getElementById('scanner-modal');
    modal.classList.add('open');
    const readerEl = document.getElementById('scanner-reader');
    readerEl.innerHTML = '';

    const doneBtn = document.getElementById('scanner-done');
    const hintEl = document.getElementById('scanner-hint');
    const countEl = document.getElementById('scanner-count');
    if (doneBtn) {
      doneBtn.style.display = this._continuous ? '' : 'none';
      doneBtn.onclick = () => this.close();
    }
    if (hintEl) {
      hintEl.textContent = this._continuous
        ? 'Quét liên tiếp — mỗi máy 1 mã, quét xong máy này camera tự sẵn sàng quét máy tiếp theo. Số lượng sẽ tự cập nhật theo số IMEI đã quét. Bấm "Xong" khi quét hết.'
        : 'Đưa mã vạch/QR vào giữa khung, cách camera khoảng 10–15cm, giữ yên và đủ sáng.';
    }
    if (countEl) {
      countEl.style.display = this._continuous ? '' : 'none';
      countEl.textContent = this._continuous ? 'Đã quét: 0 máy' : '';
    }

    this._html5Qr = new Html5Qrcode('scanner-reader', {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.CODABAR,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.QR_CODE,
      ],
      // Dùng BarcodeDetector gốc của trình duyệt (Chrome Android) nếu có —
      // nhận diện nhanh & chính xác hơn nhiều so với thư viện JS thuần.
      experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      verbose: false,
    });

    // Khung quét co giãn theo kích thước khung hình camera thực tế (tránh lỗi
    // không nhận diện được gì khi khung quét cấu hình cứng lớn hơn video).
    const config = {
      fps: 15,
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const size = Math.floor(minEdge * 0.7);
        return { width: size, height: size };
      },
    };

    this._html5Qr
      .start({ facingMode: 'environment' }, config, (decodedText) => {
        if (!this._continuous) {
          this.close();
          if (typeof this._onResult === 'function') this._onResult(decodedText);
          return;
        }
        // Chế độ quét liên tiếp: camera vẫn tiếp tục chạy sau mỗi lần quét
        // được. Chặn trùng lặp khi cùng 1 mã vẫn còn nằm trong khung hình
        // (html5-qrcode sẽ báo lại nhiều lần/giây cho tới khi mã đó bị đưa
        // ra khỏi khung) — chỉ chấp nhận lại đúng mã đó sau ít nhất 2 giây.
        const now = Date.now();
        if (decodedText === this._lastCode && now - this._lastTime < 2000) return;
        this._lastCode = decodedText;
        this._lastTime = now;
        this._count += 1;
        if (countEl) countEl.textContent = `Đã quét: ${this._count} máy`;
        if (typeof this._onResult === 'function') this._onResult(decodedText);
      })
      .catch((err) => {
        document.getElementById('scanner-error').textContent =
          'Không mở được camera. Hãy cấp quyền camera cho trình duyệt. (' + err + ')';
      });
  },

  close() {
    const modal = document.getElementById('scanner-modal');
    modal.classList.remove('open');
    document.getElementById('scanner-error').textContent = '';
    const doneBtn = document.getElementById('scanner-done');
    const countEl = document.getElementById('scanner-count');
    if (doneBtn) doneBtn.style.display = 'none';
    if (countEl) countEl.style.display = 'none';
    this._continuous = false;
    if (this._html5Qr) {
      this._html5Qr
        .stop()
        .then(() => this._html5Qr.clear())
        .catch(() => {});
      this._html5Qr = null;
    }
  },
};
