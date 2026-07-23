const COPY_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;

const CHECK_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

const COPY_ICON_SM = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;

const CHECK_ICON_SM = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

export function injectCopyButtons(hostElement: HTMLElement): void {
  // Botones de bloques de codigo
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

  // Botones de inline code
  const wrappers = hostElement.querySelectorAll('.mm-inline-code-wrapper');
  wrappers.forEach((wrapper: Element) => {
    if (wrapper.querySelector('.mm-copy-inline-btn')) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mm-copy-inline-btn';
    btn.setAttribute('aria-label', 'Copiar codigo');
    btn.title = 'Copiar';
    btn.innerHTML = `<span class="mm-copy-icon">${COPY_ICON_SM}</span><span class="mm-check-icon">${CHECK_ICON_SM}</span>`;
    wrapper.appendChild(btn);
  });

  // Botones de links
  const linkWrappers = hostElement.querySelectorAll('.mm-link-wrapper');
  linkWrappers.forEach((wrapper: Element) => {
    if (wrapper.querySelector('.mm-copy-link-btn')) return;

    const a = wrapper.querySelector('a');
    if (!a) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mm-copy-link-btn';
    btn.setAttribute('aria-label', 'Copiar enlace');
    btn.title = 'Copiar enlace';
    btn.innerHTML = `<span class="mm-copy-icon">${COPY_ICON_SM}</span><span class="mm-check-icon">${CHECK_ICON_SM}</span>`;
    wrapper.appendChild(btn);
  });
}

export function setupCopyClickHandler(hostElement: HTMLElement, destroyCallback: (fn: () => void) => void): void {
  const handler = (event: MouseEvent) => {
    const target = event.target as HTMLElement;

    // Boton copiar de bloque de codigo
    const blockBtn = target.closest('.mm-copy-code-btn');
    if (blockBtn instanceof HTMLElement) {
      const pre = blockBtn.closest('.mm-code-block-wrapper')?.querySelector('pre');
      if (!pre) return;

      const code = pre.querySelector('code');
      const textToCopy = code ? code.textContent || '' : pre.textContent || '';

      void navigator.clipboard.writeText(textToCopy).then(() => {
        blockBtn.classList.add('mm-copied');
        setTimeout(() => blockBtn.classList.remove('mm-copied'), 1500);
      });
      return;
    }

    // Boton copiar de inline code
    const inlineBtn = target.closest('.mm-copy-inline-btn');
    if (inlineBtn instanceof HTMLElement) {
      const wrapper = inlineBtn.closest('.mm-inline-code-wrapper');
      const code = wrapper?.querySelector('code');
      if (!code) return;

      const textToCopy = code.textContent || '';

      void navigator.clipboard.writeText(textToCopy).then(() => {
        inlineBtn.classList.add('mm-copied');
        setTimeout(() => inlineBtn.classList.remove('mm-copied'), 1500);
      });
      return;
    }

    // Boton copiar de enlace
    const linkBtn = target.closest('.mm-copy-link-btn');
    if (linkBtn instanceof HTMLElement) {
      const wrapper = linkBtn.closest('.mm-link-wrapper');
      const a = wrapper?.querySelector('a');
      if (!a) return;

      const textToCopy = a.getAttribute('href') || '';

      void navigator.clipboard.writeText(textToCopy).then(() => {
        linkBtn.classList.add('mm-copied');
        setTimeout(() => linkBtn.classList.remove('mm-copied'), 1500);
      });
      return;
    }
  };

  hostElement.addEventListener('click', handler);
  destroyCallback(() => hostElement.removeEventListener('click', handler));
}
