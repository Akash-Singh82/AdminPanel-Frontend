import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuditLogsService } from '../../services/audit-logs.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { HasPermissionDirective } from '../../shared/has-permission';
import { ToastService } from '../../services/toast.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { NativeDateAdapter } from '@angular/material/core';
import { Injectable } from '@angular/core';

// Custom Date Format for YYYY-MM-DD
export const CUSTOM_DATE_FORMATS = {
  parse: {
    dateInput: 'YYYY-MM-DD',
  },
  display: {
    dateInput: 'YYYY-MM-DD',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Injectable()
export class CustomDateAdapter extends NativeDateAdapter {
  override format(date: Date, displayFormat: Object): string {
    if (displayFormat === 'YYYY-MM-DD') {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return super.format(date, displayFormat);
  }

  override parse(value: any): Date | null {
    if (typeof value === 'string' && value.length > 0) {
      const parts = value.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
    }
    return super.parse(value);
  }
}

interface AuditLog {
  userName: string;
  type: string;
  activity: string;
  timestamp: string;
}

@Component({
  selector: 'app-audit-logs',
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterModule, 
    FormsModule, 
    HasPermissionDirective,  
    MatDatepickerModule,
    MatInputModule,
    MatNativeDateModule
  ],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: CUSTOM_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'en-US' }
  ],
  templateUrl: './audit-logs.html',
  styleUrl: './audit-logs.scss'
})
export class AuditLogs implements OnInit, OnDestroy {
  minDate = new Date(1900, 0, 1);
  maxDate = new Date(2100, 11, 31);
  Math=Math;
  filtersForm: FormGroup;
  logs: any[] = [];
  total = 0;
  page = 1;
  pageSize = 10;
  loading = false;
  TotalPages=0;
  sortField = 'timestamp';
  sortDirection: 'asc' | 'desc' = 'desc';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder, 
    private svc: AuditLogsService, 
    private toastService: ToastService
  ) {
    this.filtersForm = this.fb.group({
      userName: [''],
      type: [''],
      activity: [''],
      fromDate: [null],
      toDate: [null]
    }, { validators: this.dateRangeValidator });
  }

  dateRangeValidator(group: FormGroup) {
    const from = group.get('fromDate')?.value;
    const to = group.get('toDate')?.value;

    if (from && to && new Date(from) > new Date(to)) {
      return { invalidRange: true };
    }

    const minYear = 1900;
    const maxYear = 2100;

    const allDates = [from, to].filter(Boolean).map(d => new Date(d).getFullYear());
    if (allDates.some(y => y < minYear || y > maxYear)) {
      return { outOfRange: true };
    }

    return null;
  }

  ngOnInit() {
    this.loadLogs();
  }

  onSearch() {
    this.page = 1;
    this.loadLogs();
  }

  loadLogs() {
    this.loading = true;
    const filters = {
      ...this.filtersForm.value,
      fromDate: this.formatDate(this.filtersForm.value.fromDate),
      toDate: this.formatDate(this.filtersForm.value.toDate),
      sortField: this.sortField,
      sortDirection: this.sortDirection
    };
    
    this.svc.getPaged(filters, this.page, this.pageSize).subscribe({
      next: (res) => {
        this.logs = res.data.map((log: AuditLog) => {
          return {
            ...log,
            timestamp: new Date(log.timestamp + 'Z') // ensures UTC parsing
          };
        });

        this.total = res.total;
        this.TotalPages= this.Math.ceil(this.total/this.pageSize);
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  formatDate(d: any) {
    if (!d) return '';
    const date = new Date(d);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  preventInvalidNameInput(event: KeyboardEvent, controlName: string) {
    const key = event.key;
    const isKeyField = controlName === 'key';

    if (isKeyField) {
      const isAllowed = /^[A-Za-z0-9_-]$/.test(key);
      if (!isAllowed && key.length === 1) {
        event.preventDefault();
        return;
      }
    } else {
      const isLetter = /^[A-Za-z]$/.test(key);
      const isSpace = key === ' ' || key === 'Spacebar';

      if (!isLetter && !isSpace && key.length === 1) {
        event.preventDefault();
        return;
      }

      const ctrl = this.filtersForm.get(controlName);
      const value = (ctrl?.value ?? '') as string;

      if (isSpace && (!value || value.endsWith(' '))) {
        event.preventDefault();
      }
    }
  }

  onNamePaste(event: ClipboardEvent, controlName: string) {
    event.preventDefault();
    const ctrl = this.filtersForm.get(controlName);
    const clipboardData = event.clipboardData;
    if (!ctrl || !clipboardData) return;

    let pasted = clipboardData.getData('text') ?? '';
    const isKeyField = controlName === 'key';

    let cleaned = '';

    if (isKeyField) {
      cleaned = pasted.replace(/[^A-Za-z0-9_-]+/g, '');
    } else {
      cleaned = pasted
        .replace(/[^A-Za-z ]+/g, '')
        .replace(/\s+/g, ' ')
        .replace(/^\s+|\s+$/g, '');
    }

    if (cleaned.length > 50) cleaned = cleaned.slice(0, 50);
    ctrl.setValue(cleaned, { emitEvent: true });
  }

  changePage(page: number) {
    this.page = page;
    this.loadLogs();
  }

  changePageSize(size: number) {
    this.pageSize = size;
    this.page = 1;
    this.loadLogs();
  }

  clearFilters() {
    this.filtersForm.reset({ 
      userName: '', 
      type: '', 
      activity: '', 
      fromDate: null, 
      toDate: null 
    });
    this.page = 1;
    this.loadLogs();
  }

  private exportCooldown = false;

exportCsv() {
  if (this.exportCooldown) return;
  this.exportCooldown = true;

  if (!this.logs.length) {
    this.toastService.showSuccess('No data to export');
    this.exportCooldown = false;
    return;
  }

  this.loading = true;

  const headers = ['User Name', 'Type', 'Activity', 'Timestamp'];
  const rows = this.logs.map((r) => [
    r.userName ?? '',
    r.type ?? '',
    r.activity ?? '',
    this.formatTimestamp(r.timestamp) ?? '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((r) => r.map((v) => `"${(v ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-logs_page_${this.page}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);

  this.svc.exportCsvLogOnly().subscribe({
    next: () => {
      console.log('Audit log recorded');
      this.loading = false;
      this.toastService.showSuccess('Exported Audit Logs csv successfully.');
    },
    error: (err) => {
      console.error('Audit log failed', err);
      this.loading = false;
      this.toastService.showSuccess('Exported Audit Logs csv successfully.');
    }
  });

  setTimeout(() => {
    this.exportCooldown = false;
  }, 1000);
}

formatTimestamp(timestamp: any): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

  sortBy(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.page = 1;
    this.loadLogs();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }


}