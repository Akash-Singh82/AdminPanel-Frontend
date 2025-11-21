import { Component, OnInit } from '@angular/core';
import { PermissionDto } from '../../interfaces/permission.model';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RolesService } from '../../services/roles.service';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { RoleDto } from '../../interfaces/role.model';
import { ToastService } from '../../services/toast.service';

interface PermissionGroup {
  key: string;
  permissions: PermissionDto[];
  expanded: boolean;
  allChecked: boolean;
}

@Component({
  selector: 'app-roles-add',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './roles-add.html',
  styleUrls: ['./roles-add.scss']
})
export class RolesAdd implements OnInit {
  form: FormGroup;
  permissionGroups: PermissionGroup[] = [];
  permissions: PermissionDto[] = [];
  checkedIds = new Set<string>();
  loadingPermissions = false;
  saving = false;

  topAllChecked = false;
  topExpanded = false;
  expandAllMode = false;

  constructor(
    private fb: FormBuilder,
    private rolesService: RolesService,
    private router: Router,
    private toastService:ToastService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, this.trimmedMinLength(2), Validators.maxLength(50), 
        // Validators.pattern(/^[A-Za-z\s]+$/)
      ]],
      description: ['', [Validators.required, this.trimmedMinLength(2), Validators.maxLength(50)]],
      isActive: [true],
      permissionChecks: this.fb.group({}, { validators: [this.atLeastOnePermissionSelected] })
    });
  }

  // Custom validator to ensure at least one permission is selected
private atLeastOnePermissionSelected(group: FormGroup) {
  const anySelected = Object.values(group.value).some(v => v === true);
  return anySelected ? null : { noPermissionSelected: true };
}

  trimmedMinLength(min: number) {
  return (control: FormControl) => {
    if (!control.value) return null;
    const trimmed = control.value.trim();
    return trimmed.length >= min ? null : { trimmedMinLength: true };
  };
}


  ngOnInit(): void {
    this.loadPermissions();
  }

  loadPermissions() {
    this.loadingPermissions = true;
    this.rolesService.getPermissions()
      .pipe(finalize(() => this.loadingPermissions = false))
      .subscribe({
        next: (perms) => this.buildGroups(perms),
        error: (err) => console.error('Failed to load permissions', err)
      });
  }

  private buildGroups(perms: PermissionDto[]) {
    const map = new Map<string, PermissionDto[]>();

    perms.forEach(p => {
      let key = '';
      if (p.name.includes('.')) key = p.name.split('.')[0].trim();
      else if (p.name.includes(':')) key = p.name.split(':')[0].trim();
      else key = p.name.split(' ')[0].trim() || p.name;

      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });

    this.permissionGroups = Array.from(map.entries())
      .map(([key, permissions]) => ({
        key,
        permissions: permissions.sort((a, b) => a.name.localeCompare(b.name)),
        expanded: false,
        allChecked: false
      }))
      .sort((a, b) => a.key.localeCompare(b.key));

    const group = this.form.get('permissionChecks') as FormGroup;
    this.permissionGroups.forEach(pg => {
      pg.permissions.forEach(p => {
        group.addControl(p.id.toString(), new FormControl(false));
      });
    });

    group.valueChanges.subscribe(() => group.updateValueAndValidity());

  }



  isChecked(permissionId: number): boolean {
  const group = this.form.get('permissionChecks') as FormGroup;
  return !!group.get(permissionId.toString())?.value;
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


  // ✅ Helper method (added)
  getPermissionControl(id: string): FormControl {
    return (this.form.get('permissionChecks') as FormGroup).get(id) as FormControl;
  }

  // toggleCheckAll() {
  //   this.topAllChecked = !this.topAllChecked;
  //   const group = this.form.get('permissionChecks') as FormGroup;
  //   Object.keys(group.controls).forEach(key => group.get(key)!.setValue(this.topAllChecked));
  //   this.permissionGroups.forEach(pg => pg.allChecked = this.topAllChecked);
  // }

  // toggleExpandAll() {
  //   this.topExpanded = !this.topExpanded;
  //   this.permissionGroups.forEach(pg => pg.expanded = this.topExpanded);
  // }

  toggleGroupCheck(pg: PermissionGroup) {
    pg.allChecked = !pg.allChecked;
    const group = this.form.get('permissionChecks') as FormGroup;
    pg.permissions.forEach(p => group.get(p.id.toString())!.setValue(pg.allChecked));
    this.topAllChecked = this.anyUnchecked() ? false : true;
  }

  toggleCheckAll() {
  const group = this.form.get('permissionChecks') as FormGroup;
  const allCheckedNow = Object.values(group.value).every(v => v === true);

  // Toggle opposite of current state
  const newValue = !allCheckedNow;
  this.topAllChecked = newValue;

  // Set all permissions
  Object.keys(group.controls).forEach(key => group.get(key)!.setValue(newValue, { emitEvent: false }));

  // Update each group state
  this.permissionGroups.forEach(pg => pg.allChecked = newValue);
}

toggleExpandAll() {
  // Determine if any group is currently collapsed
  const anyCollapsed = this.permissionGroups.some(pg => !pg.expanded);

  // Expand all if any is collapsed; otherwise collapse all
  const newExpandedState = anyCollapsed;
  this.topExpanded = newExpandedState;

  this.permissionGroups.forEach(pg => pg.expanded = newExpandedState);
}

  permissionChanged(pg: PermissionGroup) {
    const group = this.form.get('permissionChecks') as FormGroup;
    const allChecked = pg.permissions.every(p => !!group.get(p.id.toString())!.value);
    pg.allChecked = allChecked;
    this.topAllChecked = !this.anyUnchecked();
  }

  private anyUnchecked(): boolean {
    const group = this.form.get('permissionChecks') as FormGroup;
    return Object.keys(group.controls).some(key => !group.get(key)!.value);
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


  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.show("Invalid form. Please correct the errors.")
      return;   
    }

  
    this.saving = true;
    const permissionGroup = this.form.get('permissionChecks') as FormGroup;
    
    const selectedPermissionIds = Object.entries(permissionGroup.value)
      .filter(([_, checked]) => checked)
      .map(([id, _]) => id);
    
    const dto: RoleDto = {
      name: this.form.value.name.trim(),
      description: this.form.value.description.trim(),
      isActive: !!this.form.value.isActive,
      permissionIds: selectedPermissionIds
      
    };

    this.rolesService.createRole(dto)
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: () => {
          // alert('Role created successfully');
         
          this.router.navigate(['/roles']);
          setTimeout(()=>this.toastService.showSuccess('Role Created successfully!'),500);
        },
        error: (err) => {
          console.error(err);
          // alert(err?.error?.message || 'Failed to create role.');
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
