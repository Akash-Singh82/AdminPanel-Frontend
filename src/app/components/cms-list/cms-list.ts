import { Component, OnDestroy, OnInit } from '@angular/core';

import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, takeUntil } from 'rxjs/operators';
import { CmsDto } from '../../interfaces/cms.model';
import { CmsService } from '../../services/cms.service';
import { CommonModule } from '@angular/common';
import { Route, Router, RouterModule } from '@angular/router';
import { HasPermissionDirective } from '../../shared/has-permission';
import { Subject } from 'rxjs';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-cms-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, HasPermissionDirective],
  templateUrl: './cms-list.html',
  styleUrl: './cms-list.scss'
})
export class CmsList implements OnInit, OnDestroy {
cmsList: CmsDto[] = [];
  totalCount = 0;
  pageNumber = 1;
  pageSize = 10;
  searchForm:FormGroup;
  loading = false;
  sortField='createdOn';
  sortDirection:'asc' | 'desc' = 'desc';
  TotalPages=0;
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private cmsService: CmsService, private router:Router,  private confirmDialog:ConfirmDialogService
, private toastService:ToastService
  ) {

    this.searchForm = this.fb.group({
      title: [''],
      key: [''],
      metaKeyword: [''],
      isActive: [null]
    });
  }

  ngOnInit() {
    this.loadData();
     
    this.searchForm.get('isActive')?.valueChanges
      .pipe( debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {this.loadData()});
  }

  onSearch(){
    this.pageNumber = 1;
    this.loadData();
  }


  preventInvalidNameInput(event: KeyboardEvent, controlName: string) {
  const key = event.key;
  const isKeyField = controlName === 'key';

  if (isKeyField) {
    // ✅ For key field: allow only letters, numbers, dash, underscore
    const isAllowed = /^[A-Za-z0-9_-]$/.test(key);

    // Block any disallowed character or space
    if (!isAllowed && key.length === 1) {
      event.preventDefault();
      return;
    }
  } else {
    // ✅ For title/subject fields: allow letters and single spaces
    const isLetter = /^[A-Za-z]$/.test(key);
    const isSpace = key === ' ' || key === 'Spacebar';

    if (!isLetter && !isSpace && key.length === 1) {
      event.preventDefault();
      return;
    }

    const ctrl = this.searchForm.get(controlName);
    const value = (ctrl?.value ?? '') as string;

    // Block leading or double spaces
    if (isSpace && (!value || value.endsWith(' '))) {
      event.preventDefault();
    }
  }
}


// Clean pasted input (for pasting invalid text)
onNamePaste(event: ClipboardEvent, controlName: string) {
  event.preventDefault();
  const ctrl = this.searchForm.get(controlName);
  const clipboardData = event.clipboardData;
  if (!ctrl || !clipboardData) return;

  let pasted = clipboardData.getData('text') ?? '';
  const isKeyField = controlName === 'key';

  let cleaned = '';

  if (isKeyField) {
    // ✅ For key field: only letters, numbers, dash, underscore — no spaces
    cleaned = pasted.replace(/[^A-Za-z0-9_-]+/g, '');
  } else {
    // ✅ For title/subject: letters + single spaces
    cleaned = pasted
      .replace(/[^A-Za-z ]+/g, '')
      .replace(/\s+/g, ' ')
      .replace(/^\s+|\s+$/g, '');
  }

  if (cleaned.length > 50) cleaned = cleaned.slice(0, 50);
  ctrl.setValue(cleaned, { emitEvent: true });
}

  loadData() {
   this.loading=true;
    const filters = this.searchForm.value;
    const fullFilters={
     ...filters,
     sortField:this.sortField,
     sortDirection:this.sortDirection
    };
    this.cmsService
      .getPaged(this.pageNumber, this.pageSize, fullFilters)
      .subscribe({next:(res) => {
        this.loading=false;
        this.cmsList = res.items;
        this.totalCount = res.totalCount;
        this.TotalPages=Math.ceil(this.totalCount/this.pageSize);
      },
    error:()=>{this.loading=false;}});
  }

  sortBy(field: string) {
  if (this.sortField === field) {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    this.sortField = field;
    this.sortDirection = 'asc';
  }

  this.pageNumber = 1;
  this.loadData();
}




  clearFilters() {
    this.searchForm.reset();

    this.searchForm.markAsPristine();
    this.searchForm.markAsTouched();
    setTimeout(() => this.loadData(), 0);
  }




  toggleStatus(cms:CmsDto) {
    const original = cms.isActive;
    cms.isActive = !cms.isActive;

    this.cmsService.toggleStatus(cms.id).subscribe({next:() => {
      setTimeout(()=>{this.toastService.showSuccess('CMS status updated successfully!')},100);
    },
    error:()=>{
       cms.isActive=original;
    },
  });
  }

  async delete(cms: CmsDto) {

     const confirmed = await this.confirmDialog.confirm({
      title:'Delete Cms',
      message:`Are you sure you want to delete this cms page "${cms.metaTitle}"?`,
      confirmText:'Delete',
      cancelText:'Cancel'
    });
    if(confirmed){
      this.cmsService.delete(cms.id).subscribe(() => {this.loadData();
       setTimeout(()=>this.toastService.showSuccess('CMS page deleted successfully!'),100);
      },);
    }
  }


private exportCooldown = false;
  exportCsv() {

    if (this.exportCooldown) return;
  this.exportCooldown = true;

    if (!this.cmsList.length) {
      alert('No data available to export.');
      return;
    }

    this.loading = true;
    const headers = ['Key', 'Title', 'Meta Keyword', 'IsActive'];
    const rows = this.cmsList.map((r) => [
      r.key,
      r.title ?? '',
      r.metaKeyword??'',
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
    a.download = `cms_page_${this.pageNumber}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

     this.cmsService.exportCsvLogOnly().subscribe({
    next: () => console.log('Audit log recorded'),
    error: (err) => console.error('Audit log failed', err)
  });

  // small timeout for UI responsiveness
  this.loading = false;
  setTimeout(() => { this.toastService.showSuccess('Exported CMS csv successfully.') },500);
  setTimeout(()=>{
    this.exportCooldown = false;
  }, 1000);
  }
     

  pageChanged(p: number) {
    this.pageNumber = p;
    this.loadData();
  }
  onAdd(){
    this.router.navigate(['cms/add']);
  }

  onEdit(id:string){
    this.router.navigate([`cms/edit/${id}`])
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
