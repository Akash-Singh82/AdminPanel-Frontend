import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { EmailTemplatesService } from '../../services/email-templates.service';
import { EmailTemplateListItemDto } from '../../interfaces/email-template.models';
import { PagedResult } from '../../interfaces/Common.model';
import { HasPermissionDirective } from '../../shared/has-permission';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { ToastService } from '../../services/toast.service';


@Component({
  selector: 'app-email-templates-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HasPermissionDirective],
  templateUrl: './email-templates-list.html',
  styleUrl: './email-templates-list.scss'
})
export class EmailTemplatesListComponent implements OnInit, OnDestroy {
  emailTemplates: EmailTemplateListItemDto[] = [];
  totalCount = 0;
  pageNumber = 1;
  pageSize = 10;
  searchForm: FormGroup;
  private destroy$ = new Subject<void>();


  loading = false;
  sortField = 'createdOn';
  sortDirection:'asc'|'desc' = 'desc';
  TotalPages=0;
  constructor(
    private fb: FormBuilder,
    private svc: EmailTemplatesService,
    private router: Router,
    private confirmDialog:ConfirmDialogService,
    private toastService:ToastService
  ) {
    this.searchForm = this.fb.group({
      key: [''],
      title: [''],
      subject: [''],
      isActive: [null]
    });
  }

  ngOnInit() {
    
    // auto reload filters
    this.searchForm.get('isActive')?.valueChanges
    .pipe(debounceTime(400),
    distinctUntilChanged(),
    takeUntil(this.destroy$))
    .subscribe(() => {
      this.pageNumber=1;
      this.loadData();
    });
    this.loadData();
  }

  onSearch(){
    this.pageNumber=1;
    this.loadData();
  }

  loadData() {
    const filters = this.searchForm.value;
    this.loading=true;
    const payload = {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      key: filters.key ?? null,
      title: filters.title ?? null,
      subject: filters.subject ?? null,
      isActive: filters.isActive === '' ? null : filters.isActive,
      sortField:this.sortField,
      sortDirection:this.sortDirection
    };

    this.svc.getPaged(payload).subscribe((res: PagedResult<EmailTemplateListItemDto>) => {
      this.loading=false;
      this.emailTemplates = res.items;
      this.totalCount = res.totalCount;
      this.TotalPages=Math.ceil(this.totalCount/this.pageSize)
    },
  ()=>{this.loading=false;});
  }

  sortBy(field:string){
    if(this.sortField==field){
      this.sortDirection=this.sortDirection === 'asc'?'desc':'asc';
    }else{
      this.sortField = field;
      this.sortDirection='asc';
    }
    this.pageNumber=1;
    this.loadData();
  }

  clearFilters() {
    this.searchForm.reset();
    this.loadData();
  }




  /** ✅ Toggle template status */
  toggleStatus(item: EmailTemplateListItemDto) {
    const original = item.isActive;
    item.isActive = !item.isActive;
    this.svc.toggleStatus(item.id).subscribe({
     next:()=>{
      this.toastService.showSuccess('Template status updated successfully!');
    },
    error:()=>{

      item.isActive=original;
    } 
  });
  }


      async delete(item: EmailTemplateListItemDto){
    const confirmed = await this.confirmDialog.confirm({
      title:'Delete Email Template',
      message:`Are you sure you want to delete this email template"${item.title}"?`,
      confirmText:'Delete',
      cancelText:'Cancel'
    });
    if(confirmed){
      this.svc.delete(item.id).subscribe(()=>{this.loadData();
        setTimeout(()=>this.toastService.showSuccess('Email template deleted successfully.'), 50);
      },);
    }
  }




  // Prevent invalid characters and multiple/leading spaces
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
private exportCooldown = false;


    exportCsv() {
      if (this.exportCooldown) return;
  this.exportCooldown = true;
    if (!this.emailTemplates.length) {
      // alert('No data available to export.');
      return;
    }

    this.loading = true;
    const headers = ['Key', 'Title', 'Subject', 'IsActive'];
    const rows = this.emailTemplates.map((r) => [
      r.key,
      r.title ?? '',
      r.subject??'',
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
    a.download = `email-template_page_${this.pageNumber}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => this.toastService.showSuccess('Exported Email-Template csv successfully.'),500);
    // Step 2: Hit backend just to log the export
  this.svc.exportCsvLogOnly().subscribe({
    next: () => console.log('✅ Export logged successfully.'),
    error: () => console.warn('⚠️ Failed to log export.'),
  });

    this.loading = false;
  setTimeout(()=>{
    this.exportCooldown = false;
  }, 1000);
  }

  pageChanged(p: number) {
    this.pageNumber = p;
    this.loadData();
  }

  onAdd() {
    this.router.navigate(['/email-templates/add']);
  }

  onEdit(id: string) {
    this.router.navigate([`/email-templates/edit/${id}`]);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
