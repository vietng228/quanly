/* Appearance and keyboard behavior; no store data or permissions are changed. */
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-transparency: reduce)');
  const preference = localStorage.getItem('qls_reduce_transparency');
  root.classList.toggle('reduce-transparency', preference === 'true' || reduced.matches);

  document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.topbar');
    let lastScroll = Math.max(0, window.scrollY);
    let scrollTravel = 0;
    let scrollDirection = 0;
    let scrollPending = false;
    const showHeader = () => {
      header.classList.remove('is-scroll-hidden');
      scrollTravel = 0;
    };
    window.addEventListener('scroll', () => {
      if (scrollPending) return;
      scrollPending = true;
      requestAnimationFrame(() => {
        scrollPending = false;
        const position = Math.max(0, window.scrollY);
        const delta = position - lastScroll;
        lastScroll = position;
        if (position < 90 || document.body.classList.contains('dialog-open') || header.contains(document.activeElement)) {
          showHeader();
          return;
        }
        const direction = Math.sign(delta);
        if (!direction) return;
        if (direction !== scrollDirection) scrollTravel = 0;
        scrollDirection = direction;
        scrollTravel += Math.abs(delta);
        if (scrollTravel > 12) header.classList.toggle('is-scroll-hidden', direction > 0);
      });
    }, { passive: true });
    header.addEventListener('focusin', showHeader);
    window.addEventListener('hashchange', showHeader);

    const toggle = document.getElementById('appearance-toggle');
    const updateToggle = () => toggle.setAttribute('aria-pressed', String(root.classList.contains('reduce-transparency')));
    updateToggle();
    toggle.addEventListener('click', () => {
      root.classList.toggle('reduce-transparency');
      localStorage.setItem('qls_reduce_transparency', String(root.classList.contains('reduce-transparency')));
      updateToggle();
    });
    reduced.addEventListener('change', () => {
      if (localStorage.getItem('qls_reduce_transparency') === null) {
        root.classList.toggle('reduce-transparency', reduced.matches);
        updateToggle();
      }
    });
    document.getElementById('sheet-close').addEventListener('click', closeSheet);

    const nav = document.getElementById('bottomnav');
    const updateNav = () => {
      for (const link of nav.querySelectorAll('.nav-btn')) {
        if (link.classList.contains('active')) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      }
    };
    new MutationObserver(updateNav).observe(nav, { attributes: true, attributeFilter: ['class'], subtree: true });
    updateNav();

    const icons = {
      edit: '<path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15Z"/>',
      delete: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
      print: '<path d="M7 8V3h10v5M7 17H4V9h16v8h-3M7 14h10v7H7Z"/>',
      scan: '<path d="M4 8V4h4m8 0h4v4M4 16v4h4m8 0h4v-4M8 8v8m4-8v8m4-8v8"/>',
      debt: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18m-6 5h3"/>',
    };
    const enhanceControls = () => {
      for (const el of document.querySelectorAll('.icon-btn, .fab, [data-action]')) {
        if (el.matches('[data-action]') && !el.matches('button, a, input, select, textarea, [role]')) {
          el.setAttribute('role', 'button');
          el.tabIndex = 0;
        }
        if (!el.matches('.icon-btn, .fab') || el.dataset.appearanceReady) continue;
        el.dataset.appearanceReady = 'true';
        const action = el.dataset.action || el.id;
        const kind = action.startsWith('edit-') ? 'edit' : action.startsWith('delete-') ? 'delete' : action.includes('print') ? 'print' : action.includes('scan') && !action.endsWith('-close') ? 'scan' : action === 'collect-debt' ? 'debt' : null;
        const label = kind && ({ edit: 'Sửa', delete: 'Xóa', print: 'In hóa đơn', scan: 'Quét mã', debt: 'Thu nợ' })[kind];
        if (label && !el.hasAttribute('aria-label')) el.setAttribute('aria-label', label);
        if (el.matches('.fab') && !el.hasAttribute('aria-label')) el.setAttribute('aria-label', 'Thêm mới');
        if (kind) el.innerHTML = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${icons[kind]}</svg>`;
      }
    };
    const controlObserver = new MutationObserver(enhanceControls);
    for (const id of ['app', 'sheet-content', 'picker-list', 'cust-picker-list']) controlObserver.observe(document.getElementById(id), { childList: true, subtree: true });
    enhanceControls();
    document.addEventListener('keydown', event => {
      if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[role="button"][data-action]')) {
        event.preventDefault();
        event.target.click();
      }
    });

    const overlays = [...document.querySelectorAll('.sheet-overlay, .modal-overlay')];
    const previousFocus = new Map();
    let active = null;
    const focusables = panel => [...panel.querySelectorAll('a[href], button, input, select, textarea, [tabindex="0"]')]
      .filter(el => !el.disabled && !el.hidden && el.getClientRects().length);
    const updateDialogs = () => {
      const next = overlays.filter(panel => panel.classList.contains('open')).at(-1) || null;
      if (next === active) return;
      if (next && !previousFocus.has(next)) previousFocus.set(next, document.activeElement);
      const closed = active;
      active = next;
      for (const panel of overlays) {
        panel.setAttribute('aria-hidden', String(!panel.classList.contains('open')));
        panel.inert = panel.classList.contains('open') && panel !== next;
      }
      for (const el of [document.getElementById('app'), document.querySelector('.topbar'), nav]) el.inert = !!next;
      document.body.classList.toggle('dialog-open', !!next);
      if (closed && !closed.classList.contains('open')) {
        const previous = previousFocus.get(closed);
        previousFocus.delete(closed);
        if (!next && previous?.isConnected) previous.focus({ preventScroll: true });
      }
      if (next) {
        // Focus the close control without opening a mobile keyboard automatically.
        const target = focusables(next)[0];
        target?.focus({ preventScroll: true });
      }
    };
    for (const panel of overlays) {
      const dialog = panel.querySelector('.sheet, .modal-full');
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-label', ({ 'sheet-overlay': 'Chi tiết và biểu mẫu', 'picker-modal': 'Chọn mặt hàng', 'customer-picker-modal': 'Chọn khách hàng', 'scanner-modal': 'Quét mã' })[panel.id]);
      panel.setAttribute('aria-hidden', 'true');
      new MutationObserver(updateDialogs).observe(panel, { attributes: true, attributeFilter: ['class'] });
    }
    document.addEventListener('keydown', event => {
      if (!active) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        const close = active.querySelector('#sheet-close, #picker-close, #cust-picker-close, #scanner-close');
        close?.click();
      }
      if (event.key === 'Tab') {
        const controls = focusables(active);
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    });
  });
})();
