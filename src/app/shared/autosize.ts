import { Directive, ElementRef, afterRenderEffect, inject, input } from '@angular/core';

/**
 * Grows a `<textarea>` to fit its content so long text is fully visible
 * instead of scrolling out of a fixed-height box.
 *
 * Bind the model value to `appAutosize` so the box re-fits on every change,
 * including programmatic ones (loading a quiz, AI fill). Those matter because
 * `ngModel` writes the DOM value in a microtask that lands *after* render, so we
 * can't rely on the textarea's own value being current when we measure — we sync
 * the bound value onto it ourselves first (except while the user is typing in it).
 */
@Directive({
  selector: 'textarea[appAutosize]',
})
export class Autosize {
  private readonly el = inject<ElementRef<HTMLTextAreaElement>>(ElementRef);

  /** The bound value; tracked so we re-measure whenever the text changes. */
  readonly appAutosize = input<unknown>();

  constructor() {
    afterRenderEffect(() => {
      const value = String(this.appAutosize() ?? '');
      const textarea = this.el.nativeElement;

      // While focused the browser has already set the value natively; don't touch
      // it and move the caret. Otherwise mirror the model value in so scrollHeight
      // reflects the up-to-date text even before ngModel's deferred write lands.
      if (document.activeElement !== textarea && textarea.value !== value) {
        textarea.value = value;
      }

      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    });
  }
}
