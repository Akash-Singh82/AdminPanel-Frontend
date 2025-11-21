import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmailTemplatesService } from '../../services/email-templates.service';
import { Router } from '@angular/router';
import { EmailTemplateCreateDto } from '../../interfaces/email-template.models';
import { CommonModule } from '@angular/common';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-email-template-add',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CKEditorModule],
  templateUrl: './email-template-add.html',
  styleUrls: ['./email-template-add.scss']
})
export class EmailTemplateAdd {
  public Editor = ClassicEditor;

  form = new FormGroup({
    key: new FormControl('', [
      Validators.required,
      Validators.minLength(2),
      this.trimmedMinLength(2),
      Validators.maxLength(50),
      Validators.pattern(/^[A-Za-z0-9_-]+$/) // only alphanumerics, dash, underscore
    ]),
    title: new FormControl('', [
      Validators.required,
      this.trimmedMinLength(2),
      Validators.maxLength(50),
      Validators.pattern(/^[A-Za-z0-9\s]+$/) // alphabets + spaces
    ]),
    subject: new FormControl('', [
      Validators.required,
      this.trimmedMinLength(2),
      Validators.maxLength(50)
    ]),
    fromEmail: new FormControl('', [
      Validators.required,
      Validators.email,
      Validators.maxLength(50)
    ]),

    fromName: new FormControl('', [
      Validators.required,
      this.trimmedMinLength(2),
      Validators.maxLength(50),
      Validators.pattern(/^[A-Za-z\s]*$/)
    ]),
    isActive: new FormControl(true),
    isManualMail: new FormControl(false),
    body: new FormControl('', [Validators.required, this.trimmedMinLength(2), Validators.maxLength(100)])
  });

  constructor(private svc: EmailTemplatesService, private router: Router, private toastService:ToastService) { }
  trimmedMinLength(min: number) {
  return (control: any) => {
    if (!control.value) return null;
   const text = control.value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    return text.length >= min ? null : { trimmedMinLength: true };
  };
}

preventSpaceInEmail_(event: KeyboardEvent) {
  if (event.key === ' ' || event.key === 'Spacebar') {
    event.preventDefault(); // block space completely
  }
}

// Prevent pasting spaces in the email field
onPasteEmail_(event: ClipboardEvent) {
  const clipboardData = event.clipboardData;
  if (!clipboardData) return;

  const pasted = clipboardData.getData('text');
  // Remove *all* spaces from the pasted text
  const cleaned = pasted.replace(/\s+/g, '');

  event.preventDefault();
  const ctrl = this.form.get('fromEmail');
  ctrl?.setValue(cleaned, { emitEvent: false });
}

// ✅ Prevent invalid input dynamically
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


  submitting = false;
  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.show("Invalid form. Please correct the errors.");
      return;
    }

    this.submitting=true;
    const dto: EmailTemplateCreateDto = {
      
      key: this.form.get('key')?.value!,
      title: this.form.get('title')?.value!,
      subject: this.form.get('subject')?.value!,
      fromEmail: this.form.get('fromEmail')?.value ?? null,
      fromName: this.form.get('fromName')?.value ?? null,
      isActive: this.form.get('isActive')?.value ?? true,
      isManualMail: this.form.get('isManualMail')?.value ?? false,
      body: this.form.get('body')?.value ?? ''
    
         
    };
    this.svc.create(dto).subscribe({
      next: () =>{
        this.submitting=false;
        this.router.navigate(['/email-templates']);
        setTimeout(()=>this.toastService.showSuccess('Email template created successfully.'), 50);
      },
      
      error: (err) =>{
        this.submitting=false;
        console.error('An error occurred', err)
      } 
    });
  }

  // Utility: prevent/paste/trim spaces at beginning
  // Prevent space as first char when the control is empty
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


onEnterPress(event: Event) {
  const e = event as KeyboardEvent;
  e.preventDefault();
}


}
