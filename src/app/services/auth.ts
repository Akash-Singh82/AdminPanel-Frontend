import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of, tap,Subject, switchMap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { BehaviorSubject, debounceTime, distinctUntilChanged } from 'rxjs';


export interface DecodedToken {
  sub?: string;
  email?: string;
  Permission?: string | string[]; // permission claims
  [key: string]: any;
}


export interface RegisterModel {
    firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword?: string;
  dateOfBirth?: string | null;
  phoneNumber?: string | null;
}

export interface LoginModel {
    email: string;
  password: string;
  rememberMe?: boolean;
  // captchaToken:string | null;
}
export interface LoginResponse {
  token?: string;
  message?: string;
}

export interface ProfileInfo {
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  lastLoggedIn?: string;
  createdOn?: string;
  dateOfBirth?: string;
  // emailConfirmed: boolean;
  imageUrl?: string;
  roleName?:string;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private base = `${environment.apiUrl}/api`;
  private baseAccount = `${this.base}/Account`;

  private baseRemoteValidation = `${this.base}/RemoteValidation`

  redirectUrl: string | null = null;


  constructor(private http: HttpClient, private router:Router) { }

  isEmailAvailable(email: string): Observable<boolean> {
    const params = new HttpParams().set('email', email);
    return this.http.get<{ available: boolean }>(`${this.baseRemoteValidation}/is-email-available`, { params })
      .pipe(map(res => res.available),
        catchError(() => of(true))
      );

  }

  register(model: RegisterModel): Observable<any> {
    return this.http.post(`${this.baseAccount}/Register`, model);
  }

  autoLogin(): Observable<boolean>{
    const email = localStorage.getItem('savedEmail');
    const password = localStorage.getItem('savedPassword');

    if(!email || !password){
      return of(false);
    }

    const model = {email, password} as LoginModel;



    return this.login(model).pipe(
      switchMap(res=>{
        if(res && res.token){
          this.setToken(res.token);

          return this.getProfile().pipe(
            map(profile => !!profile),
            catchError(()=>of(false))
          );
        }
        return of(false);
      }),
      catchError(()=> of(false))
    );
  }

