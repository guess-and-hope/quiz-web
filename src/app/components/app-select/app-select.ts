import { Component, HostListener, computed, input, output, signal } from '@angular/core';

export interface SelectOption {
  value: string;
  label: string;
}

/** Fancy custom dropdown that replaces the native <select> while keeping keyboard/ARIA basics. */
@Component({
  selector: 'app-select',
  imports: [],
  templateUrl: './app-select.html',
  styleUrl: './app-select.scss',
})
export class AppSelect {
  readonly options = input.required<SelectOption[]>();
  readonly value = input.required<string>();
  readonly disabled = input(false);
  readonly ariaLabel = input('');
  readonly valueChange = output<string>();

  protected readonly open = signal(false);

  protected readonly selectedLabel = computed(
    () => this.options().find((option) => option.value === this.value())?.label ?? '',
  );

  protected toggle(): void {
    if (!this.disabled()) {
      this.open.update((isOpen) => !isOpen);
    }
  }

  protected close(): void {
    this.open.set(false);
  }

  protected select(option: SelectOption): void {
    this.valueChange.emit(option.value);
    this.open.set(false);
  }

  @HostListener('keydown.escape')
  protected onEscape(): void {
    this.open.set(false);
  }
}
