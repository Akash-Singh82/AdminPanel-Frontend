import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CmsService } from '../../services/cms.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-cms-add',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CKEditorModule],
  templateUrl: './cms-add.html',
  styleUrl: './cms-add.scss'
})
export class CmsAdd {
  form:FormGroup;
  public Editor = ClassicEditor; // ✅ Required to bind CKEditor

  constructor(private fb: FormBuilder, private cmsService: CmsService, private router: Router, private toastService:ToastService) {
    this.form = this.fb.group({
    key: ['', [
       Validators.required,
      Validators.minLength(2),
      this.trimmedMinLength(2),
      Validators.maxLength(50),
      Validators.pattern(/^[A-Za-z0-9_-]+$/) // only alphanumerics, dash, underscore
    ]],
    title: ['', [
      Validators.required,
      this.trimmedMinLength(2),
      Validators.maxLength(50),
      Validators.pattern(/^[A-Za-z0-9\s]+$/)

      // Validators.pattern(/^[A-Za-z0-9\s]+$/) // alphabets + spaces
    ]],
    metaKeyword: ['', [
       Validators.required,
      this.trimmedMinLength(2),
      Validators.maxLength(50),
      Validators.pattern(/^[A-Za-z0-9\s]+$/)
    ]],
    metaTitle: ['', [
       Validators.required,
      this.trimmedMinLength(2),
      Validators.maxLength(50),
      Validators.pattern(/^[A-Za-z0-9\s]+$/)
    ]],
    metaDescription: ['', [
       Validators.required,
      this.trimmedMinLength(2),
      Validators.maxLength(100),
      Validators.pattern(/^[A-Za-z0-9\s]+$/)
    ] ],
    content: ['', [Validators.required, this.trimmedMinLength(2), Validators.maxLength(100)]],
    isActive: [true]
  });
  }
  trimmedMinLength(min: number) {
  return (control: any) => {
    if (!control.value) return null;
   const text = control.value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    return text.length >= min ? null : { trimmedMinLength: true };
  };
}

preventInvalidInput(event: KeyboardEvent, controlName: string) {
  const key = event.key;
  const ctrl = this.form.get(controlName);
  const value = (ctrl?.value ?? '') as string;

  // For KEY field: allow only alphabets, numbers, underscores, dashes
  if (controlName === 'key') {
    const isAllowed = /^[A-Za-z0-9_-]$/.test(key);
    if (!isAllowed && key.length === 1) {
      event.preventDefault();
      return;
    }
  } 
  // For text fields (title, subject, fromName, body)
  else {
    const isLetter = /^[A-Za-z]$/.test(key);
    const isSpace = key === ' ' || key === 'Spacebar';

    // Block anything not a letter or space
    if (!isLetter && !isSpace && key.length === 1) {
      event.preventDefault();
      return;
    }

    // Block leading spaces or consecutive spaces
    if (isSpace && (!value || value.endsWith(' '))) {
      event.preventDefault();
      return;
    }
  }
}

preventLeadingSpace_(event: KeyboardEvent, controlName: string) {
  const key = event.key;
  const ctrl = this.form.get(controlName);
  const value = ctrl?.value ?? '';

  // Allow navigation keys (Backspace, Arrow keys, etc.)
  const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'];
  if (allowedKeys.includes(key)) return;

  // Block leading space
  if ((key === ' ' || key === 'Spacebar') && (!value || value.length === 0)) {
    event.preventDefault();
    return;
  }

  // Block consecutive spaces
  if ((key === ' ' || key === 'Spacebar') && value.endsWith(' ')) {
    event.preventDefault();
    return;
  }
}


// ✅ Prevent invalid pastes
onPaste(event: ClipboardEvent, controlName: string) {
  event.preventDefault();
  const ctrl = this.form.get(controlName);
  if (!ctrl) return;

  const pasted = event.clipboardData?.getData('text') ?? '';
  let cleaned = '';

  if (controlName === 'key') {
    // For key: keep only letters, numbers, underscores, dashes
    cleaned = pasted.replace(/[^A-Za-z0-9_-]+/g, '');
  } else {
    // For text fields: only alphabets and single spaces between words
    cleaned = pasted
      .replace(/[^A-Za-z ]+/g, '') // remove everything except alphabets and spaces
      .replace(/\s+/g, ' ')        // collapse multiple spaces
      .replace(/^\s+|\s+$/g, '');  // trim leading/trailing spaces
  }

  // Apply character limit (your maxLength constraint)
  const maxLength = controlName === 'subject' ? 100 : 50;
  if (cleaned.length > maxLength) cleaned = cleaned.slice(0, maxLength);

  ctrl.setValue(cleaned, { emitEvent: true });
}

// ✅ Remove leading spaces if typed (extra safety)
removeLeadingSpacesIfNeeded(controlName: string) {
  const ctrl = this.form.get(controlName);
  if (!ctrl) return;

  const value = ctrl.value as string;
  if (typeof value === 'string' && value.startsWith(' ')) {
    ctrl.setValue(value.trimStart(), { emitEvent: false });
  }
}

  preventLeadingSpace(event: KeyboardEvent, controlName: string) {
    // Some browsers use ' ' and older ones 'Spacebar'
    const isSpaceKey = event.key === ' ' || event.key === 'Spacebar';
    if (!isSpaceKey) return;

    const ctrl = this.form.get(controlName);
    const value = ctrl?.value ?? '';

    // if the current value is empty (or only spaces) block the leading space
    if (!value || value.length === 0) {
      event.preventDefault();
    }
  }
  submitting = false;
  submit() {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    console.log('Form invalid:', this.form.value);
    this.toastService.show("Invalid form. Please correct the errors.");
    return;
  }
  this.submitting = true;

  console.log('Submitting CMS data:', this.form.value);
  this.cmsService.create(this.form.value).subscribe({
    next: () => {
      this.submitting = false;
      this.router.navigate(['/cms']);
      setTimeout(() => this.toastService.showSuccess('CMS page created successfully.'), 100);
    },
    error: (err) =>{
      this.submitting = false;
      console.error('Save error:', err);
    } ,
  });
}

  cancel() {
    this.router.navigate(['/cms']);
  }
  onEnterPress(event: Event) {
  const e = event as KeyboardEvent;
  e.preventDefault();
}

}
