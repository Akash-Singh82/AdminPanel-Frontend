import { Injectable } from "@angular/core";
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from "rxjs";
import { ConfirmDialog } from "../shared/confirm-dialog/confirm-dialog";

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
    constructor(private dialog: MatDialog) { }

    confirm(data: {
        title?: string;
        message?: string;
        confirmText?: string;
        cancelText?: string;
    }): Promise<boolean> {
        const dialogRef = this.dialog.open(ConfirmDialog, {
            width: '350px',
            data,
            panelClass: 'confirm-dialog-panel'
        });

        return firstValueFrom(dialogRef.afterClosed());
    }
}