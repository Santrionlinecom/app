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
        border: 1px solid #0f766e !important;
        background: #0f766e !important;
        color: #ffffff !important;
        opacity: 1 !important;
        filter: none !important;
        backdrop-filter: none !important;
        box-shadow: 0 8px 18px rgba(15, 118, 110, 0.18) !important;
        white-space: nowrap;
      }

      .quran-top-search-btn svg {
        width: 1rem;
        height: 1rem;
      }

      .quran-top-search-btn.is-open {
        border-color: #047857 !important;
        background: #047857 !important;
        color: #ffffff !important;
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
          position: relative;
          z-index: 95;
          width: 2.25rem;
          min-width: 2.25rem;
          height: 2.25rem;
          min-height: 2.25rem;
          padding: 0 !important;
          border-color: #0f766e !important;
          border-radius: 0.75rem !important;
          background: #0f766e !important;
          color: #ffffff !important;
          box-shadow: 0 5px 14px rgba(15, 118, 110, 0.22) !important;
        }

        .quran-top-search-btn span {
          display: none;
        }

        body.quran-search-open .quran-search-overlay-backdrop {
          position: fixed;
          inset:
            max(8.35rem, calc(env(safe-area-inset-top) + 7.85rem))
            0 0;
          z-index: 80;
          display: block;
          pointer-events: none;
          background: transparent;
          backdrop-filter: none;
        }

        body.quran-search-open .quran-search-panel {
          position: fixed !important;
          inset:
            max(8.75rem, calc(env(safe-area-inset-top) + 8.25rem))
            0.75rem auto 0.75rem;
          z-index: 90;
          display: flex !important;
          max-height: min(28rem, calc(100dvh - 10rem));
          overflow: auto;
          border-color: rgba(16, 185, 129, 0.28) !important;
          border-radius: 1rem !important;
          box-shadow: 0 24px 60px rgba(2, 6, 23, 0.32);
        }

        .mushaf-book.quran-js-flip-ready {
          position: relative !important;
          overflow: hidden !important;
          perspective: 1600px;
          contain: layout paint;
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
            transform 820ms cubic-bezier(0.16, 0.86, 0.24, 1),
            opacity 560ms ease,
            filter 560ms ease;
          backface-visibility: hidden;
          will-change: transform, opacity;
        }

        .mushaf-book.quran-js-flip-ready > .mushaf-page::after {
          position: absolute;
          inset: 0;
          z-index: 3;
          pointer-events: none;
          content: "";
          opacity: 0;
          background:
            linear-gradient(90deg, rgba(2, 6, 23, 0.22), transparent 18%, transparent 82%, rgba(255, 255, 255, 0.42)),
            linear-gradient(180deg, rgba(255, 255, 255, 0.18), transparent 38%);
          transition: opacity 560ms ease;
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
          opacity: 0;
          filter: saturate(0.96) brightness(0.98);
        }

        .mushaf-book.quran-js-flip-ready > .mushaf-page.is-leaving::after,
        .mushaf-book.quran-js-flip-ready > .mushaf-page.is-dragging::after {
          opacity: 0.46;
        }

        .mushaf-book.quran-js-flip-ready > .mushaf-page.is-dragging {
          z-index: 4;
          transition: none !important;
        }

        .mushaf-book.quran-js-flip-ready > .mushaf-page.is-returning {
          transition:
            transform 220ms ease,
            opacity 220ms ease,
            filter 220ms ease !important;
        }

        .mushaf-book.quran-js-flip-ready > .mushaf-page.is-leaving.flip-next {
          transform: translateX(-64%) rotateY(86deg);
          transform-origin: right center;
        }

        .mushaf-book.quran-js-flip-ready > .mushaf-page.is-leaving.flip-prev {
          transform: translateX(64%) rotateY(-86deg);
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
    let dragState = null;
    let startX = 0;
    let startY = 0;

    initializedBooks.add(book);
    book.classList.add('quran-js-flip-ready');

    const render = () => {
      pages.forEach((page, index) => {
        const active = index === current;
        page.hidden = !active;
        page.classList.toggle('is-active', active);
        page.classList.remove('is-entering', 'is-leaving', 'is-dragging', 'flip-next', 'flip-prev');
        page.style.removeProperty('opacity');
        page.style.removeProperty('transform');
        page.style.removeProperty('transform-origin');
        page.style.removeProperty('filter');
      });
      updateProgress(toolbar, pages[current], current, pages.length);
    };

    const maxDragDistance = () => Math.max(120, book.clientWidth * 0.78);

    const directionFromDelta = (dx) => (dx < 0 ? 'flip-next' : 'flip-prev');

    const targetFromDelta = (dx) => current + (dx < 0 ? 1 : -1);

    const originForDirection = (directionClass) =>
      directionClass === 'flip-next' ? 'right center' : 'left center';

    const dragTransform = (directionClass, progress, dx) => {
      const clampedDx = Math.max(-maxDragDistance(), Math.min(maxDragDistance(), dx));
      const move = clampedDx * 0.58;
      const angle = 10 + progress * 76;
      const signedAngle = directionClass === 'flip-next' ? angle : -angle;
      return `translateX(${move}px) rotateY(${signedAngle}deg)`;
    };

    const clearDrag = () => {
      dragState = null;
      pages.forEach((page) => {
        page.classList.remove('is-dragging');
        page.style.removeProperty('opacity');
        page.style.removeProperty('transform');
        page.style.removeProperty('transform-origin');
        page.style.removeProperty('filter');
      });
    };

    const finishAnimation = (from, to, next) => {
      const done = () => {
        from.removeEventListener('transitionend', onEnd);
        window.clearTimeout(fallback);
        current = next;
        animating = false;
        render();
      };
      const onEnd = (event) => {
        if (event.target === from && event.propertyName === 'transform') done();
      };
      const fallback = window.setTimeout(done, 880);
      from.addEventListener('transitionend', onEnd);
      to.style.opacity = '1';
    };

    const flipTo = (next) => {
      if (animating || next < 0 || next >= pages.length || next === current) return;

      const directionClass = next > current ? 'flip-next' : 'flip-prev';
      const from = pages[current];
      const to = pages[next];
      animating = true;

      to.hidden = false;
      to.style.opacity = '1';
      to.classList.add('is-entering');
      from.style.transformOrigin = originForDirection(directionClass);
      from.classList.add('is-leaving', directionClass);
      from.classList.remove('is-active');
      finishAnimation(from, to, next);
    };

    const applyDrag = (dx) => {
      const next = targetFromDelta(dx);
      const from = pages[current];
      const edgeOnly = next < 0 || next >= pages.length;

      if (edgeOnly) {
        dragState = null;
        pages.forEach((page, index) => {
          if (index !== current) {
            page.hidden = true;
            page.classList.remove('is-entering', 'flip-next', 'flip-prev');
            page.style.removeProperty('opacity');
          }
        });
        const move = Math.max(-18, Math.min(18, dx * 0.12));
        from.classList.add('is-dragging');
        from.style.transform = `translateX(${move}px)`;
        return;
      }

      const directionClass = directionFromDelta(dx);
      const progress = Math.min(1, Math.abs(dx) / maxDragDistance());
      const to = pages[next];

      if (dragState?.target !== next) {
        pages.forEach((page, index) => {
          if (index !== current && index !== next) {
            page.hidden = true;
            page.classList.remove('is-entering');
            page.style.removeProperty('opacity');
          }
        });
      }

      dragState = { target: next, directionClass, dx, progress };
      to.hidden = false;
      to.classList.add('is-entering');
      to.style.opacity = String(0.42 + progress * 0.58);

      from.classList.add('is-dragging', directionClass);
      from.classList.remove(directionClass === 'flip-next' ? 'flip-prev' : 'flip-next');
      from.style.transformOrigin = originForDirection(directionClass);
      from.style.transform = dragTransform(directionClass, progress, dx);
      from.style.opacity = String(Math.max(0.18, 1 - progress * 0.82));
      from.style.filter = `saturate(${1 - progress * 0.06}) brightness(${1 - progress * 0.04})`;
    };

    const settleDrag = (commit) => {
      if (!dragState) {
        clearDrag();
        render();
        return;
      }

      const { target, directionClass, dx, progress } = dragState;
      const from = pages[current];
      const to = pages[target];
      const shouldCommit = commit && progress > 0.18 && Math.abs(dx) > 44 && to;

      if (!shouldCommit) {
        const active = pages[current];
        active.classList.remove('is-dragging', 'flip-next', 'flip-prev');
        active.classList.add('is-returning');
        active.style.removeProperty('transform-origin');
        active.style.transform = 'translateX(0) rotateY(0deg)';
        active.style.opacity = '1';
        window.setTimeout(() => {
          active.classList.remove('is-returning');
          clearDrag();
          render();
        }, 240);
        return;
      }

      animating = true;
      dragState = null;
      from.classList.remove('is-dragging');
      from.classList.add('is-leaving', directionClass);
      from.style.transformOrigin = originForDirection(directionClass);
      from.classList.remove('is-active');
      to.hidden = false;
      to.classList.add('is-entering');
      window.requestAnimationFrame(() => {
        finishAnimation(from, to, target);
        from.style.removeProperty('transform');
        from.style.removeProperty('opacity');
        from.style.removeProperty('filter');
      });
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
      if (animating || !isQuranMobile()) return;
      startX = event.clientX;
      startY = event.clientY;
      dragState = null;
      book.setPointerCapture?.(event.pointerId);
    });

    book.addEventListener('pointermove', (event) => {
      if (animating || !isQuranMobile()) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (!dragState && (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy))) return;
      event.preventDefault();
      applyDrag(dx);
    });

    book.addEventListener('pointerup', (event) => {
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      book.releasePointerCapture?.(event.pointerId);
      if (Math.abs(dx) < 24 || Math.abs(dx) < Math.abs(dy)) {
        settleDrag(false);
        return;
      }
      settleDrag(true);
    });

    book.addEventListener('pointercancel', (event) => {
      book.releasePointerCapture?.(event.pointerId);
      settleDrag(false);
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
  document.addEventListener('click', (event) => {
    if (!mobileQuery.matches || !document.body.classList.contains('quran-search-open')) return;
    const panel = document.querySelector('.quran-search-panel');
    const button = document.querySelector('.quran-top-search-btn');
    const target = event.target;
    if (panel?.contains(target) || button?.contains(target)) return;
    document.body.classList.remove('quran-search-open');
    if (button) syncSearchButton(button);
  });
  window.addEventListener('pageshow', scan);
  scan();
})();
