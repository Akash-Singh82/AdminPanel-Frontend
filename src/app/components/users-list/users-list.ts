import { Component, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UsersService } from '../../services/users.service';
import { UserListDto } from '../../interfaces/user.model';
import { PagedResult } from '../../interfaces/Common.model';
import { HasPermissionDirective } from '../../shared/has-permission';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { Auth } from '../../services/auth'; // ✅ make sure this import is correct
import { ToastService } from '../../services/toast.service';
import { pagedResult } from '../../interfaces/paged-result.model';


@Component({
  selector: 'app-users-list',
  standalone: true,
  templateUrl: './users-list.html',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HasPermissionDirective],
})
export class UsersListComponent implements OnInit, OnDestroy {
   form!: FormGroup;
    filteredRoles: Array<{ id: string; name: string }> = [];

  showDropdown = false;
  
  filtersForm: FormGroup;
  pageNumber = 1;
  pageSize = 10;
  paged?: PagedResult<UserListDto>;
  loading = false;
  roles: Array<{ id: string; name: string }> = [];
  private destroy$ = new Subject<void>();
  TotalPages=0;

  sortField = 'createdOn';
  sortDir: 'asc' | 'desc' = 'desc';

  currentUserId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private svc: UsersService,
    private router: Router,
    private elRef: ElementRef,
    private confirmDialog:ConfirmDialogService,
    private auth:Auth,
    private toastService:ToastService
  ) {
    this.filtersForm = this.fb.group({
      name: ['',Validators.pattern(/^[A-Za-z]+(?: [A-Za-z]+)*$/),],
      email: [''],
      phone: [''],
      roleId: [''],
      roleSearch: [''],
      isActive: [null],
    });
  }

  currentUserRole: string | null = null;

  ngOnInit() {

    this.currentUserId = this.auth.getUserId();
    this.currentUserRole = this.auth.getUserRole();
      this.svc.getRolesSimple().subscribe((roles) => {
      this.roles = roles;
      
      this.filteredRoles = roles;
    });



    // 🔹 Handle live search input
    this.filtersForm
      .get('roleSearch')
      ?.valueChanges.pipe(
        debounceTime(200),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((value: string) => {
        this.filterRoles(value);

        const match = this.roles.find(
          (r) => r.name.toLowerCase() === value?.toLowerCase()
        );
        if (match) {
          this.form.patchValue({ roleId: match.id }, { emitEvent: false });
          this.showDropdown=false;
        } else {
          this.form.patchValue({ roleId: null }, { emitEvent: false });
           this.showDropdown=true;
        }
      });
        

    this.filtersForm.get('roleId')?.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.pageNumber = 1;
      this.load();
    });

    this.filtersForm.get('isActive')?.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.pageNumber = 1;
      this.load();
    });

    this.load();
  }

  filterRoles(term: string) {
    if (!term) {
      this.filteredRoles = this.roles;
    } else {
      const search = term.toLowerCase();
      this.filteredRoles = this.roles.filter((r) =>
        r.name.toLowerCase().includes(search)
      );
          const exactMatch = this.filteredRoles.find(r => r.name.toLowerCase() === search);
    if (exactMatch) {
      this.showDropdown = false;
      this.filteredRoles = [];
    } else {
      this.showDropdown = true;
    }
    }
    this.showDropdown = true;
  }




  // 🔹 Select role from dropdown
  selectRole(role: { id: string; name: string }) {
    this.filtersForm.patchValue({
      roleSearch: role.name,
      roleId: role.id,
    });
    this.showDropdown = false;
    this.filteredRoles=[];
    this.pageNumber=1;
    this.load();
  }

  // 🔹 Hide dropdown when clicking outside (like user-create)
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const dropdownEl = this.elRef.nativeElement.querySelector('.role-dropdown-container');
    if (dropdownEl && !dropdownEl.contains(event.target)) {
      this.showDropdown = false;
    }
  }
  

