import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UsersService } from '../../services/users.service';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { passwordValidator } from '../../validators/password.validator';
import { Auth } from '../../services/auth';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../services/toast.service';
import { fileValidator } from '../../validators/file.validator';


interface Country {
  name: string;
  code: string; // dial code
  iso: string;
}

@Component({
  selector: 'app-user-edit',
  templateUrl: './user-edit.html',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule]
})
export class UserEditComponent implements OnInit {
  id!: string;
  roles: Array<{ id: string; name: string }> = [];
  selectedFile?: File;
  previewUrl?: string | ArrayBuffer | null;
  existingImage?: string | null;
  form!: ReturnType<FormBuilder['group']>;
  filteredRoles: Array<{ id: string; name: string }> = [];
  showDropdown = false;
initializing:boolean = true;
  selectedCountry: Country = { name: 'India', code: '+91', iso: 'IN' };
  loading=false;

  countries: Country[] = [
    { name: 'India', code: '+91', iso: 'IN' },
    { name: 'United States', code: '+1', iso: 'US' },
    { name: 'United Kingdom', code: '+44', iso: 'GB' },
    { name: 'Canada', code: '+1', iso: 'CA' },
    { name: 'Australia', code: '+61', iso: 'AU' },
    { name: 'Germany', code: '+49', iso: 'DE' },
    { name: 'France', code: '+33', iso: 'FR' },
  ];

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private svc: UsersService,
    private router: Router,
    public auth: Auth,
    private elRef: ElementRef,
    private toastService: ToastService
  ) { }
  ngOnInit() {
    this.loading=true;
    this.form = this.fb.group({
      firstName: ['', [Validators.required, this.trimmedMinLength(2), Validators.maxLength(50),Validators.pattern(/^[A-Za-z]+(?: [A-Za-z]+)*$/),]],
      lastName: ['', [Validators.required, this.trimmedMinLength(2), Validators.maxLength(50), Validators.pattern(/^[A-Za-z]+(?: [A-Za-z]+)*$/),]],
      email: [{ value: '', disabled: true }],
      phoneNumber: [
        '', // default value includes '+'
        [
          Validators.required,
          Validators.pattern(/^\d{10,15}$/),
        ]
      ],
      roleSearch: ['',[Validators.required, this.roleSearchValidator]],
      roleId: ['', Validators.required],
      isActive: [true],
      emailConfirmed: [true],
      resetPassword: ['', [passwordValidator()]],
      profileImage:[null,[fileValidator(['jpg','jpeg','png','jfif','tif'],5)]]

    },
      { updateOn: 'change' }
    );




    this.id = this.route.snapshot.paramMap.get('id')!;
    // this.svc.getRolesSimple().subscribe(r => this.roles = r);
    this.svc.getRolesSimple().subscribe((roles) => {

      this.roles = roles;
      if (!this.auth.canAssignSuperAdmin()) {
          this.roles = this.roles.filter(
            (r) => r.name.toLowerCase() !== 'superadmin'
          );
        }

      this.filteredRoles = roles;

      const roleSearchCtrl = this.form.get('roleSearch');
      if (roleSearchCtrl) {
        roleSearchCtrl.valueChanges.subscribe((value: string) => {
          if(this.initializing) {
            this.initializing=false;
            return;
          }
          if (value) {
            this.filterRoles(value);
            this.showDropdown = true;
          } else {
            this.filteredRoles = this.roles;
            this.showDropdown = false;
          }

          const match = this.roles.find(
            (r) => r.name.toLowerCase() === value?.toLowerCase()
          );
          if (match) {
            this.form.patchValue({ roleId: match.id }, { emitEvent: false });
          } else {
            this.form.patchValue({ roleId: null }, { emitEvent: false });
          }
        });


      }
    });

    this.svc.get(this.id).subscribe(d => {

      // Detect country from phone number
      let phoneNumber = d.phoneNumber || '';
      let matchedCountry = this.countries.find(c => phoneNumber.startsWith(c.code));

      if (matchedCountry) {
        this.selectedCountry = matchedCountry;
        // Remove the country code and possible space
        phoneNumber = phoneNumber.replace(matchedCountry.code, '').trim();
      }

      this.form.patchValue({
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email,
        phoneNumber: phoneNumber,
        roleId: d.roleId,
        isActive: d.isActive,
        // emailConfirmed: d.isEmailConfirmed // backend should provide current state if you add it
      });


      const matchedRole= this.roles.find(r=>r.id===d.roleId);
      if(matchedRole){
        this.form.patchValue({roleSearch:matchedRole.name});
      }

      // this.existingImage = d.profileImagePath;
      this.existingImage = d.profileImagePath
        ? (d.profileImagePath.startsWith('http')
          ? d.profileImagePath
          : `${environment.apiUrl}${d.profileImagePath}`)
        : null;

        this.loading=false;
    },
  ()=>{

    this.loading=false;
  });
  }


