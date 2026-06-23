import { Component, input } from '@angular/core';

export type IconName =
  | 'plus'
  | 'file-text'
  | 'search'
  | 'code'
  | 'eye'
  | 'check'
  | 'panel-left'
  | 'bold'
  | 'italic'
  | 'strikethrough'
  | 'link'
  | 'list'
  | 'list-ordered'
  | 'list-check'
  | 'quote'
  | 'code-inline'
  | 'code-block'
  | 'minus'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'more-vertical'
  | 'pin'
  | 'edit'
  | 'download'
  | 'archive'
  | 'trash-2'
  | 'chevron-down'
  | 'rotate-ccw'
  | 'x'
  | 'check-circle'
  | 'info'
  | 'alert-triangle'
  | 'alert-circle';

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
