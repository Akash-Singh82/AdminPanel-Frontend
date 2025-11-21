
import { emailRemoteValidator } from './email-remote.validator';
import { Auth } from '../services/auth';
import { of } from 'rxjs';
import { FormControl } from '@angular/forms';

describe('emailRemoteValidator', () => {
  it('should create an instance', () => {
    const mockAuth: Auth = {
      isEmailAvailable: (email: string) => of(true)
    } as Auth;

    const validatorFn = emailRemoteValidator(mockAuth);
    expect(validatorFn).toBeTruthy();
  });
});
