import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuditLogsService {
  private base = `${environment.apiUrl}/api/auditlogs`;

  constructor(private http: HttpClient) {}

  getPaged(filters: any, page: number, pageSize: number): Observable<any> {
    let params = new HttpParams()
      .set('pageNumber', page)        // ✅ match your backend parameter names
      .set('pageSize', pageSize);

    if (filters) {
      if (filters.userName) params = params.set('userName', filters.userName.trim());
      if (filters.type) params = params.set('type', filters.type.trim());
      if (filters.activity) params = params.set('activity', filters.activity.trim());

      // ✅ properly handle date filters
      if (filters.fromDate) params = params.set('fromDate', new Date(filters.fromDate).toISOString());
      if (filters.toDate) params = params.set('toDate', new Date(filters.toDate).toISOString());

      if (filters.sortField) params = params.set('sortField', filters.sortField);
    if (filters.sortDirection) params = params.set('sortDirection', filters.sortDirection);
    }

    return this.http.get(this.base, { params });
  }

 

     exportCsvLogOnly(){
  return this.http.get(`${this.base}/export`);
}
}
