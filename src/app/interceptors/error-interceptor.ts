// // import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
// // import { inject } from '@angular/core';
// // import { MatDialog } from '@angular/material/dialog';
// // import { catchError, throwError } from 'rxjs';
// // import { ErrorDialog } from '../shared/error-dialog/error-dialog';
// // import { AutoDismissDialog } from '../shared/auto-dismiss-dialog/auto-dismiss-dialog';

// // export const errorInterceptor: HttpInterceptorFn = (req, next) => {
// //   const dialog = inject(MatDialog);

// //   return next(req).pipe(
// //     catchError((err: HttpErrorResponse) => {
// //       let message = 'An unexpected error occurred';
// //       const code = err.status;
// //       const isLoginRequest = req.url.includes('/api/Account/Login');

// //       // ✅ Handle login errors distinctly
// //       if (isLoginRequest && err.status === 400 || err.status === 401) {
// //         if (typeof err.error === 'string') {
// //           message = err.error;
// //         } else if (err.error?.message) {
// //           message = err.error.message;
// //         } else {
// //           message = 'Invalid email or password.';
// //         }

// //         dialog.open(AutoDismissDialog, {
// //           data: { message },
// //           disableClose: true,
// //           panelClass: 'auto-dismiss-dialog-panel' // optional styling hook
// //         });

// //         return throwError(() => ({ ...err, message }));
// //       }

// //       // ✅ For all other errors
// //       if (err.error) {
// //         if (typeof err.error === 'string') {
// //           message = err.error;
// //         } else if (err.error.message) {
// //           message = err.error.message;
// //         } else if (Array.isArray(err.error)) {
// //           message = err.error.join(', ');
// //         }
// //       } else if (err.status === 0) {
// //         message = 'Network error - please check your connection.';
// //       }

// //       dialog.open(ErrorDialog, {
// //         data: { code, message },
// //         disableClose: true,
// //       });

// //       return throwError(() => err);
// //     })
// //   );
// // };

// import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
// import { inject } from '@angular/core';
// import { MatDialog } from '@angular/material/dialog';
// import { catchError, throwError } from 'rxjs';
// import { AutoDismissDialog } from '../shared/auto-dismiss-dialog/auto-dismiss-dialog';

// export const errorInterceptor: HttpInterceptorFn = (req, next) => {
//   const dialog = inject(MatDialog);

//   return next(req).pipe(
//     catchError((err: HttpErrorResponse) => {
//       let message = 'An unexpected error occurred';
//       const code = err.status;
//       const isLoginRequest = req.url.includes('/api/Account/Login');

//       // 🔹 Determine message based on error content
//       if (err.error) {
//         if (typeof err.error === 'string') {
//           message = err.error;
//         } else if (err.error.message) {
//           message = err.error.message;
//         } else if (Array.isArray(err.error)) {
//           message = err.error.join(', ');
//         }
//       } else if (err.status === 0) {
//         message = 'Network error - please check your connection.';
//       } else if (isLoginRequest && (err.status === 400 || err.status === 401)) {
//         message = 'Your session expired.';
//       }

//       // 🔹 Always show AutoDismissDialog
//       dialog.open(AutoDismissDialog, {
//         data: { message },
//         disableClose: true,
//         panelClass: 'auto-dismiss-dialog-panel',
//       });

//       return throwError(() => err);
//     })
//   );
// };

      // 🔹 Handle login errors separately
  //     if (isLoginRequest && (err.status === 400 || err.status === 401)) {
  //       if (typeof err.error === 'string') message = err.error;
  //       else if (err.error?.message) message = err.error.message;
  //       else message = 'Invalid email or password.';
  //     }
  //     // 🔹 Handle other errors
  //     else if (err.error) {
  //       if (typeof err.error === 'string') message = err.error;
  //       else if (err.error.message) message = err.error.message;
  //       else if (Array.isArray(err.error)) message = err.error.join(', ');
  //     } else if (err.status === 0) {
  // message = 'Cannot connect to the server. Please check your internet connection.';
  
  // dialog.open(AutoDismissDialog, {
  //   data: { message },
  //   disableClose: true,
  //   panelClass: 'auto-dismiss-dialog-panel',
  // });}

  //     dialog.open(AutoDismissDialog, {
  //       data: { message },
  //       disableClose: true,
  //       panelClass: 'auto-dismiss-dialog-panel',
  //     });

  //     return throwError(() => err);
  //   })
  // );



import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AutoDismissDialog } from '../shared/auto-dismiss-dialog/auto-dismiss-dialog';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const dialog = inject(MatDialog);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      let message = 'An unexpected error occurred';
      const code = err.status;
      const isLoginRequest = req.url.includes('/api/Account/Login');

  if (typeof err.error === 'string' && err.error.startsWith('<!DOCTYPE html')) {
  message = 'Invalid request. Please check your inputs.';
}
else if (err.status === 405 || err.status === 404) {
  message = 'Invalid request. Please check your inputs.';
}



      if (err.status === 0) {
        message = 'Server is currently offline. Please check your connection or try again later.';

        dialog.open(AutoDismissDialog, {
          data: { message },
          disableClose: true,
          panelClass: 'auto-dismiss-dialog-panel',
        });
          router.navigate(['/login']);
        // Return a fake error observable so app doesn’t crash
        return throwError(() => new Error(message));
      }

      // 🔹 Handle expired session (401) globally
      if (!isLoginRequest && err.status === 401) {
        message = 'Your session has expired. Please log in again.';

        dialog.open(AutoDismissDialog, {
          data: { message },
          disableClose: true,
          panelClass: 'auto-dismiss-dialog-panel',
        });

        // ✅ Optionally clear localStorage/token and redirect
        localStorage.removeItem('token');
        
          router.navigate(['/login']);
      

        return throwError(() => err);
      }


  // Login-specific errors
      if (isLoginRequest && (err.status === 400 || err.status === 401)) {
        message = err.error?.message || "Invalid email or password.";
      }

      // NORMAL ERRORS (this handles API validation errors!)
      else if (err.error) {
        if (typeof err.error === 'string') message = err.error;
        else if (err.error.message) message = err.error.message;   // 🔥 Your backend messages appear here!
        else if(err.error.errors){
          const errors = err.error.errors;
          const firstKey = Object.keys(errors)[0];
          message = errors[firstKey][0];
        }
        else if (Array.isArray(err.error)) message = err.error.join(', ');
      }

      dialog.open(AutoDismissDialog, {
        data: { message },
        disableClose: true,
      });

      return throwError(() => err);
    })
  );
};



