import { Directive, HostListener, ElementRef, OnInit } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[autoDateFormat]',
  standalone: true
})
export class AutoDateFormatDirective implements OnInit {
  private previousValue: string = '';

  constructor(
    private el: ElementRef<HTMLInputElement>,
    private control: NgControl
  ) {}

  ngOnInit() {
    // Set input type and pattern
    this.el.nativeElement.setAttribute('type', 'text');
    this.el.nativeElement.setAttribute('maxlength', '10');
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    const key = event.key;
    const input = this.el.nativeElement;
    const cursorPos = input.selectionStart || 0;
    const currentValue = input.value;

    // Allow: backspace, delete, tab, escape, enter, arrows
    if (
      ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key) ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (event.ctrlKey && ['a', 'c', 'v', 'x'].includes(key.toLowerCase()))
    ) {
      return;
    }

    // Only allow digits
    if (!/^\d$/.test(key)) {
      event.preventDefault();
      return;
    }

    // Prevent input if already at max length
    if (currentValue.length >= 10 && input.selectionStart === input.selectionEnd) {
      event.preventDefault();
      return;
    }

    // Validate year range (first 4 digits)
    if (cursorPos < 4) {
      const newValue = this.insertChar(currentValue, key, cursorPos);
      const yearPart = newValue.replace(/-/g, '').slice(0, 4);
      
      if (yearPart.length === 4) {
        const year = parseInt(yearPart);
        if (year < 1900 || year > 2100) {
          event.preventDefault();
          return;
        }
      }
    }

    // Validate month (positions 5-6)
    if (cursorPos === 5 || cursorPos === 6) {
      const newValue = this.insertChar(currentValue, key, cursorPos);
      const monthPart = newValue.slice(5, 7).replace(/-/g, '');
      
      if (monthPart.length === 2) {
        const month = parseInt(monthPart);
        if (month < 1 || month > 12) {
          event.preventDefault();
          return;
        }
      } else if (monthPart.length === 1 && parseInt(monthPart) > 1) {
        // If first digit is > 1, auto-prepend 0
        event.preventDefault();
        this.formatAndUpdate(currentValue, '0' + key, cursorPos);
        return;
      }
    }

    // Validate day (positions 8-9)
    if (cursorPos === 8 || cursorPos === 9) {
      const newValue = this.insertChar(currentValue, key, cursorPos);
      const dayPart = newValue.slice(8, 10).replace(/-/g, '');
      
      if (dayPart.length === 2) {
        const day = parseInt(dayPart);
        if (day < 1 || day > 31) {
          event.preventDefault();
          return;
        }
      } else if (dayPart.length === 1 && parseInt(dayPart) > 3) {
        // If first digit is > 3, auto-prepend 0
        event.preventDefault();
        this.formatAndUpdate(currentValue, '0' + key, cursorPos);
        return;
      }
    }
  }

@HostListener('input', ['$event'])
onInput(event: Event) {
  const inputEvent = event as InputEvent;

  const input = this.el.nativeElement;
  let value = input.value;
  const cursorPos = input.selectionStart || 0;

  // Remove any non-digit characters except hyphens
  let digitsOnly = value.replace(/[^\d-]/g, '');

  digitsOnly = digitsOnly.replace(/-/g, '');

  // Store cursor position relative to digits
  const digitsBefore = value.slice(0, cursorPos).replace(/\D/g, '').length;

  // Format: YYYY-MM-DD
  let formatted = '';

  if (digitsOnly.length > 0) {
    formatted = digitsOnly.slice(0, 4);
  }
  if (digitsOnly.length > 4) {
    formatted += '-' + digitsOnly.slice(4, 6);
  }
  if (digitsOnly.length > 6) {
    formatted += '-' + digitsOnly.slice(6, 8);
  }

  formatted = formatted.slice(0, 10);

  if (formatted !== value) {
    input.value = formatted;

    let newCursorPos = 0;
    let digitCount = 0;

    for (let i = 0; i < formatted.length && digitCount < digitsBefore; i++) {
      if (/\d/.test(formatted[i])) {
        digitCount++;
      }
      newCursorPos = i + 1;
    }

    if (formatted[newCursorPos] === '-') {
      newCursorPos++;
    }

    input.setSelectionRange(newCursorPos, newCursorPos);
  }

  this.validateAndUpdateControl(formatted);
  this.previousValue = formatted;
}


  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    
    const pastedData = event.clipboardData?.getData('text') || '';
    const digitsOnly = pastedData.replace(/\D/g, '');
    
    if (digitsOnly.length === 0) return;
    
    const input = this.el.nativeElement;
    const cursorPos = input.selectionStart || 0;
    
    this.formatAndUpdate(input.value, digitsOnly, cursorPos);
  }

  @HostListener('blur')
  onBlur() {
    const value = this.el.nativeElement.value;
    
    // Validate complete date on blur
    if (value.length === 10) {
      const [year, month, day] = value.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      
      // Check if date is valid
      if (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      ) {
        // Valid date - update control with Date object
        if (this.control.control) {
          this.control.control.setValue(date, { emitEvent: true });
        }
      } else {
        // Invalid date - clear
        this.el.nativeElement.value = '';
        if (this.control.control) {
          this.control.control.setValue(null);
        }
      }
    } else if (value.length > 0 && value.length < 10) {
      // Incomplete date - clear
      this.el.nativeElement.value = '';
      if (this.control.control) {
        this.control.control.setValue(null);
      }
    }
  }

  private insertChar(value: string, char: string, pos: number): string {
    return value.slice(0, pos) + char + value.slice(pos);
  }

  private formatAndUpdate(currentValue: string, newChars: string, cursorPos: number) {
    const input = this.el.nativeElement;
    const before = currentValue.slice(0, cursorPos).replace(/\D/g, '');
    const after = currentValue.slice(cursorPos).replace(/\D/g, '');
    
    let combined = before + newChars + after;
    combined = combined.slice(0, 8); // Max 8 digits for YYYYMMDD
    
    let formatted = '';
    if (combined.length > 0) formatted = combined.slice(0, 4);
    if (combined.length > 4) formatted += '-' + combined.slice(4, 6);
    if (combined.length > 6) formatted += '-' + combined.slice(6, 8);
    
    input.value = formatted;
    
    // Set cursor after inserted content
    const newDigitPos = (before + newChars).length;
    let newCursorPos = 0;
    let digitCount = 0;
    
    for (let i = 0; i < formatted.length && digitCount < newDigitPos; i++) {
      if (/\d/.test(formatted[i])) digitCount++;
      newCursorPos = i + 1;
    }
    
    if (formatted[newCursorPos] === '-') newCursorPos++;
    
    input.setSelectionRange(newCursorPos, newCursorPos);
    this.validateAndUpdateControl(formatted);
  }

  private validateAndUpdateControl(value: string) {
    if (value.length === 10) {
      const [year, month, day] = value.split('-').map(Number);
      
      // Basic validation
      if (
        year >= 1900 && year <= 2100 &&
        month >= 1 && month <= 12 &&
        day >= 1 && day <= 31
      ) {
        const date = new Date(year, month - 1, day);
        
        // Verify date is valid (handles month/day edge cases)
        if (
          date.getFullYear() === year &&
          date.getMonth() === month - 1 &&
          date.getDate() === day
        ) {
          // Valid date - will be set on blur
          return;
        }
      }
    }
    
    // Incomplete or invalid - keep as string for now
    // Will be validated on blur
  }
}