import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import {
  EmailTemplateCreateDto,
  EmailTemplateDetailsDto,
  EmailTemplateEditDto,
  EmailTemplateFilters,
  EmailTemplateListItemDto
} from '../interfaces/email-template.models';
import { PagedResult } from '../interfaces/Common.model';

@Injectable({
  providedIn: 'root'
})
export class EmailTemplatesService {
  private base = `${environment.apiUrl}/api/emailtemplates`;

  constructor(private http: HttpClient) {}

  getPaged(filters: EmailTemplateFilters = {}): Observable<PagedResult<EmailTemplateListItemDto>> {
    let params = new HttpParams()
      .set('pageNumber', (filters.pageNumber ?? 1).toString())
      .set('pageSize', (filters.pageSize ?? 10).toString());
    if (filters.key) params = params.set('key', filters.key);
    if (filters.title) params = params.set('title', filters.title);
    if (filters.subject) params = params.set('subject', filters.subject);
    if (filters.isActive !== undefined && filters.isActive !== null)
      params = params.set('isActive', String(filters.isActive));

    if (filters.sortField) params = params.set('sortField', filters.sortField);
    if (filters.sortDirection) params = params.set('sortDirection', filters.sortDirection); // ✅ add this

    return this.http.get<PagedResult<EmailTemplateListItemDto>>(this.base, { params });
  }

  getById(id: string) {
    return this.http.get<EmailTemplateDetailsDto>(`${this.base}/${id}`);
  }

  create(dto: EmailTemplateCreateDto) {
    return this.http.post<EmailTemplateDetailsDto>(this.base, dto);
  }

  update(dto: EmailTemplateEditDto) {
    return this.http.put<EmailTemplateDetailsDto>(`${this.base}/${dto.id}`, dto);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  /** ✅ Toggle active/inactive status */
  toggleStatus(id: string) {
    return this.http.put<void>(`${this.base}/${id}/toggle-status`, {});
  }

  /** ✅ Upload for CKEditor (image upload) */
  uploadImage(file: File) {
    const fd = new FormData();
    fd.append('upload', file, file.name);
    return this.http.post<{ url: string }>(`${this.base}/upload`, fd);
  }


  exportCsvLogOnly(){
  return this.http.get(`${this.base}/export`);
}


}
