import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { timer, of } from 'rxjs';
import { switchMap, map, catchError, tap } from 'rxjs/operators';
import { Auth } from '../services/auth';

export function emailRemoteValidator(auth: Auth, waitMs = 500): AsyncValidatorFn {
  return (control: AbstractControl) => {
    const value = (control.value || '').trim();
    if (!value) {
      return of(null); // no value -> no error
    }

    // debounce: start with a short timer, then call the API
    return timer(waitMs).pipe(
      switchMap(() => auth.isEmailAvailable(value).pipe(
        tap(result =>console.log('✅ API result:', result)),
      )),
      map(isAvailable => (isAvailable ? null : { emailTaken: true })),
      catchError(() => of(null)) // on network errors don't block the user
    );
  };
}