activeIndex=0;

selectRole(role: { id: string; name: string }) {
  this.form.patchValue({
    roleSearch: role.name,
    roleId: role.id,
  });
  this.showDropdown = false;

  // Clear validation error
  const roleCtrl = this.form.get('roleSearch');
  if (roleCtrl?.errors?.['roleNotFound']) {
    roleCtrl.updateValueAndValidity(); // re-run validator
  }
  // DON'T clear filteredRoles here - keep it for validation check
  // this.filteredRoles=[];  // REMOVE THIS LINE
}

onRoleBlur() {
  // Add a small delay to allow mousedown to fire first
  setTimeout(() => {
    const value = this.form.get('roleSearch')?.value?.trim();
    if (!value) {
      this.form.patchValue({ roleId: null });
      this.showDropdown = false;
      return;
    }

    // Find exact role match
    const match = this.roles.find(
      r => r.name.toLowerCase() === value.toLowerCase()
    );

    if (match) {
      // Auto-select on blur
      this.selectRole(match);
    } else {
      // Mark invalid only if roleId is not already set
      if (!this.form.get('roleId')?.value) {
        this.form.patchValue({ roleId: null });
        this.form.get('roleSearch')?.setErrors({ roleNotFound: true });
      }
    }
    this.showDropdown = false;
  }, 150);
}

private roleSearchValidator(control: AbstractControl): ValidationErrors | null {
  const parent = control.parent;
  if (!parent) return null;
  
  const roleId = parent.get('roleId')?.value;
  const searchValue = control.value;

  // If roleId is set, validation passes
  if (roleId) {
    return null;
  }

  // If search field is empty
  if (!searchValue || searchValue.trim().length === 0) {
    return { required: true };
  }

  // If user typed something but roleId is not set
  return { roleNotFound: true };
}

onRoleFocus() {
  const currentValue = this.form.get('roleSearch')?.value?.trim() ?? '';
  this.showDropdown = true;
  // Show all roles if input is empty, otherwise filter by typed value
  this.filteredRoles = currentValue ? 
                       this.roles.filter(r => r.name.toLowerCase().includes(currentValue.toLowerCase()))
                       : [...this.roles];
  this.activeIndex = 0;
}


onRoleKeyDown(event: KeyboardEvent) {
  if (!this.showDropdown) return;

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    if (this.activeIndex < this.filteredRoles.length - 1) {
      this.activeIndex++;
    }
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault();
    if (this.activeIndex > 0) {
      this.activeIndex--;
    }
  }

  if (event.key === 'Enter') {
    event.preventDefault();
    if (this.filteredRoles[this.activeIndex]) {
      this.selectRole(this.filteredRoles[this.activeIndex]);
    }
  }
}



  trimmedMinLength(min: number) {
  return (control: any) => {
    if (!control.value) return null;
    const trimmed = control.value.trim();
    return trimmed.length >= min ? null : { trimmedMinLength: true };
  };
}


  filterRoles(term: string) {
    const search = term.toLowerCase();
    this.filteredRoles = this.roles.filter((r) => {
      return r.name.toLocaleLowerCase().includes(search)
    });
  }



  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const container = this.elRef.nativeElement.querySelector('.role-dropdown-container');
    if (container && !container.contains(event.target)) {
      this.showDropdown = false;
    }
  }

  // when user selects a country from dropdown
  onCountryChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const code = select.value;
    const country = this.countries.find((c) => c.code === code);
    if (country) {
      this.selectedCountry = country;
    }
  }

  allowOnlyDigits(event: KeyboardEvent) {
    const char = String.fromCharCode(event.which || event.keyCode);
    if (!/[0-9]/.test(char)) {
      event.preventDefault();
    }
  }


  isImageChanged: boolean = false;


  onFileChange(e:Event){
    const input = e.target as HTMLInputElement;
    if(!input.files || !input.files.length){
      this.form.get('profileImage')?.setValue(null);
       this.selectedFile=undefined;
      this.previewUrl = null;
      return;
    }
    const file = input.files[0];
    this.selectedFile = file;
    const control = this.form.get('profileImage');
    if(control){
      control.setValue(file);
      control.markAsTouched();
      control.updateValueAndValidity();
    }

    const reader = new FileReader();
    reader.onload = () => this.previewUrl = reader.result;
    reader.readAsDataURL(file);
    this.isImageChanged = true;
  }




