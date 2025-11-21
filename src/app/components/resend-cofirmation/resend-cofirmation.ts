import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth } from '../../services/auth';
import { Route, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-resend-cofirmation',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './resend-cofirmation.html',
  styleUrl: './resend-cofirmation.scss'
})
export class ResendCofirmation {
  form!: ReturnType<FormBuilder['group']>;
  submitting = false;
  
  constructor(private fb: FormBuilder, private auth: Auth, private router: Router) {}
  ngOnInit(){
  this.form = this.fb.group({ 
    email: ['', [Validators.required, Validators.email]] 
  });
  }

  submit(){
    if (this.form.invalid) return; 
    this.submitting = true; 
    this.auth.resendConfirmation(this.form.value.email).subscribe({ 
      next: () => { 
        this.submitting = false; 
        this.router.navigate(['/resend-success']); 
      }, 
      error: () => { 
        this.submitting = false; 
      } 
    });
  }

}
