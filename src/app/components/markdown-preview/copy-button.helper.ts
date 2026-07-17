const COPY_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;

const CHECK_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

export function injectCopyButtons(hostElement: HTMLElement): void {
  const headers = hostElement.querySelectorAll('.mm-code-block-header');
  headers.forEach((header: Element) => {
    if (header.querySelector('.mm-copy-code-btn')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mm-copy-code-btn';
    btn.setAttribute('aria-label', 'Copiar codigo');
    btn.title = 'Copiar codigo';
    btn.innerHTML = `<span class="mm-copy-icon">${COPY_ICON_SVG}</span><span class="mm-check-icon">${CHECK_ICON_SVG}</span>`;
    header.appendChild(btn);
  });
}

export function setupCopyClickHandler(hostElement: HTMLElement, destroyCallback: (fn: () => void) => void): void {
  const handler = (event: MouseEvent) => {
    const btn = (event.target as HTMLElement).closest('.mm-copy-code-btn');
    if (!btn || !(btn instanceof HTMLElement)) return;

    const pre = btn.closest('.mm-code-block-wrapper')?.querySelector('pre');
    if (!pre) return;

    const code = pre.querySelector('code');
    const textToCopy = code ? code.textContent || '' : pre.textContent || '';

    void navigator.clipboard.writeText(textToCopy).then(() => {
      btn.classList.add('mm-copied');
      setTimeout(() => btn.classList.remove('mm-copied'), 1500);
    });
  };

  hostElement.addEventListener('click', handler);
  destroyCallback(() => hostElement.removeEventListener('click', handler));
}
