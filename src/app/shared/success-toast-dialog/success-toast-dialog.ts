import { Component, HostListener, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-success-toast-dialog',
  imports: [],
  templateUrl: './success-toast-dialog.html',
  styleUrl: './success-toast-dialog.scss',
})
export class SuccessToastDialog {

   message: string;
  private timeoutId: any;

  constructor(
    private dialogRef: MatDialogRef<SuccessToastDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { message: string }
  ) {
    this.message = data.message;
  }
  ngOnInit() {
    // Auto close after 3 seconds
    this.timeoutId = setTimeout(() => this.dialogRef.close(), 1500);
  }

  ngOnDestroy() {
    clearTimeout(this.timeoutId);
  }
  //  @HostListener('document:wheel')
  @HostListener('document:keydown')
  @HostListener('document:click')
  closeOnClick() {
    this.dialogRef.close();
  }
}