preventLeadingSpace(event: KeyboardEvent, controlName: string) {
  const isSpaceKey = event.key === ' ' || event.key === 'Spacebar';
  const isLetter = /^[A-Za-z]$/.test(event.key);

  // Allow only letters or space
  if (!isLetter && !isSpaceKey && event.key.length === 1) {
    event.preventDefault();
    return;
  }

  const ctrl = this.form.get(controlName);
  const value = (ctrl?.value ?? '') as string;

  // 1️⃣ Block if space is first character
  if (isSpaceKey && (!value || value.length === 0)) {
    event.preventDefault();
    return;
  }

  // 2️⃣ Block if previous character is a space (no double spaces)
  if (isSpaceKey && value.endsWith(' ')) {
    event.preventDefault();
  }
}


onNameInput(event: Event, controlName: string) {
  const input = event.target as HTMLInputElement;
  const ctrl = this.form.get(controlName);
  if (!ctrl) return;

  const raw = input.value ?? '';

  // 1️⃣ Remove anything that’s not letter or space
  // 2️⃣ Collapse multiple spaces to single
  // 3️⃣ Remove leading spaces
  let cleaned = raw.replace(/[^A-Za-z ]+/g, '')
                   .replace(/\s+/g, ' ')
                   .replace(/^\s+/, '');

  if (cleaned.length > 50) cleaned = cleaned.slice(0, 50);

  if (cleaned !== raw) {
    ctrl.setValue(cleaned, { emitEvent: false });
    input.value = cleaned;
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

  onPasteName(event: ClipboardEvent, controlName: string) {
  event.preventDefault();
  const ctrl = this.form.get(controlName);
  const clipboardData = event.clipboardData;
  if (!ctrl || !clipboardData) return;

  let pasted = clipboardData.getData('text') ?? '';
  let cleaned = pasted.replace(/[^A-Za-z ]+/g, '')
                      .replace(/\s+/g, ' ')
                      .replace(/^\s+/, '')
                      .replace(/\s+$/, '');
  if (cleaned.length > 50) cleaned = cleaned.slice(0, 50);

  ctrl.setValue(cleaned, { emitEvent: true });
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



  
  submit() {
  this.form.markAllAsTouched();
  this.onRoleBlur();
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    this.toastService.show("Invalid form. Please correct the errors.");
    return;
  };

   this.loading=true;
  const val = this.form.getRawValue();
  Object.keys(val).forEach((key) => {
    if (typeof val[key] === 'string') {
      val[key] = val[key].trim();
    }
  });

  const dto = {
    firstName: val.firstName,
    lastName: val.lastName,
    phoneNumber: this.selectedCountry.code + ' ' + val.phoneNumber,
    roleId: val.roleId,
    isActive: val.isActive,
    emailConfirmed: val.emailConfirmed,
    resetPassword: val.resetPassword || null,
    isImageChanged: this.isImageChanged
  };

  this.svc.update(this.id, dto, this.selectedFile).subscribe({
    next: () => {
      const currentUserId = this.auth.getUserId();
     

      // ✅ if user updated their own role
      if (currentUserId && currentUserId === this.id) {
        // logout and re-login with saved credentials
        this.auth.logout().subscribe({
          next: () => {
            this.auth.autoLogin().subscribe({
              next: (success) => {
                if (success) {
                  // refresh permissions after login
                  this.auth.refreshPermissions().subscribe({
                    next: () => {
                      const hasUserList = this.auth.hasPermission('Users.List');
                      // ✅ navigate based on permission
                      if (hasUserList) {
                        this.router.navigate(['/users']);
                      } else {
                        this.router.navigate(['/dashboard']);
                      }
                    },
                    error: (err) => {
                      console.warn('Failed to refresh permissions after role change', err);
                      this.router.navigate(['/dashboard']);
                    }
                  });
                } else {
                  // couldn't auto-login
                  this.router.navigate(['/login']);
                }
              }
            });
          }
        });
      } else {
        // normal update for other users
        this.router.navigate(['/users']);
      }
      this.loading=false;
       setTimeout(()=>this.toastService.showSuccess('User updated successfully!'),500);
    },
    error: () => {
      this.loading=false;
    }
  });
}

}




  // selectRoleOnEnter(event: any) {
//   event.preventDefault();
//   const searchValue = this.form.get('roleSearch')?.value?.trim();
  
//   if (searchValue) {
//     // Find exact match (case-insensitive)
//     const exactMatch = this.filteredRoles.find(
//       role => role.name.toLowerCase() === searchValue.toLowerCase()
//     );
    
//     if (exactMatch) {
//       this.selectRole(exactMatch);
//     }
//   }
// }