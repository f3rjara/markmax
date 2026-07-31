import {
  Directive,
  ElementRef,
  HostListener,
  inject,
  input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  Renderer2,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Registro global de tooltips activos en el DOM.
 * Permite limpiar tooltips huerfanos cuando Angular destruye elementos
 * dentro de bloques @if antes de que se dispare mouseleave.
 */
const activeTooltips = new Set<HTMLElement>();

function removeAllTooltips(): void {
  activeTooltips.forEach((el) => {
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });
  activeTooltips.clear();
}

/**
 * Directiva de tooltip accesible con animaciones suaves de entrada y salida.
 * Uso: <button appTooltip="Mi descripcion" tooltipPosition="bottom">
 */
@Directive({
  selector: '[appTooltip]',
  host: {
    '[attr.aria-describedby]': 'tooltipId',
  },
})
export class TooltipDirective implements OnInit, OnDestroy {
  readonly appTooltip = input<string>('');
  readonly tooltipPosition = input<'top' | 'bottom' | 'left' | 'right'>('bottom');
  readonly tooltipDelay = input<number>(400);

  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);

  readonly tooltipId = `mm-tooltip-${Math.random().toString(36).slice(2, 9)}`;

  private tooltipEl: HTMLElement | null = null;
  private showTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    // Eliminar el atributo title nativo para evitar el tooltip duplicado del navegador
    const host = this.el.nativeElement as HTMLElement;
    if (host.hasAttribute('title')) {
      this.renderer.removeAttribute(host, 'title');
    }
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.cancelShow();
    this.showTimer = setTimeout(() => this.show(), this.tooltipDelay());
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.cancelShow();
    this.hideWithAnimation();
  }

  @HostListener('click')
  onClick(): void {
    // Al hacer click el elemento puede ser destruido por @if, ocultar inmediatamente
    this.cancelShow();
    this.forceRemove();
  }

  @HostListener('focus')
  onFocus(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.cancelShow();
    this.showTimer = setTimeout(() => this.show(), 150);
  }

  @HostListener('blur')
  onBlur(): void {
    this.cancelShow();
    this.hideWithAnimation();
  }

  @HostListener('keydown.escape')
  onEscape(): void {
    this.cancelShow();
    this.forceRemove();
  }

  private show(): void {
    const label = this.appTooltip();
    if (!label) return;

    // Eliminar cualquier tooltip previo del registro global
    removeAllTooltips();
    this.tooltipEl = null;

    const tooltip = document.createElement('div');
    tooltip.id = this.tooltipId;
    tooltip.setAttribute('role', 'tooltip');
    tooltip.className = `mm-tooltip mm-tooltip--${this.tooltipPosition()}`;
    tooltip.textContent = label;

    document.body.appendChild(tooltip);
    activeTooltips.add(tooltip);
    this.tooltipEl = tooltip;

    this.position(tooltip);

    // Forzar reflow para activar la transicion CSS
    tooltip.getBoundingClientRect();
    tooltip.classList.add('mm-tooltip--visible');
  }

  private hideWithAnimation(): void {
    if (!this.tooltipEl) return;
    const tooltip = this.tooltipEl;
    this.tooltipEl = null;

    tooltip.classList.remove('mm-tooltip--visible');
    tooltip.classList.add('mm-tooltip--hiding');

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      tooltip.removeEventListener('transitionend', onEnd);
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
      activeTooltips.delete(tooltip);
    };

    // Usar 'once: true' para evitar multiples disparos (opacity + transform)
    const onEnd = () => cleanup();
    tooltip.addEventListener('transitionend', onEnd, { once: true });

    // Fallback: si transitionend no dispara (elemento fuera de pantalla, etc.)
    setTimeout(cleanup, 250);
  }

  private forceRemove(): void {
    this.tooltipEl = null;
    removeAllTooltips();
  }

  private position(tooltip: HTMLElement): void {
    const hostRect = (this.el.nativeElement as HTMLElement).getBoundingClientRect();
    const gap = 8;

    tooltip.style.position = 'fixed';
    tooltip.style.top = '-9999px';
    tooltip.style.left = '-9999px';

    requestAnimationFrame(() => {
      if (!tooltip.parentNode) return;
      const tRect = tooltip.getBoundingClientRect();
      const pos = this.tooltipPosition();

      let top = 0;
      let left = 0;

      switch (pos) {
        case 'bottom':
          top = hostRect.bottom + gap;
          left = hostRect.left + hostRect.width / 2 - tRect.width / 2;
          break;
        case 'top':
          top = hostRect.top - tRect.height - gap;
          left = hostRect.left + hostRect.width / 2 - tRect.width / 2;
          break;
        case 'left':
          top = hostRect.top + hostRect.height / 2 - tRect.height / 2;
          left = hostRect.left - tRect.width - gap;
          break;
        case 'right':
          top = hostRect.top + hostRect.height / 2 - tRect.height / 2;
          left = hostRect.right + gap;
          break;
      }

      // Clamp para no salir del viewport
      left = Math.max(6, Math.min(left, window.innerWidth - tRect.width - 6));
      top = Math.max(6, Math.min(top, window.innerHeight - tRect.height - 6));

      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;
    });
  }

  private cancelShow(): void {
    if (this.showTimer !== null) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
  }

  ngOnDestroy(): void {
    // El elemento puede estar siendo destruido por @if sin haber disparado mouseleave
    this.cancelShow();
    this.forceRemove();
  }
}
