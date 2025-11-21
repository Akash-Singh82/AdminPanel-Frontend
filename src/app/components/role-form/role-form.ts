import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RolesService } from '../../services/roles.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PermissionDto } from '../../interfaces/permission.model';
import { RoleDto } from '../../interfaces/role.model';
import { Auth } from '../../services/auth';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialog } from '../../shared/error-dialog/error-dialog'; // adjust path as needed
import { ToastService } from '../../services/toast.service';
import { finalize } from 'rxjs';

interface PermissionGroup {
  groupName: string;
  permissions: PermissionDto[];
  expanded?: boolean;
}

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './role-form.html',
  styleUrls: ['./role-form.scss']
})
export class RoleForm implements OnInit {
  id!: string;
  form!: FormGroup;
  permissions: PermissionDto[] = [];
  groups: PermissionGroup[] = [];
  checkedIds = new Set<string>();
  expandAllMode = false;
  saving = false;


  constructor(
    private fb: FormBuilder,
    private rolesService: RolesService,
    private route: ActivatedRoute,
    private router: Router,
    private auth: Auth,
    private confirmDialogService: ConfirmDialogService,
    private dialog: MatDialog,
    private toastService:ToastService
  ) { }

  ngOnInit() {
    this.buildForm();
    this.id = this.route.snapshot.params['id'];

    if (this.id) this.loadForEdit(this.id);
    this.rolesService.getPermissions().subscribe(perms => {
      this.permissions = perms;
      this.buildGroups();
    });
  }

  private buildForm() {
    this.form = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          this.trimmedMinLength(2),
          Validators.maxLength(50),
          // Validators.pattern(/^[A-Za-z\s]+$/)
        ]
      ],
      description: ['',
         [
          Validators.required,
          this.trimmedMinLength(2),
          Validators.maxLength(50),
          // Validators.pattern(/^[A-Za-z\s]+$/)
        ]
      ],
      isActive: [true]
    });
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
  
  const ctrl = this.form.get(controlName);
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
  const ctrl = this.form.get(controlName);
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


  trimmedMinLength(min: number) {
  return (control: any) => {
    if (!control.value) return null;
    const trimmed = control.value.trim();
    return trimmed.length >= min ? null : { trimmedMinLength: true };
  };
}


  buildGroups() {
    const map = new Map<string, PermissionDto[]>();
    for (const p of this.permissions) {
      const key = (p.name || '').split(/[.\s:\-\\/]/)[0].trim() || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }

    this.groups = Array.from(map.entries()).map(([k, v]) => ({
      groupName: k,
      permissions: v.sort((a, b) => a.name.localeCompare(b.name)),
      expanded: false
    }));
  }

  loadForEdit(id: string) {
    this.rolesService.getRole(id).subscribe(res => {
      this.form.patchValue({
        name: res.name,
        description: res.description || '',
        isActive: res.isActive
      });
      this.checkedIds = new Set(res.permissionIds.map(pid => pid.toString()));
    });
  }

  togglePermission(id: string) {
    if (this.checkedIds.has(id)) this.checkedIds.delete(id);
    else this.checkedIds.add(id);
    if (this.checkedIds.size > 0) this.noPermission = false;
  }

  isChecked(id: string) {
    return this.checkedIds.has(id);
  }

  toggleCheckAll() {
    
    const anyUnchecked = this.permissions.some(p => !this.checkedIds.has(p.id));
    if (anyUnchecked) {
      for (const p of this.permissions) this.checkedIds.add(p.id);
    } else {
      this.checkedIds.clear();
    }
    if (this.checkedIds.size > 0) this.noPermission = false;
  }

  toggleExpandAll() {
    this.expandAllMode = this.groups.some(g => !g.expanded);
    for (const g of this.groups) g.expanded = this.expandAllMode;
  }

  preventLeadingSpace(event: KeyboardEvent, controlName: string) {
    // Some browsers use ' ' and older ones 'Spacebar'
    const isSpaceKey = event.key === ' ' || event.key === 'Spacebar';
    if (!isSpaceKey) return;

    const ctrl = this.form.get(controlName);
    const value = ctrl?.value ?? '';

    // if the current value is empty (or only spaces) block the leading space
    if (!value || value.length === 0) {
      event.preventDefault();
    }
  }

  // Handle paste: strip leading spaces from pasted text if control is empty
  onPaste(event: ClipboardEvent, controlName: string) {
    const ctrl = this.form.get(controlName);
    const value = ctrl?.value ?? '';

    // If there's already content, allow paste as-is
    if (value && value.length > 0) return;

    // Otherwise, get pasted text, strip leading whitespace, and insert
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const pasted = clipboardData.getData('text');
    const cleaned = pasted.replace(/^\s+/, ''); // remove leading spaces

    // Prevent the default paste and manually insert cleaned text
    event.preventDefault();
    // setValue without emitting valueChanges (avoid infinite loops)
    ctrl?.setValue(cleaned, { emitEvent: false });
  }

  // Extra safeguard for mobile/IME where leading spaces might appear
  removeLeadingSpacesIfNeeded(controlName: string) {
    const ctrl = this.form.get(controlName);
    if (!ctrl) return;

    const value: string = ctrl.value ?? '';
    if (!value) return;

    // If the control currently has zero non-space characters at the start,
    // remove any leading whitespace but keep other spaces.
    // We only trim leading whitespace — rest of the string remains unchanged.
    const trimmedLeading = value.replace(/^\s+/, '');
    if (trimmedLeading !== value) {
      // Keep caret behavior simple by not emitting events while we clean
      ctrl.setValue(trimmedLeading, { emitEvent: false });
    }
  }
get isSaveDisabled(): boolean {
  return this.form.invalid || this.checkedIds.size === 0 || this.saving;
}
  noPermission=false;
  save() {
     this.noPermission=false;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.form.markAllAsDirty();
      
      this.toastService.show("Invalid form. Please correct the errors.");
      return;
    }
    if(this.checkedIds.size===0){
      this.noPermission=true;
      this.toastService.show("Invalid form. Please correct the errors.");
      return;
    }

    const dto: RoleDto = {
      name: this.form.value.name,
      description: this.form.value.description,
      isActive: this.form.value.isActive,
      permissionIds: Array.from(this.checkedIds)
      
    };



    const obs = this.rolesService.updateRole(this.id, dto)


    this.saving = true;
    obs
    .pipe(finalize(()=>this.saving=false)).subscribe({
     
          next: () => {
      const currentRoleNames = this.auth.getRoles();
      const currentRoleId = this.id;
      // If the current user's role matches the one just updated:
      if (currentRoleNames.some(r => r === this.form.value.name)) {
        // Refresh token & permissions
        this.auth.refreshAfterRoleUpdate().subscribe({
          next: () => {
            this.router.navigate(['/roles']);
          },
          error: () => {
            this.router.navigate(['/login']);
          }
        });
      } else {
        this.router.navigate(['/roles']);
      }
      setTimeout(()=>this.toastService.showSuccess('Role updated successfully!'), 500);
    },
    error: () => {
      this.saving = false;
    }
    });
  }



  cancel() {
    this.router.navigate(['/roles']);
  }
  onEnterPress(event: Event) {
  const e = event as KeyboardEvent;
  e.preventDefault();
}

}