  login(model: LoginModel): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseAccount}/Login`, model);
  }



  confirmEmail(userId: string, token: string): Observable<any> {
    const params = new HttpParams().set('userId', userId).set('token', token);
    return this.http.get(`${this.baseAccount}/confirm-email`, { params });
  }

  resendConfirmation(email: string): Observable<any> {
    return this.http.post(`${this.baseAccount}/resend-email-confirmation`, { email });
  }

    private profileSubject = new BehaviorSubject<ProfileInfo | null>(null);
  profile$ = this.profileSubject.asObservable();

  getProfile():Observable<ProfileInfo> {
  return this.http.get<ProfileInfo>(`${this.baseAccount}/profile`).pipe(
    map(p => {
      // If backend returned relative path accidentally, make it absolute using environment.apiUrl
      if (p && p.imageUrl && p.imageUrl.startsWith('/')) {
        // ensure environment.apiUrl has no trailing slash
        const base = environment.apiUrl.replace(/\/+$/, '');
        p.imageUrl = `${base}${p.imageUrl}`;
      }
      return p;
    }),
    tap(profile=> this.profileSubject.next(profile)),
    catchError(() => of(null as unknown as ProfileInfo)) // keep previous behavior if you want
  );
}


  logout(): Observable<any> {
    const token = this.getToken(); // keep token for the request if needed
    return this.http.post<any>(`${this.baseAccount}/Logout`, {}).pipe(
      tap(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('permissions');
        this.permissions=[];
        this.notifyPermissionChange();
      })
    );
  }

  private permissions: string[] = [];
  setToken(token: string) {
    localStorage.setItem('token', token);


    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const perms = decoded['Permission'];
      if (!perms) {
        this.permissions = [];
      } else if (Array.isArray(perms)) {
        this.permissions = perms;
      } else {
        // If multiple claims of same type exist, some decoders return single string or first; 
        // but jwt-decode will return first occurrence or array depending encoding. So handle guardrails:
        // If the library returned a comma separated string, split it:
        if (typeof perms === 'string' && perms.includes(',')) {
          this.permissions = perms.split(',').map(s => s.trim());
        } else {
          this.permissions = [String(perms)];
        }
      }
       console.log('✅ Final parsed permissions:', this.permissions);
      localStorage.setItem('permissions', JSON.stringify(this.permissions));
      this.notifyPermissionChange();
    } catch (e) {
      console.error('Invalid token while decoding permissions', e);
      this.permissions = [];
      localStorage.removeItem('permissions');
    }

  }

  getPermissions(): string[] {
    
    if (this.permissions.length === 0) {
      const saved = localStorage.getItem('permissions');
      if (saved) this.permissions = JSON.parse(saved);
    }
    return this.permissions;
  }

  hasPermission(permission: string): boolean {
    return this.getPermissions().includes(permission);
  }

  hasAny(permissions: string[]): boolean {
    return permissions.some(p => this.getPermissions().includes(p));
  }


  getToken(): string | null {
    return localStorage.getItem('token');
  }


  isLoggedIn(): boolean {
    const t = this.getToken();
    return !!t;
  }



  // 🔹 Decode JWT (safe)
  private decodeJwt(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }

   // 🔹 Get decoded token payload
  getDecodedToken(): any {
    const token = this.getToken();
    return token ? this.decodeJwt(token) : null;
  }
  checkServerStatus(){
    return this.http.get(`${this.baseAccount}/health`).pipe(catchError(()=>of(false)));
  }

  // 🔹 Get user ID from token
  getUserId(): string | null {
    const decoded = this.getDecodedToken();
    return decoded ? decoded.sub || decoded.nameid || null : null;
  }

  // 🔹 Get roles from token
  getRoles(): string[] {
    const decoded = this.getDecodedToken();
    if (!decoded) return [];
    const roles = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    return Array.isArray(roles) ? roles : roles ? [roles] : [];
  }

  getUserRole(): string | null {
    const roles = this.getRoles();
    return roles.length > 0 ? roles[0] : null;
  }

  // ✅ Helper: check if current user is SuperAdmin
  isSuperAdmin(): boolean {
    return this.getRoles().includes('SuperAdmin');
  }
// Replace Subject<void> with a debounced BehaviorSubject<string[]>
private permissionChange$ = new BehaviorSubject<string[]>([]);

get permissionChanges(): Observable<string[]> {
  return this.permissionChange$.pipe(
    debounceTime(200),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
  );
}

private notifyPermissionChange() {
  this.permissionChange$.next([...this.permissions]); // emit current permissions
}



  refreshPermissions(): Observable<void> {
  return this.getProfile().pipe(
    
    tap(() => {
      this.getProfile().subscribe();
     this.notifyPermissionChange();
    }),
    map(() => void 0)
  );
}

refreshAfterRoleUpdate(): Observable<void> {
  // try re-fetching new token via saved credentials
  return this.autoLogin().pipe(
    switchMap(success => {
      if (success) {
        return this.getProfile().pipe(
          tap(() => {
            this.notifyPermissionChange();
          }),
          map(() => void 0)
        );
      } else {
        // fallback to login page
        this.logout().subscribe();
        this.router.navigate(['/login']);
        return of(void 0);
      }
    })
  );
}

  // ✅ Get main role name (first if multiple)
  getRoleName(): string | null {
    const roles = this.getRoles();
    return roles.length > 0 ? roles[0] : null;
  }

  // ✅ Quick check if current user is SuperAdmin
  canAssignSuperAdmin(): boolean {
    return this.getRoles().some(r => r.toLowerCase() === 'superadmin');
  }


}
