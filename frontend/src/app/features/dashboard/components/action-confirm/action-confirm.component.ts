import { Component, inject, Inject, Input } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

export interface ActionConfirmData {
  header: string;
  text: string;
}

@Component({
  selector: 'pb-action-confirm',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './action-confirm.component.html'
})
export class ActionConfirmComponent {

  public dialogRef: MatDialogRef<ActionConfirmComponent> = inject(MatDialogRef<ActionConfirmComponent>);
  public data: ActionConfirmData = inject(MAT_DIALOG_DATA);

  public onCancel(): void {
    this.dialogRef.close(false);
  }

  public onConfirm(): void {
    this.dialogRef.close(true);
  }
}
