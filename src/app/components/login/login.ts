import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth, LoginModel } from '../../services/auth';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { passwordValidator } from '../../validators/password.validator';
import { ToastService } from '../../services/toast.service';
// import { RecaptchaComponent } from '../../shared/recaptcha/recaptcha.component';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login implements OnInit {
  form!: ReturnType<FormBuilder['group']>;
  submitting = false;
  formSubmitted = false;
  captchaToken: string | null = null;
  siteKey = '6Lc4kQAsAAAAAEZmfmZ8xdjaOB9lgYfPZuioDUcK';

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private auth: Auth,
    private router: Router,
    private toastService:ToastService
  ) { }

  ngOnInit(): void {
    this.generateCaptcha();
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [false],
      captcha: ['', Validators.required],   
      
    });
  }

  onCaptchaVerified(token: string) {
    this.form.patchValue({ reCaptchaToken: token });
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
captchaerror=true;
captchaValue: string = '';

generateCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  this.captchaValue = Array.from({ length: 5 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  
}
validateCaptcha(input: string) {
  const ctrl = this.form.get('captcha');
  if (input.toUpperCase() === this.captchaValue) {
    ctrl?.setErrors(null);
    this.captchaerror=false;
  } else {
    ctrl?.setErrors({ wrong: true });
    this.captchaerror=true;
  }
}




  submit() {

    this.formSubmitted = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if(this.captchaerror)
        this.toastService.show("Wrong Captcha. Please enter valid captcha.");
      else
        this.toastService.show("Invalid form. Please correct the errors.");
      this.generateCaptcha();
      this.form.get('captcha')?.setValue('');
      return;
    }


    const model: LoginModel = this.form.value as LoginModel;

    this.submitting = true;
    this.auth.login(model).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res && res.token) {
          this.auth.setToken(res.token);

          localStorage.setItem('savedEmail', model.email);
        localStorage.setItem('savedPassword', model.password);
          
          const redirectTo = this.auth.redirectUrl || '/dashboard';
          this.auth.redirectUrl = null;
          this.router.navigate([redirectTo]);
          this.toastService.showSuccess('Login Successfully!');
        } else {
          this.router.navigate(['/error'], {
            queryParams: { message: res?.message || 'Invalid Credentials or User Not found', code: 401 }
          });
        }
      },
      error: () => {
        this.submitting = false;
      }
    });
  }
}
