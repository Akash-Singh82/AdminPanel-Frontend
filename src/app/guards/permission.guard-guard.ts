import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';
import { ToastService } from '../services/toast.service';
import { NavigationService } from '../services/navigation.service';

export const permissionGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const toast = inject(ToastService);
  const router = inject(Router);
 const navigationService = inject(NavigationService);

  const required = route.data?.['permission'] as string | undefined;
  if (!required) return true;

  if (auth.hasPermission(required)) {
    return true;
  }
  toast.show('You do not have permission to access this page.');
  // Redirect by returning UrlTree (preferred because it's synchronous and safe)
    const previousUrl = navigationService.getPreviousUrl();

  // Important: navigate *after* guard finishes
  setTimeout(() => {
    if (previousUrl) {
      router.navigateByUrl(previousUrl);
    } else {
      router.navigate(['/dashboard']); // fallback
    }
  });

  // Cancel the current navigation
  return false;
  // return router.parseUrl(router.url);

};
