import { Component, HostListener, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-auto-dismiss-dialog',
  imports: [],
  templateUrl: './auto-dismiss-dialog.html',
  styleUrl: './auto-dismiss-dialog.scss',
})
export class AutoDismissDialog {
  message: string="no permissions or not login ";
  private timeoutId!:any;

  constructor(private dialogRef: MatDialogRef<AutoDismissDialog>,@Inject(MAT_DIALOG_DATA) public data: { message: string }) {
    this.message=data.message;
  }

  ngOnInit() {
    // Auto close after 3 seconds
    this.timeoutId = setTimeout(() => this.dialogRef.close(), 1500);
  }

  ngOnDestroy() {
    clearTimeout(this.timeoutId);
  }
  @HostListener('document:wheel')
  @HostListener('document:keydown')
  @HostListener('document:click')
  closeOnUserInteraction() {
    this.dialogRef.close();
  }
}
