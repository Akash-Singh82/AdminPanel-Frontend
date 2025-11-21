import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

export function passwordValidator() : ValidatorFn {

    return (control: AbstractControl): ValidationErrors | null =>{
        const password = control.value as string;

        if(!password) return null;

        const errors: ValidationErrors ={};


        // Must include digits
    if (!/\d/.test(password)) {
      errors['requireDigit'] = true;
    }

    // Must include uppercase letters
    if (!/[A-Z]/.test(password)) {
      errors['requireUppercase'] = true;
    }

    // Must include lowercase letters
    if (!/[a-z]/.test(password)) {
      errors['requireLowercase'] = true;
    }

    // Must include non-alphanumeric (special) characters
    if (!/[^a-zA-Z0-9]/.test(password)) {
      errors['requireNonAlphanumeric'] = true;
    }

    // Minimum length 8
    if (password.length < 8) {
      errors['requiredLength'] = true;
    }

    // Required unique characters (4)
    const uniqueChars = new Set(password).size;
    if (uniqueChars < 4) {
      errors['requiredUniqueChars'] = true;
    }

    return Object.keys(errors).length ? errors : null;
  };

} 