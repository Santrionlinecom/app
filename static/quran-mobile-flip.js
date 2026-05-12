(function () {
  const mobileQuery = window.matchMedia('(max-width: 767px)');
  const pagePath = '/kitab/quran';
  const initializedBooks = new WeakSet();
  const styleId = 'quran-mobile-flip-style';

  const isQuranPage = () => location.pathname === pagePath;
  const isQuranMobile = () => isQuranPage() && mobileQuery.matches;

  const ensureStyle = () => {
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .quran-top-search-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.45rem;
        white-space: nowrap;
      }

      .quran-top-search-btn svg {
        width: 1rem;
        height: 1rem;
      }

      .quran-top-search-btn.is-open {
        border-color: #059669 !important;
        background: #ecfdf5 !important;
        color: #047857 !important;
      }

      .quran-search-overlay-backdrop {
        display: none;
      }

      .quran-search-panel.is-highlighted {
        border-color: #10b981 !important;
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
      }

      @media (max-width: 767px) {
        .quran-top-search-btn {
          width: 2.25rem;
          min-width: 2.25rem;
          height: 2.25rem;
          min-height: 2.25rem;
          padding: 0 !important;
          border-color: rgba(15, 118, 110, 0.3) !important;
          border-radius: 0.75rem !important;
          background: #ffffff !important;
          color: #0f766e !important;
        }

        .quran-top-search-btn span {
          display: none;
        }

        body.quran-search-open .quran-search-overlay-backdrop {
          position: fixed;
          inset: 0;
          z-index: 80;
          display: block;
          background: rgba(2, 6, 23, 0.42);
          backdrop-filter: blur(3px);
        }

        body.quran-search-open .quran-search-panel {
          position: fixed !important;
          inset:
            max(4.75rem, calc(env(safe-area-inset-top) + 4.25rem))
            0.75rem auto 0.75rem;
          z-index: 90;
          display: flex !important;
          max-height: min(30rem, calc(100dvh - 6rem));
          overflow: auto;
          border-color: rgba(16, 185, 129, 0.28) !important;
          border-radius: 1rem !important;
          box-shadow: 0 24px 60px rgba(2, 6, 23, 0.32);
        }

        .mushaf-book.quran-js-flip-ready {
          position: relative !important;
          overflow: hidden !important;
          perspective: 1600px;
        }

        .mushaf-book.quran-js-flip-ready > .mushaf-page {
          position: absolute !important;
          inset: 0;
          display: block !important;
          width: 100% !important;
          height: 100% !important;
          opacity: 0;
          transform: rotateY(0deg);
          transform-style: preserve-3d;
          transition:
            transform 680ms cubic-bezier(0.2, 0.78, 0.2, 1),
            opacity 420ms ease;
          backface-visibility: hidden;
          will-change: transform, opacity;
        }

        .mushaf-book.quran-js-flip-ready > .mushaf-page[hidden] {
          display: none !important;
        }

        .mushaf-book.quran-js-flip-ready > .mushaf-page.is-active,
        .mushaf-book.quran-js-flip-ready > .mushaf-page.is-entering {
          opacity: 1;
        }

        .mushaf-book.quran-js-flip-ready > .mushaf-page.is-active {
          z-index: 2;
        }

        .mushaf-book.quran-js-flip-ready > .mushaf-page.is-entering {
          z-index: 1;
          transform: rotateY(0deg);
        }

        .mushaf-book.quran-js-flip-ready > .mushaf-page.is-leaving {
          z-index: 3;
          opacity: 0.16;
        }

        .mushaf-book.quran-js-flip-ready > .mushaf-page.is-leaving.flip-next {
          transform: rotateY(96deg);
          transform-origin: right center;
        }

        .mushaf-book.quran-js-flip-ready > .mushaf-page.is-leaving.flip-prev {
          transform: rotateY(-96deg);
          transform-origin: left center;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const syncSearchButton = (button) => {
    const open = document.body.classList.contains('quran-search-open');
    button.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', String(open));
  };

  const focusSearchPanel = (panel) => {
    const input = panel.querySelector('input');
    if (!mobileQuery.matches) {
      panel.classList.add('is-highlighted');
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.setTimeout(() => panel.classList.remove('is-highlighted'), 1300);
    }
    window.setTimeout(() => input?.focus({ preventScroll: true }), 80);
  };

  const ensureSearchControls = () => {
    if (!isQuranPage()) return;
    ensureStyle();

    const panel = document.querySelector('.quran-search-panel');
    const grid = document.querySelector('.quran-reader-grid');
    const controls = grid?.parentElement?.firstElementChild?.firstElementChild;
    const join = controls?.querySelector('.join');

    if (!panel || !controls || !join || document.querySelector('.quran-top-search-btn')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-outline quran-top-search-btn';
    button.setAttribute('aria-controls', 'quran-search-panel');
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML =
      '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg><span>Cari</span>';

    panel.id = panel.id || 'quran-search-panel';

    button.addEventListener('click', () => {
      if (mobileQuery.matches) {
        document.body.classList.toggle('quran-search-open');
        syncSearchButton(button);
        if (document.body.classList.contains('quran-search-open')) {
          focusSearchPanel(panel);
        }
        return;
      }

      focusSearchPanel(panel);
    });

    join.insertAdjacentElement('afterend', button);
    syncSearchButton(button);

    if (!document.querySelector('.quran-search-overlay-backdrop')) {
      const backdrop = document.createElement('button');
      backdrop.type = 'button';
      backdrop.className = 'quran-search-overlay-backdrop';
      backdrop.setAttribute('aria-label', 'Tutup pencarian');
      backdrop.addEventListener('click', () => {
        document.body.classList.remove('quran-search-open');
        syncSearchButton(button);
      });
      document.body.appendChild(backdrop);
    }
  };

  const pageNumber = (page) => {
    const footer = page.querySelector('.mushaf-footer');
    const header = page.querySelector('.mushaf-header span:last-child');
    return (footer?.textContent || header?.textContent || '').replace(/\D+/g, '') || '-';
  };

  const updateProgress = (toolbar, page, index, total) => {
    const progress = toolbar?.querySelector('div:first-child');
    if (!progress) return;
    progress.textContent = `Lembar ${index + 1} dari ${total} - Halaman ${pageNumber(page)}`;
  };

  const setupBook = (book) => {
    if (!isQuranMobile() || initializedBooks.has(book) || book.querySelector('.stf__parent')) return;

    const pages = Array.from(book.querySelectorAll(':scope > .mushaf-page'));
    if (pages.length < 2) return;

    ensureStyle();

    const toolbar = document.querySelector('.mushaf-toolbar');
    const buttons = Array.from(toolbar?.querySelectorAll('button') || []);
    let current = 0;
    let animating = false;
    let startX = 0;
    let startY = 0;

    initializedBooks.add(book);
    book.classList.add('quran-js-flip-ready');

    const render = () => {
      pages.forEach((page, index) => {
        const active = index === current;
        page.hidden = !active;
        page.classList.toggle('is-active', active);
        page.classList.remove('is-entering', 'is-leaving', 'flip-next', 'flip-prev');
      });
      updateProgress(toolbar, pages[current], current, pages.length);
    };

    const flipTo = (next) => {
      if (animating || next < 0 || next >= pages.length || next === current) return;

      const directionClass = next > current ? 'flip-next' : 'flip-prev';
      const from = pages[current];
      const to = pages[next];
      animating = true;

      to.hidden = false;
      to.classList.add('is-entering');
      from.classList.add('is-leaving', directionClass);
      from.classList.remove('is-active');

      window.setTimeout(() => {
        current = next;
        animating = false;
        render();
      }, 700);
    };

    const intercept = (button, handler) => {
      button?.addEventListener(
        'click',
        (event) => {
          if (!isQuranMobile()) return;
          event.preventDefault();
          event.stopImmediatePropagation();
          handler();
        },
        true
      );
    };

    intercept(buttons[0], () => flipTo(current - 1));
    intercept(buttons[1], () => flipTo(current + 1));

    book.addEventListener('pointerdown', (event) => {
      startX = event.clientX;
      startY = event.clientY;
    });

    book.addEventListener('pointerup', (event) => {
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dx) < 34 || Math.abs(dx) < Math.abs(dy)) return;
      flipTo(dx < 0 ? current + 1 : current - 1);
    });

    render();
  };

  const scan = () => {
    if (!isQuranPage()) {
      document.body.classList.remove('quran-search-open');
      return;
    }

    ensureSearchControls();
    if (!isQuranMobile()) return;

    const book = document.querySelector('.mushaf-book');
    if (book) setupBook(book);
  };

  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  mobileQuery.addEventListener('change', scan);
  document.addEventListener('DOMContentLoaded', scan);
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    document.body.classList.remove('quran-search-open');
    const button = document.querySelector('.quran-top-search-btn');
    if (button) syncSearchButton(button);
  });
  window.addEventListener('pageshow', scan);
  scan();
})();
