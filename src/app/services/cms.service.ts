import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PagedResult } from '../interfaces/Common.model';
import { CmsDto, CreateCmsDto, UpdateCmsDto } from '../interfaces/cms.model';
import { environment } from '../../environments/environment';


@Injectable({ providedIn: 'root' })
export class CmsService {
//   private baseUrl = '/api/cms';
 private baseUrl=`${environment.apiUrl}/api/cms`;
  constructor(private http: HttpClient) {}

  getPaged(
    pageNumber: number,
    pageSize: number,
    filters: { title?: string; key?: string; metaKeyword?: string; isActive?: boolean; sortField?:string; sortDirection?:'asc' |'desc' }
  ): Observable<PagedResult<CmsDto>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, v as string);
    });

    return this.http.get<PagedResult<CmsDto>>(this.baseUrl, { params });
  }

  getById(id: string): Observable<CmsDto> {
    return this.http.get<CmsDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateCmsDto): Observable<void> {
    return this.http.post<void>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdateCmsDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  toggleStatus(id: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/toggle-status`, {});
  }

  exportCsv(filters: { title?: string; key?: string; metaKeyword?: string; isActive?: boolean }): Observable<Blob> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, v);
    });

    return this.http.get(`${this.baseUrl}/export`, { params, responseType: 'blob' });
  }

   exportCsvLogOnly(){
  return this.http.get(`${this.baseUrl}/export`);
}
}
