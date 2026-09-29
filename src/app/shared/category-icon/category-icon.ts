import { Component, input } from '@angular/core';

/** Renders one category icon using the Material Symbols icon font. */
@Component({
  selector: 'app-category-icon',
  template: `<span class="material-symbols-outlined" aria-hidden="true">{{ icon() }}</span>`,
  styles: `
    :host {
      display: inline-flex;
    }

    span {
      font-size: 1.1rem;
    }
  `,
})
export class CategoryIcon {
  readonly icon = input.required<string>();
}
