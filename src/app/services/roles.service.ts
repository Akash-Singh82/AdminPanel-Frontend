import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { RoleDetailsDto, RoleDto, RoleListDto } from '../interfaces/role.model';
import { pagedResult } from '../interfaces/paged-result.model';
import { PermissionDto } from '../interfaces/permission.model';

@Injectable({
  providedIn: 'root'
})

export class RolesService {
   private base = `${environment.apiUrl}/api/roles`;
   private permBase = `${environment.apiUrl}/api/permissions/catalog`;
   constructor(private http: HttpClient) {}
   
   count(){
    return this.http.get<string>(`${this.base}/count`)
  }



   getRoles(filters:{

     pageNumber: number,
     pageSize: number,
     name?: string | null,
     description?: string | null,
     isActive?: boolean | null,
     sortField?:string,
     sortDirection?:string,
    }): Observable<pagedResult<RoleListDto>> {
let params = new HttpParams()
.set('pageNumber', String(filters.pageNumber))
.set('pageSize', String(filters.pageSize));


if (filters.name) params = params.set('name', filters.name);
if (filters.description) params = params.set('description', filters.description);
if (filters.isActive !== null && filters.isActive !== undefined) params = params.set('isActive', String(filters.isActive));
if (filters.sortField) params = params.set('sortField', filters.sortField);
if (filters.sortDirection) params = params.set('sortDirection', filters.sortDirection);

return this.http.get<pagedResult<RoleListDto>>(this.base, { params });
}

getRole(id: string) {
return this.http.get<RoleDetailsDto>(`${this.base}/${id}`);
}

createRole(dto: RoleDto) {
return this.http.post(`${this.base}`, dto);
}


updateRole(id: string, dto: RoleDto) {
return this.http.put(`${this.base}/${id}`, dto);
}

toggleStatus(id: string) {
  return this.http.patch(`${this.base}/${id}/toggle-status`, {});
}

deleteRole(id: string) {
return this.http.delete(`${this.base}/${id}`);
}


getPermissions(): Observable<PermissionDto[]> {
return this.http.get<PermissionDto[]>(this.permBase);
}


exportCsv(name?: string | null, description?: string | null, isActive?: boolean | null) {
  let params = new HttpParams();
  if (name) params = params.set('name', name);
  if (description) params = params.set('description', description);
  if (isActive !== null && isActive !== undefined) params = params.set('isActive', String(isActive));

  return this.http.get(`${this.base}/export`, { params, responseType: 'blob' });
}

logExportAudit() {
  return this.http.get(`${this.base}/export`);
}


  
}
