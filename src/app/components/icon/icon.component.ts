import { Component, input } from '@angular/core';
import { IconName } from '../../shared/types/icon.type';

/**
 * Componente presentacional que renderiza iconos SVG inline.
 * Los SVGs son decorativos por defecto (aria-hidden="true").
 */
@Component({
  selector: 'app-icon',
  templateUrl: './icon.component.html',
  host: {
    class: 'inline-flex shrink-0 items-center justify-center',
  },
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input<number>(16);
}
