import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { EmailTemplatesService } from '../../services/email-templates.service';
import { ActivatedRoute, Router } from '@angular/router';
import { EmailTemplateDetailsDto, EmailTemplateListItemDto, EmailTemplateEditDto } from '../../interfaces/email-template.models';
import { CommonModule } from '@angular/common';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-email-template-edit',
  imports: [CommonModule, ReactiveFormsModule, CKEditorModule],
  templateUrl: './email-template-edit.html',
  styleUrl: './email-template-edit.scss'
})
export class EmailTemplateEdit {

  form= new FormGroup({
    key: new FormControl({ value: '', disabled: true }),
    title: new FormControl('', [
      Validators.required,
      this.trimmedMinLength(2),
      Validators.maxLength(50),
      Validators.pattern(/^[A-Za-z0-9\s]+$/)
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
    isManual: new FormControl(false),
    body: new FormControl('', [Validators.required, this.trimmedMinLength(2), Validators.maxLength(100)])
  });

  public Editor = ClassicEditor;
  loading = false;
  templateId!:string;
  
  constructor(
    private svc: EmailTemplatesService,
    private route: ActivatedRoute,
    private router: Router,
    private toastService:ToastService
  ){}

  ngOnInit(){
     this.templateId = this.route.snapshot.paramMap.get('id')!;
     this.loadTemplate();
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



  loadTemplate(){
     
 
    this.loading= true;
    this.svc.getById(this.templateId).subscribe({
      next:(res:EmailTemplateDetailsDto)=>{
        this.form.patchValue({
          key: res.key,
          title: res.title,
          subject:res.subject,
          fromEmail: res.fromEmail,
          fromName:res.fromName,
          isActive:res.isActive,
          isManual:res.isManual,
          body:res.body

        });
        this.loading= false;
      },
      error:()=>{
        this.loading = false;
        // alert('Failed to load template');
      }
    });
  }

   // Prevent typing spaces anywhere in the email field
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

  submitting=false;
  onSubmit(){
    if(this.form.invalid){
      this.form.markAllAsTouched();
      this.toastService.show("Invalid form. Please correct the errors.");
      return;
    }
    
    this.submitting=true;
   
const payload: EmailTemplateEditDto = {
  id: this.templateId,
  key: this.form.get('key')!.value ?? '',
  title: this.form.get('title')!.value ?? '',
  subject: this.form.get('subject')!.value ?? '',
  fromEmail: this.form.get('fromEmail')!.value ?? '',
  fromName: this.form.get('fromName')!.value ?? '',
  
  isActive: this.form.get('isActive')!.value === true ,
  isManualMail: this.form.get('isManual')!.value ?? false,
 
  body: this.form.get('body')!.value ?? '',
};

    this.svc.update(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/email-templates']);
        setTimeout(()=>this.toastService.showSuccess('Email template updated successfully.'),500);
      },
      error: () => this.submitting = false
    });
  }
  

  CancelCommand(){
    this.router.navigate(['/email-templates']);
  }

  onEnterPress(event: Event) {
  const e = event as KeyboardEvent;
  e.preventDefault();
}

}