onEnterPress(event: Event) {
  const ke = event as KeyboardEvent;
  if (ke.key === 'Enter') {
    ke.preventDefault();
    ke.stopPropagation();

    const activeElement = document.activeElement as HTMLInputElement;
    const isRoleSearch = activeElement?.getAttribute('formcontrolname') === 'roleSearch';
    const val = this.filtersForm.get('roleSearch')?.value?.trim() ?? '';

    if (isRoleSearch) {
      const match = this.roles.find(r => r.name.toLowerCase() === val.toLowerCase());

      if (match) {
        this.filtersForm.patchValue({ roleId: match.id }, { emitEvent: false });
        this.pageNumber=1;
        this.load();
      }else if(val===''){
        this.filtersForm.patchValue({ roleId: null }, { emitEvent: false });
        this.pageNumber=1;
        this.load();
      } else {
        this.filtersForm.patchValue({ roleId: null }, { emitEvent: false });
      }
      this.showDropdown=false;
    }else{

      
      // ✅ Always reload — even if filters are empty
      this.pageNumber = 1;
      this.load();
    }
  }
}

// Prevent invalid characters and multiple/leading spaces
preventInvalidNameInput(event: KeyboardEvent, controlName: string) {
  const isSpace = event.key === ' ' || event.key === 'Spacebar';
  const isLetter = /^[A-Za-z]$/.test(event.key);

  // Block everything except alphabets and space
  if (!isLetter && !isSpace && event.key.length === 1) {
    event.preventDefault();
    return;
  }

  const ctrl = this.filtersForm.get(controlName);
  const value = (ctrl?.value ?? '') as string;

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

preventSpaceInEmail_(event: KeyboardEvent) {
  if (event.key === ' ' || event.key === 'Spacebar') {
    event.preventDefault(); // block space completely
  }
}

// Prevent pasting spaces in the email field
onPasteEmail_(event: ClipboardEvent) {
  const clipboardData = event.clipboardData;
  if (!clipboardData) return;

  const pasted = clipboardData.getData('text');
  // Remove *all* spaces from the pasted text
  const cleaned = pasted.replace(/\s+/g, '');

  event.preventDefault();
  const ctrl = this.form.get('email');
  ctrl?.setValue(cleaned, { emitEvent: false });
}


  // const inputChar = String.fromCharCode(event.charCode);
  allowPhoneCharacters(event: KeyboardEvent) {
  const isSpace = event.key === ' ' || event.key === 'Spacebar';
  const isAllowedChar = /[0-9+\-()]/.test(event.key);

  // Block everything except digits, symbols, and space
  if (!isAllowedChar && !isSpace && event.key.length === 1) {
    event.preventDefault();
    return;
  }

  const ctrl = this.filtersForm.get('phone');
  const value = (ctrl?.value ?? '') as string;

  // Block leading space
  if (isSpace && value.length === 0) {
    event.preventDefault();
    return;
  }

  // Block double spaces
  if (isSpace && value.endsWith(' ')) {
    event.preventDefault();
  }
}

validatePhonePaste(event: ClipboardEvent) {
  event.preventDefault();
  const ctrl = this.filtersForm.get('phone');
  const pastedText = event.clipboardData?.getData('text') ?? '';

  // Allow digits, space, +, -, (, )
  let cleaned = pastedText
    .replace(/[^0-9+\-() ]+/g, '')   // remove invalid chars
    .replace(/\s+/g, ' ')            // collapse multiple spaces
    .trimStart();                    // remove leading space

  ctrl?.setValue(cleaned, { emitEvent: true });
}



  sortBy(field: string) {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDir = 'asc';
    }
    this.pageNumber = 1;
    this.load();
  }



  load() {
    this.loading = true;
    const f = this.filtersForm.value;

    // Parse isActive coming from <select> as string '' | 'true' | 'false'
    let parsedIsActive: boolean | null = null;
    if (f.isActive === '' || f.isActive === null || f.isActive === undefined) {
      parsedIsActive = null;
    } else if (f.isActive === 'true' || f.isActive === true) {
      parsedIsActive = true;
    } else if (f.isActive === 'false' || f.isActive === false) {
      parsedIsActive = false;
    }

    const filters: any = {
      pageNumber: this.pageNumber,
      pageSize: this.pageSize,
      name: f.name,
      email: f.email,
      phone: f.phone,
      roleId: f.roleId || null,

      isActive: parsedIsActive,

      sortField: this.sortField,
      // sortField: "aksdjf",
      sortDirection: this.sortDir,
      // sortDirection: "kasfdj",
    };
this.showDropdown = false;
    this.svc.getPaged(filters).subscribe({
      next: res => {
        this.paged = res;
        this.TotalPages=Math.ceil(this.paged?.totalCount/this.pageSize);
        this.loading = false;
        this.showDropdown = false;
      },
      error: () => {this.loading = false;
        this.showDropdown = false;
      },
    });
  }

  toggleStatus(us:UserListDto ) {
    const original = us.isActive;
    // const user = this.paged?.items.find(u => u.id === us.id);
    // if (!user) return;
    us.isActive = !us.isActive; // 🔄 instantly update local state

    this.svc.toggleStatus(us.id).subscribe({
      next: () => {
        // this.toastService.showSuccess(`User "${us.name}" is now ${us.isActive ? 'Inactive' : 'Active'}.`);
        this.toastService.showSuccess("Role status updated successfully!");
      },
      error: () => {
              us.isActive = original;
      // this.toastService.show("Status update failed.");
      }
    });
  }


  clearFilters() {
    this.filtersForm.reset({
      name: '',
      email: '',
      phone: '',
      roleId: '',
      roleSearch: '',
      isActive: null,
    });
    this.pageNumber = 1;
    this.load();
    
  }
  changePage(page: number) {
    this.pageNumber = page;
    this.load();
  }

  changePageSize(size: number) {
    this.pageSize = size;
    this.pageNumber = 1;
    this.load();
  }
