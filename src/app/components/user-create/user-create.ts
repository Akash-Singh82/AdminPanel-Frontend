import { Component, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UsersService } from '../../services/users.service';
import { emailRemoteValidator } from '../../validators/email-remote.validator';
import { passwordValidator } from '../../validators/password.validator';
import { Auth } from '../../services/auth';
import { ToastService } from '../../services/toast.service';
import { fileValidator } from '../../validators/file.validator';


interface Country {
  name: string;
  code: string;
  iso: string;
}

@Component({
  selector: 'app-user-create',
  templateUrl: './user-create.html',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
})
export class UserCreateComponent implements OnInit, OnDestroy {
  form!: ReturnType<FormBuilder['group']>;
  roles: Array<{ id: string; name: string }> = [];
  filteredRoles: Array<{ id: string; name: string }> = [];
  showDropdown = false;

  selectedFile?: File;
  previewUrl?: string | ArrayBuffer | null;
  activeIndex=-1;
  selectedCountry: Country = { name: 'India', code: '+91', iso: 'IN' };
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
    private fb: FormBuilder,
    private svc: UsersService,
    private router: Router,
    private auth: Auth,
    private elRef: ElementRef,
    private toastService: ToastService
  ) { }

  canAssignSuperAdmin = false;

  ngOnInit() {

    this.canAssignSuperAdmin = this.auth.isSuperAdmin();
  
    // Initialize form
    this.form = this.fb.group({

      firstName: [
        '',
        [
          Validators.required,
          this.trimmedMinLength(2), // at least 2 non-space characters
          Validators.maxLength(50),
          Validators.pattern(/^[A-Za-z]+(?: [A-Za-z]+)*$/), // only letters & single spaces between words
        ],
      ],
      lastName: [
        '',
        [
          Validators.required,
          this.trimmedMinLength(2),
          Validators.maxLength(50),
          Validators.pattern(/^[A-Za-z]+(?: [A-Za-z]+)*$/),
        ],
      ],
      email: [
        '',
        [Validators.required, Validators.email],
        [emailRemoteValidator(this.auth, 1000)],
      ],
      phoneNumber: [
        '',
        [Validators.required, Validators.pattern(/^\d{10,15}$/)],
      ],
      roleSearch: ['',[Validators.required, this.roleSearchValidator]],
      roleId: ['', Validators.required],
      isActive: [true],
      password: ['', [Validators.required, passwordValidator()]],
      profileImage:[null,[fileValidator(['jpg','jpeg','png','jfif','tif'],5)]]
    });

    // Load roles
    this.svc.getRolesSimple().subscribe((roles) => {
      this.roles = roles;
      if (!this.auth.canAssignSuperAdmin()) {
        this.roles = this.roles.filter(
          (r) => r.name.toLowerCase() !== 'superadmin'
        );
      }
      // this.filteredRoles = roles;
this.filteredRoles = [...this.roles];  

      //  Setup search behavior
      const roleSearchCtrl = this.form.get('roleSearch');
      if (roleSearchCtrl) {
        roleSearchCtrl.valueChanges.subscribe((value: string) => {
          if (value) {
            this.filterRoles(value);
            this.showDropdown = true; //  Always show dropdown while typing
          } else {
            // this.filteredRoles = this.roles;
            this.filteredRoles = this.roles.filter(r =>
  r.name.toLowerCase().includes((value ?? '').toLowerCase())
);
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
  }

  onRoleBlur() {
  const value = this.form.get('roleSearch')?.value?.trim();
  if (!value) {
    this.form.patchValue({ roleId: null });
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
    // Mark invalid
    this.form.patchValue({ roleId: null });
    this.form.get('roleSearch')?.setErrors({ roleNotFound: true });
  }
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



// replace the existing roleSearchValidator method with this
roleSearchValidator = (control: AbstractControl): ValidationErrors | null => {
  // If control has no parent yet (form building stage) defer (no error)
  const parent = control.parent as AbstractControl | null;
  if (!parent) return null;

  const roleId = parent.get('roleId')?.value;
  const value = control.value;

  // If roleId is set (user selected a valid role) it's valid
  if (roleId) {
    // ensure any previous error is cleared
    control.setErrors(null);
    return null;
  }

  // If user typed exact role name that exists, auto-fill roleId and accept
  if (typeof value === 'string' && value.trim().length > 0) {
    const match = this.roles.find(r => r.name.toLowerCase() === value.trim().toLowerCase());
    if (match) {
      parent.patchValue({ roleId: match.id }, { emitEvent: false });
      control.setErrors(null);
      return null;
    }
    // typed value but not matched -> mark as not found
    return { roleNotFound: true };
  }

  // empty or other cases -> required
  return { required: true };
};





trimmedMinLength(min: number) {
  return (control: any) => {
    if (!control.value) return null;
    const trimmed = control.value.trim();
    return trimmed.replace(/\s/g, '').length >= min
      ? null
      : { trimmedMinLength: true };
  };
}


removeEmojis(event: Event, controlName: string) {
  const input = event.target as HTMLInputElement;
  const ctrl = this.form.get(controlName);
  if (!ctrl) return;

  const noEmojiValue = input.value.replace(/[\p{Emoji}\p{Extended_Pictographic}]/gu, '');
  if (noEmojiValue !== input.value) {
    input.value = noEmojiValue;
    ctrl.setValue(noEmojiValue, { emitEvent: false });
  }
}




  // ✅ Filter roles
  filterRoles(term: string) {
    const search = term.toLowerCase();
    this.filteredRoles = this.roles.filter((r) =>
      r.name.toLowerCase().includes(search)
    );
    this.activeIndex = this.filteredRoles.length ? 0 : -1;
  }

  // ✅ Select a role from dropdown
  selectRole(role: { id: string; name: string }) {
    this.form.patchValue({
      roleSearch: role.name,
      roleId: role.id,
    },{emitEvent:false});
    this.showDropdown = false;
    this.form.get('rolesearch')?.updateValueAndValidity();
  }

  // Prevent typing spaces anywhere in the email field
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


  // ✅ Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const container = this.elRef.nativeElement.querySelector('.role-dropdown-container');
    if (container && !container.contains(event.target)) {
      this.showDropdown = false;
    }
  }

  // Utility methods (no change)
  onCountryChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const code = select.value;
    const country = this.countries.find((c) => c.code === code);
    if (country) this.selectedCountry = country;
  }

  allowOnlyDigits(event: KeyboardEvent) {
    const char = String.fromCharCode(event.which || event.keyCode);
    if (!/[0-9]/.test(char)) event.preventDefault();
  }



  // onFileChange(e: Event) {
  //   const input = e.target as HTMLInputElement;
  //   if (input.files && input.files.length) {
  //     this.selectedFile = input.files[0];
  //     const reader = new FileReader();
  //     reader.onload = () => (this.previewUrl = reader.result);
  //     reader.readAsDataURL(this.selectedFile);
  //   } else {
  //     this.selectedFile = undefined;
  //     this.previewUrl = undefined;
  //   }
  // }

  onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;

  if (!input.files || input.files.length === 0) {
    this.form.get('profileImage')?.setValue(null);
     this.selectedFile=undefined;
    this.previewUrl = null;
    return;
  }

  const file = input.files[0];
  this.selectedFile = file;
   const control = this.form.get('profileImage');
  control?.setValue(file);
  control?.markAsTouched();
  control?.updateValueAndValidity();

  
  const reader = new FileReader();
  reader.onload = () => (this.previewUrl = reader.result);
  reader.readAsDataURL(file);
}




  trimLeadingSpaces(controlName: string) {
    const control = this.form.get(controlName);
    if (control) {
      const trimmed = control.value.replace(/^\s+/, '');
      if (trimmed !== control.value) {
        control.setValue(trimmed, { emitEvent: false });
      }
    }
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

  let value = input.value || '';

  // 1️⃣ Remove invalid characters
  value = value.replace(/[^A-Za-z ]+/g, '');

  // 2️⃣ Collapse multiple spaces to single
  value = value.replace(/\s+/g, ' ');

  // 3️⃣ Remove leading space
  value = value.replace(/^\s+/, '');

  // 4️⃣ Limit to 50 chars
  if (value.length > 50) value = value.slice(0, 50);

  if (value !== input.value) {
    input.value = value;
    ctrl.setValue(value, { emitEvent: false });
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

 isSubmitting=false;
  submit() {
    this.form.markAllAsTouched();
    this.onRoleBlur();
    if (this.form.invalid){
        this.form.markAllAsTouched();
        this.toastService.show("Invalid form. Please correct the errors.");
        return;
    }
   this.isSubmitting=true;
    const val = this.form.value;
    Object.keys(val).forEach((key) => {
      if (typeof val[key] === 'string') {
        val[key] = val[key].trim();
      }
    });
    const dto = {
      ...val,
      phoneNumber: this.selectedCountry.code + ' ' + val.phoneNumber,
    };

    this.svc.create(dto, this.selectedFile).subscribe({
      next: () =>{
        setTimeout(()=>this.toastService.showSuccess('User created successfully!'),500);
        this.router.navigate(['/users']);
        this.isSubmitting=false;
      },
      error:()=>{
        this.isSubmitting=false;
      } 

    });
  }

  ngOnDestroy() { }
}


