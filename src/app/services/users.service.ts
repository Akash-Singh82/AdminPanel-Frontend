import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { pagedResult } from '../interfaces/paged-result.model';
import { UserListDto, UserDetailsDto, CreateUserDto, UpdateUserDto } from '../interfaces/user.model';
import { PagedResult } from '../interfaces/Common.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private base = `${environment.apiUrl}/api/users`;
  constructor(private http: HttpClient) {}
  private controller?:AbortController;
  count(){
    return this.http.get<string>(`${this.base}/count`)
  }

  get(id: string) {
    return this.http.get<UserDetailsDto>(`${this.base}/${id}`);
  }

  create(dto: CreateUserDto, file?: File) {
    const fd = new FormData();
    fd.append('FirstName', dto.firstName);
    if (dto.lastName) fd.append('LastName', dto.lastName);
    fd.append('Email', dto.email);
    if (dto.phoneNumber) fd.append('PhoneNumber', dto.phoneNumber);
    
    fd.append('RoleId', dto.roleId);
    fd.append('IsActive', dto.isActive ? 'true' : 'false');
    fd.append('Password', dto.password);
    if (dto.emailConfirmed !== undefined) fd.append('EmailConfirmed', dto.emailConfirmed ? 'true' : 'false');
    if (file) fd.append('file', file, file.name); // Request.Form.Files.FirstOrDefault() in backend

    return this.http.post(`${this.base}`, fd);
  }

  update(id: string, dto: UpdateUserDto, file?: File) {
    const fd = new FormData();
    fd.append('FirstName', dto.firstName);
    if (dto.lastName) fd.append('LastName', dto.lastName);
    if (dto.phoneNumber) fd.append('PhoneNumber', dto.phoneNumber ?? '');
    fd.append('RoleId', dto.roleId);
    fd.append('IsActive', dto.isActive ? 'true' : 'false');
    if (dto.emailConfirmed !== undefined) fd.append('EmailConfirmed', dto.emailConfirmed ? 'true' : 'false');
    if (dto.resetPassword) fd.append('ResetPassword', dto.resetPassword);
    if (file) fd.append('file', file, file.name);

    return this.http.put(`${this.base}/${id}`, fd);
  }

  delete(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }

  // get roles simple list (controller already exposes ~/api/roles/simple)
  getRolesSimple(): Observable<Array<{ id: string; name: string }>> {
    return this.http.get<Array<{ id: string; name: string }>>(`${environment.apiUrl}/api/roles/simple`);
  }


  toggleStatus(id: string) {
  return this.http.patch<void>(`${this.base}/${id}/toggle`, {});
}

getPaged(filters: any): Observable<PagedResult<UserListDto>> {


  if (this.controller) {
      try{this.controller.abort();}
      catch{ } // <-- will cancel request on backend
    }

    // Create a new controller for this request
    this.controller = new AbortController();


  let params = new HttpParams()
    .set('pageNumber', (filters.pageNumber ?? 1).toString())
    .set('pageSize', (filters.pageSize ?? 10).toString());
  if (filters.name) params = params.set('name', filters.name);
  if (filters.email) params = params.set('email', filters.email);
  if (filters.phone) params = params.set('phone', filters.phone);
  if (filters.roleId) params = params.set('roleId', filters.roleId);
  if (filters.isActive !== undefined && filters.isActive !== null)
    params = params.set('isActive', String(filters.isActive));
  if(filters.sortField) params = params.set('sortBy', filters.sortField);
  if(filters.sortDirection)  params = params.set('sortDirection', filters.sortDirection);

    return this.http.get<PagedResult<UserListDto>>(`${this.base}`, {
      params
     
      // signal: this.controller.signal
    });

}


// users.service.ts
logExportAudit() {
  return this.http.get(`${this.base}/export`);
}
changePassword(id: string, dto: { oldPassword: string; newPassword: string }) {
  return this.http.post(`${this.base}/${id}/change-password`, dto);
}


}
