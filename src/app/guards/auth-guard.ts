import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';
import { ToastService } from '../services/toast.service';
import { catchError, map, of } from 'rxjs';

export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(Auth);
  const router = inject(Router);
  const toast = inject(ToastService);

  if(!authService.isLoggedIn()){
    setTimeout(()=>toast.show('Please log in to access this page.'), 100);
    router.navigate(['/login']);
    return false;
  }

  // return authService.checkServerStatus().pipe(
  //   map((alive) => {
  //     if (alive === false) {
  //       toast.show('Server is unreachable. Please try again later.');
  //       router.navigate(['/login']);
  //       return false;
  //     }
  //     return true;
  //   }),
  //   catchError(() => {
  //     toast.show('Network error. Please check your connection.');
  //     router.navigate(['/login']);
  //     return of(false);
  //   })
  // );
  return true;
 

};