private exportCooldown = false;
exportCsv() {
  // this.svc.exportCsv().subscribe();
  if (this.exportCooldown) return;
  this.exportCooldown = true;
  if (!this.paged?.items?.length) {
    // alert('No data available to export.');
    return;
  }

  this.loading = true; // show loader / disable button

  // build CSV header
  const headers = ['Name', 'Email', 'PhoneNumber', 'Role', 'Status'];
  const rows = this.paged.items.map(u => [
    u.name,
    u.email,
    u.phoneNumber || '',
    u.role || '',
    u.isActive ? 'Active' : 'Inactive',
  ]);

  // build CSV string
  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.map(v => `"${(v ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  // convert to blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `users_page_${this.pageNumber}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  this.toastService.showSuccess('Exported users csv successfully.');
  // ✅ Trigger backend audit log
  this.svc.logExportAudit().subscribe({
    next: () => console.error('Audit log failed'),
    error: (err) => console.error('Audit log failed', err)
  });
   
  // small timeout for UI responsiveness
  this.loading = false;
  setTimeout(()=>{
    this.exportCooldown = false;
  }, 1000);
}


  addUser() {
    this.router.navigate(['/users/create']);
  }

  edit(id: string) {
    this.router.navigate(['/users', id, 'edit']);
  }

  // confirmDelete(id: string) {
  //   if (!confirm('Are you sure you want to delete this user?')) return;
  //   this.svc.delete(id).subscribe(() => this.load());
  // }
    async confirmDelete(id:string, name:string){
    const confirmed = await this.confirmDialog.confirm({
      title:'Delete User',
      message:`Are you sure you want to delete this user"${name}"`,
      confirmText:'Delete',
      cancelText:'Cancel'
    });
    if(confirmed){
      this.svc.delete(id).subscribe(()=>{
        this.toastService.showSuccess('User deleted successfully!');
        this.load();
      },
    );
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
