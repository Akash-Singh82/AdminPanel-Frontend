import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccountService } from '../../services/account.service';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {
  form!: FormGroup;
  message?: string;
  error?: string;
  loading = false;
  submitted = false;

  constructor(private fb: FormBuilder, private accountService: AccountService, private toastService:ToastService, private router:Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  // Prevent typing spaces anywhere in the email field
preventSpaceInEmail(event: KeyboardEvent) {
  if (event.key === ' ' || event.key === 'Spacebar') {
    event.preventDefault(); // block space completely
  }
}

// Prevent pasting spaces in the email field
onPasteEmail(event: ClipboardEvent) {
  const clipboardData = event.clipboardData;
  if (!clipboardData) return;

  const pasted = clipboardData.getData('text');
  // Remove *all* spaces from the pasted text
  const cleaned = pasted.replace(/\s+/g, '');

  event.preventDefault();
  const ctrl = this.form.get('email');
  ctrl?.setValue(cleaned, { emitEvent: false });
}


  submit() {
    this.error = undefined;
    this.message = undefined;

    if (this.form.invalid) {
      this.toastService.show("Invalid form. Please correct the errors.");
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.accountService.forgotPassword(this.form.value.email!).subscribe({
      next: (res) => {
        this.loading = false;
        this.submitted = true;
        setTimeout(() => this.toastService.showSuccess('Password reset link sent successfully.'), 100);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;
       
        this.error = err?.error?.message ?? 'Something went wrong. Please try again.';
      },
    });
  }
}
