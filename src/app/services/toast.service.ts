import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AutoDismissDialog } from '../shared/auto-dismiss-dialog/auto-dismiss-dialog';
import { SuccessToastDialog } from '../shared/success-toast-dialog/success-toast-dialog';
// import { AutoDismissDialog } from '../components/auto-dismiss-dialog/auto-dismiss-dialog';

@Injectable({ providedIn: 'root' })
export class ToastService {
  constructor(private dialog: MatDialog) {}

  show(message: string) {
    const dialogRef = this.dialog.open(AutoDismissDialog, {
      data: { message },
      panelClass: 'no-padding-dialog',
      position: { top: '0', right: '0' },
      hasBackdrop: false,
  
    });

    // return dialogRef;
  }

  showSuccess(message: string) {
    return this.dialog.open(SuccessToastDialog, {
      data: { message },
      panelClass: 'no-padding-dialog',
      position: { top: '0', right: '0' },
      hasBackdrop: false,
    });
  }
}
