import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../services/users.service';
import { Auth } from '../../services/auth';
import { passwordValidator } from '../../validators/password.validator';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';
import { fileValidator } from '../../validators/file.validator';

interface Country {
  name: string;
  code: string;
  iso: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
})
export class Profile implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  userId!: string;
  loading = true;
  selectedFile?: File;
  previewUrl?: string | ArrayBuffer | null;
  existingImage?: string | null;
  isImageChanged = false;
  roles: Array<{ id: string; name: string }> = [];
  roleId: string = '';

  // ✅ Country selection setup (same as user-edit)
  countries: Country[] = [
    { name: 'India', code: '+91', iso: 'IN' },
    { name: 'United States', code: '+1', iso: 'US' },
    { name: 'United Kingdom', code: '+44', iso: 'GB' },
    { name: 'Canada', code: '+1', iso: 'CA' },
    { name: 'Australia', code: '+61', iso: 'AU' },
    { name: 'Germany', code: '+49', iso: 'DE' },
    { name: 'France', code: '+33', iso: 'FR' },
  ];
  selectedCountry: Country = { name: 'India', code: '+91', iso: 'IN' };

  constructor(
    private fb: FormBuilder,
    private userSvc: UsersService,
    public auth: Auth,
    private elRef: ElementRef,
    private router: Router,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.userId = this.auth.getUserId()!;

    this.userSvc.getRolesSimple().subscribe((roles) => {

      this.roles = roles;
    },);
    // Profile form (same validation as edit)
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, this.trimmedMinLength(2), Validators.maxLength(50), Validators.pattern(/^[A-Za-z]+(?: [A-Za-z]+)*$/),]],
      lastName: ['', [Validators.required, this.trimmedMinLength(2), Validators.maxLength(50), Validators.pattern(/^[A-Za-z]+(?: [A-Za-z]+)*$/),]],
      email: [{ value: '', disabled: true }],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{10,15}$/)]],
      isActive: [{ value: false, disabled: true }],
      roleName: [{ value: '', disabled: true }],

      profileImage: [null, [fileValidator(['jpg', 'jpeg', 'png', 'jfif', 'tif'], 5)]]
    });

    // Password form
    this.passwordForm = this.fb.group({
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, passwordValidator()]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: this.passwordMatch });




    // Load user details
    this.userSvc.get(this.userId).subscribe({
      next: (user) => {
        // Detect country from number
        let phoneNumber = user.phoneNumber || '';
        let matchedCountry = this.countries.find(c => phoneNumber.startsWith(c.code));
        if (matchedCountry) {
          this.selectedCountry = matchedCountry;
          phoneNumber = phoneNumber.replace(matchedCountry.code, '').trim();
        }

        this.profileForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: phoneNumber,
          isActive: user.isActive,
          roleName: user.roleName,
        });

        this.existingImage = user.profileImagePath
          ? (user.profileImagePath.startsWith('http')
            ? user.profileImagePath
            : `${environment.apiUrl}${user.profileImagePath}`)
          : null;

        const matchedRole = this.roles.find(r => r.id === user.roleId);
        //  this.roleId!=matchedRole?.id;
        this.roleId = user.roleId ?? '';
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }


  allowOnlyDigits(event: KeyboardEvent) {
    const char = String.fromCharCode(event.which || event.keyCode);
    if (!/[0-9]/.test(char)) {
      event?.preventDefault();
    }
  }
  onPasteDigitsOnly(event: ClipboardEvent) {
  const pastedText = event.clipboardData?.getData('text') ?? '';
  if (!/^\d+$/.test(pastedText)) {
    event.preventDefault(); // Block invalid paste
    const cleaned = pastedText.replace(/\D+/g, ''); // keep only digits

    // Insert cleaned digits manually
    const input = event.target as HTMLInputElement;
    input.value = cleaned;

    // Update form control
    this.profileForm.get('phoneNumber')?.setValue(cleaned);
  }
}

  trimmedMinLength(min: number) {
    return (control: any) => {
      if (!control.value) return null;
      const trimmed = control.value.trim();
      return trimmed.length >= min ? null : { trimmedMinLength: true };
    };
  }

  passwordMatch(group: FormGroup) {
    const newPass = group.get('newPassword')?.value;
    const confirmPass = group.get('confirmPassword')?.value;
    return newPass === confirmPass ? null : { mismatch: true };
  }



  preventLeadingSpace(event: KeyboardEvent, controlName: string) {
    const isSpaceKey = event.key === ' ' || event.key === 'Spacebar';
    const isLetter = /^[A-Za-z]$/.test(event.key);

    // Allow only letters or space
    if (!isLetter && !isSpaceKey && event.key.length === 1) {
      event.preventDefault();
      return;
    }

    const ctrl = this.profileForm.get(controlName);
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
    const ctrl = this.profileForm.get(controlName);
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
    const ctrl = this.profileForm.get(controlName);
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
    const ctrl = this.profileForm.get(controlName);
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
    const ctrl = this.profileForm.get(controlName);
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


  onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      this.profileForm.get('profileImage')?.setValue(null);
      this.previewUrl = null;
      this.selectedFile = undefined;
      this.isImageChanged = false;
      return;
    }

    const file = input.files[0];
    this.selectedFile = file;

    // Manually set the value and trigger validation
    const control = this.profileForm.get('profileImage');
    if (control) {
      control.setValue(file);
      control.markAsTouched();
      control.updateValueAndValidity();
    }

    // Preview the image
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result;
    };
    reader.readAsDataURL(file);

    // Mark that image has changed
    this.isImageChanged = true;
  }

  // ✅ handle country change like in user-edit
  onCountryChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const code = select.value;
    const country = this.countries.find((c) => c.code === code);
    if (country) {
      this.selectedCountry = country;
    }
  }


  updateProfile() {
    this.profileForm.markAllAsTouched();
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.toastService.show("Invalid Profile form. Please correct the errors.");
      return;
    }

    const val = this.profileForm.getRawValue();
    Object.keys(val).forEach((key) => {
      if (typeof val[key] === 'string') val[key] = val[key].trim();
    });

    // ✅ Match UpdateUserDto (same fields as user-edit)
    const dto = {
      firstName: val.firstName,
      lastName: val.lastName,
      phoneNumber: this.selectedCountry.code + ' ' + val.phoneNumber,
      roleId: this.roleId, // user can’t change own role
      isActive: val.isActive,
      emailConfirmed: true,
      resetPassword: null,
      isImageChanged: this.isImageChanged,
    };

    this.userSvc.update(this.userId, dto, this.selectedFile).subscribe({
      next: () => {
        const currentUserId = this.auth.getUserId();

        // ✅ if user updated their own role
        if (currentUserId && currentUserId === this.userId) {
          // logout and re-login with saved credentials
          this.auth.logout().subscribe({
            next: () => {
              this.auth.autoLogin().subscribe({
                next: (success) => {
                  if (success) {
                    // refresh permissions after login
                    // this.auth.refreshPermissions().subscribe({
                    //   next: () => {
                    //     const hasUserList = this.auth.hasPermission('Users.List');
                    //     // ✅ navigate based on permission
                    //     if (hasUserList) {
                    //       this.router.navigate(['/users']);
                    //     } else {
                    //       this.router.navigate(['/dashboard']);
                    //     }
                    //   },
                    //   error: (err) => {
                    //     console.warn('Failed to refresh permissions after role change', err);
                    //     this.router.navigate(['/dashboard']);
                    //   }
                    // });
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
        setTimeout(() => this.toastService.showSuccess("Profile Updated Successfully"), 500);
      },
      error: () => {
        // alert('Update failed');
      }
    });
  }

  oldPasswordVisible = false;
  newPasswordVisible=false;
confirmPasswordVisible: boolean = false;

  toggleOldPassword(){
    this.oldPasswordVisible=!this.oldPasswordVisible;
  }

  toggleNewPassword(){
    this.newPasswordVisible=!this.newPasswordVisible;
  }

  toggleConfirmPasswordVisible(){
    this.confirmPasswordVisible=!this.confirmPasswordVisible;
  }
preventCP(event: ClipboardEvent | MouseEvent) {
  event.preventDefault();
}

  changepass = false;
  changePassword() {

    this.passwordForm.markAllAsTouched();
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      this.toastService.show("Invalid change password form. Please correct the errors.");
      return;
    }
    this.changepass = true;
    const { oldPassword, newPassword } = this.passwordForm.value;
    this.userSvc.changePassword(this.userId, { oldPassword, newPassword }).subscribe({
      next: () => {
        setTimeout(() => this.toastService.showSuccess("Password changed Successfully"), 500);
        this.changepass = false;

        this.passwordForm.reset();
      },
      error: (err) => {
        console.error('error', err);
        // alert('Failed to change password.');
        this.changepass = false;
      },
    });
  }
  goToUserList(){
    this.router.navigate(['/dashboard'])
  }
}
