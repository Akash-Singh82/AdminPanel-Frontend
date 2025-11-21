import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AccountService } from '../../services/account.service';
import { CommonModule } from '@angular/common';
import { passwordValidator } from '../../validators/password.validator';
import { confirmPasswordValidator } from '../../validators/confirm-password.validator';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword implements OnInit {
  form!: FormGroup;
  token = '';
  loading = false;
  message?: string;
  error?: string;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private accountService: AccountService,
    private router: Router,
    private toastService: ToastService
  ) {
    this.form = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, passwordValidator()]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatch }
    );
  }
  passwordMatch(group: FormGroup) {
    const newPass = group.get('password')?.value;
    const confirmPass = group.get('confirmPassword')?.value;
    return newPass === confirmPass ? null : { mismatch: true };
  }
  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const email = params['email'] ?? '';
      const token = params['token'] ?? '';

      this.form.patchValue({ email });
      this.token = token;
    });
  }

  submit() {
    this.error = undefined;
    this.message = undefined;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const model = {
      email: this.form.value.email,
      password: this.form.value.password,
      confirmPassword: this.form.value.confirmPassword,
      token: this.token,
    };

    this.loading = true;

    this.accountService.resetPassword(model).subscribe({
      next: (res) => {
        this.loading = false;
        this.submitted = true;
        this.router.navigate(['/login']);
        setTimeout(() => this.toastService.showSuccess('Your password has been successfully changed!.'), 500);
        // this.message = res.message ?? 'Your password has been successfully changed.';
      },
      error: (err) => {
        this.loading = false;
        const errObj = err?.error;
        if (errObj?.errors && Array.isArray(errObj.errors)) {
          this.error = errObj.errors.join(' ');
        } else {
          this.error = errObj?.message ?? 'Something went wrong. Please try again.';
        }
      },
    });
  }
}
