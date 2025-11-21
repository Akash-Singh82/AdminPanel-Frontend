import { Component, EventEmitter, Input, Output, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';

declare const grecaptcha: any;

@Component({
  selector: 'app-recaptcha',
  standalone: true,
  template: `<div class="g-recaptcha"></div>`,
})
export class RecaptchaComponent implements AfterViewInit, OnDestroy {
  @Input() siteKey!: string;
  @Output() verified = new EventEmitter<string>();

  private widgetId?: number;

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    setTimeout(() => {
      if (typeof grecaptcha !== 'undefined' && this.el.nativeElement) {
        this.widgetId = grecaptcha.render(
          this.el.nativeElement.querySelector('.g-recaptcha'),
          {
            sitekey: this.siteKey,
            callback: (response: string) => this.verified.emit(response),
          }
        );
      } else {
        console.error('reCAPTCHA script not loaded or invalid siteKey');
      }
    }, 300);
  }

  ngOnDestroy() {
    if (typeof grecaptcha !== 'undefined' && this.widgetId !== undefined) {
      grecaptcha.reset(this.widgetId);
    }
  }
}
