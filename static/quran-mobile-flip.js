(function () {
  const mobileQuery = window.matchMedia('(max-width: 767px)');
  const pagePath = '/kitab/quran';
  const initializedBooks = new WeakSet();

  const isQuranMobile = () => location.pathname === pagePath && mobileQuery.matches;

  const pageNumber = (page) => {
    const footer = page.querySelector('.mushaf-footer');
    const header = page.querySelector('.mushaf-header span:last-child');
    return (footer?.textContent || header?.textContent || '').replace(/\D+/g, '') || '-';
  };

  const updateProgress = (toolbar, page, index, total) => {
    const progress = toolbar?.querySelector('div:first-child');
    if (!progress) return;
    progress.textContent = `Lembar ${index + 1} dari ${total} • Halaman ${pageNumber(page)}`;
  };

  const setupBook = (book) => {
    if (!isQuranMobile() || initializedBooks.has(book) || book.querySelector('.stf__parent')) return;

    const pages = Array.from(book.querySelectorAll(':scope > .mushaf-page'));
    if (pages.length < 2) return;

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
    if (!isQuranMobile()) return;
    const book = document.querySelector('.mushaf-book');
    if (book) setupBook(book);
  };

  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  mobileQuery.addEventListener('change', scan);
  document.addEventListener('DOMContentLoaded', scan);
  window.addEventListener('pageshow', scan);
  scan();
})();
