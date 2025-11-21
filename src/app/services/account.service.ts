// src/app/services/account.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

interface ApiResponse { message?: string; errors?: string[]; }

@Injectable({ providedIn: 'root' })
export class AccountService {
  // private base = '/api/account';
  private base = `${environment.apiUrl}/api/account`;

  constructor(private http: HttpClient) {}

  forgotPassword(email: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.base}/forgot-password`, { email });
  }

  resetPassword(model: { email: string; password: string; confirmPassword: string; token: string; }) {
    // your backend ResetPasswordViewModel expects Email, Password, ConfirmPassword, Token
    return this.http.post<ApiResponse>(`${this.base}/reset-password`, model);
  }
}
