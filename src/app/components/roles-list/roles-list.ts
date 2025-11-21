import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, takeUntil, Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { RolesService } from '../../services/roles.service';
import { RoleListDto } from '../../interfaces/role.model';
import { PagedResult } from '../../interfaces/Common.model';
import { HasPermissionDirective } from '../../shared/has-permission';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HasPermissionDirective],
  templateUrl: './roles-list.html',
  styleUrls: ['./roles-list.scss'],
})
export class RolesListComponent implements OnInit, OnDestroy {
  filtersForm!: FormGroup;

  pageNumber = 1;
  pageSize = 10;
  paged?: PagedResult<RoleListDto>;
  loading = false;
  TotalPages=0;
  sortField = 'createdOn';
  sortDirection: 'asc' | 'desc' = 'desc';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private svc: RolesService,
    private router: Router,
    private confirmDialog: ConfirmDialogService,
    private toastService:ToastService
  ) {
    this.filtersForm = this.fb.group({
      name: [''],
      description: [''],
      isActive: [null],
    });
  }

  ngOnInit() {
    // // Auto-load when filters change
    // this.filtersForm.valueChanges
    //   .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
    //   .subscribe(() => {
    //     this.pageNumber = 1;
    //     this.load();
    //   });

    this.filtersForm.get('isActive')?.valueChanges
    .pipe(
       debounceTime(200),
        distinctUntilChanged(),
      takeUntil(this.destroy$))
    .subscribe(()=>{
       this.pageNumber=1;
       this.load();
    });
    this.load();
  }

  onSearch(){
    this.pageNumber=1;
    this.load();
  }

  /** 🔁 Load paged roles */
  load() {
    const f = this.filtersForm.value;
    this.loading = true;

    const filters: any = {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      name: f.name ?? null,
      description: f.description ?? null,
      isActive:
        f.isActive === '' || f.isActive === undefined ? null : f.isActive,
      sortField: this.sortField,
      sortDirection: this.sortDirection,
    };

    this.svc.getRoles(filters).subscribe({
      next: (res) => {
        this.paged = res;
        this.TotalPages=Math.ceil(this.paged?.totalCount/this.pageSize);
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load roles:', err);
        this.loading = false;
      },
    });
  }

  /** 🔽 Sorting */
  sortBy(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.pageNumber = 1;
    this.load();
  }

  preventInvalidNameInput(event: KeyboardEvent, controlName: string) {
  const isSpace = event.key === ' ' || event.key === 'Spacebar';
  const isLetter = /^[A-Za-z]$/.test(event.key);
  const dot= event.key ==='.';

  // Block everything except alphabets and space
  if (!isLetter && !isSpace && !dot && event.key.length === 1) {
    event.preventDefault();
    return;
  }
  
  const ctrl = this.filtersForm.get(controlName);
  const value = (ctrl?.value ?? '') as string;
if(value.endsWith('.') && dot) {
  event.preventDefault();
  return;
}
if(value.endsWith(' ') && dot) {
  event.preventDefault();
  return;
}

  // Block leading space
  if (isSpace && (!value || value.length === 0)) {
    event.preventDefault();
    return;
  }

  // Block double spaces
  if (isSpace && value.endsWith(' ')) {
    event.preventDefault();
  }
}

// Clean pasted input (for pasting invalid text)
onNamePaste(event: ClipboardEvent, controlName: string) {
  event.preventDefault();
  const ctrl = this.filtersForm.get(controlName);
  const clipboardData = event.clipboardData;
  if (!ctrl || !clipboardData) return;

  let pasted = clipboardData.getData('text') ?? '';

  // Keep only letters and spaces, remove leading, collapse multiple
  let cleaned = pasted
    .replace(/[^A-Za-z ]+/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^\s+/, '')
    .replace(/\s+$/, '');

  if (cleaned.length > 50) cleaned = cleaned.slice(0, 50);

  ctrl.setValue(cleaned, { emitEvent: true });
}

  /** 🧹 Clear filters */
  clearFilters() {
    this.filtersForm.reset({
      name: '',
      description: '',
      isActive: null,
    });
    this.pageNumber = 1;
    this.load();
  }

  /** 🔄 Toggle Active/Inactive */
  toggleStatus(role: RoleListDto) {
    const original = role.isActive;
    (role.isActive = !role.isActive);
    this.svc.toggleStatus(role.id).subscribe({
      next: () => {
        this.toastService.showSuccess('Role status updated successfully!');},
      error: () => role.isActive=original,
    });
  }

  async delete(role: RoleListDto) {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Role',
      message: `Are you sure you want to delete "${role.name}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if (confirmed) {
      this.svc.deleteRole(role.id).subscribe(() =>{
        this.load();
        this.toastService.showSuccess('Role deleted successfully!');
      },
    );
    }
  }

  /** 📤 Export CSV */
  private exportCooldown = false;
  exportCsv() {
    if(this.exportCooldown) return;
    this.exportCooldown = true;
    if (!this.paged?.items?.length) {
      alert('No data available to export.');
      return;
    }
    this.loading = true;

    const headers = ['Name', 'Description', 'Status'];
    const rows = this.paged.items.map((r) => [
      r.name,
      r.description ?? '',
      r.isActive ? 'Active' : 'Inactive',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${(v ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roles_page_${this.pageNumber}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      this.toastService.showSuccess('Exported Roles csv successfully.')
    },500);
    this.svc.logExportAudit().subscribe({
    next: () => console.log('Export audit logged successfully'),
    error: (err) => console.error('Failed to record audit log', err)
  });

    this.loading = false;
  setTimeout(()=>{
    this.exportCooldown = false;
  }, 1000);
  }

  pageChanged(page: number) {
    this.pageNumber = page;
    this.load();
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.pageNumber = 1;
    this.load();
  }

  onAdd() {
    this.router.navigate(['/roles/add']);
  }

  onEdit(id: string) {
    this.router.navigate([`/roles/edit/${id}`]);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
