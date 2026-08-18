/* scanner.js — bọc thư viện html5-qrcode thành 1 modal quét mã vạch/QR dùng lại được */

const Scanner = {
  _html5Qr: null,
  _onResult: null,

  open(onResult) {
    this._onResult = onResult;
    const modal = document.getElementById('scanner-modal');
    modal.classList.add('open');
    const readerEl = document.getElementById('scanner-reader');
    readerEl.innerHTML = '';

    this._html5Qr = new Html5Qrcode('scanner-reader', {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.QR_CODE,
      ],
      verbose: false,
    });

    const config = { fps: 10, qrbox: { width: 260, height: 160 } };

    this._html5Qr
      .start({ facingMode: 'environment' }, config, (decodedText) => {
        this.close();
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
    if (this._html5Qr) {
      this._html5Qr
        .stop()
        .then(() => this._html5Qr.clear())
        .catch(() => {});
      this._html5Qr = null;
    }
  },
};
