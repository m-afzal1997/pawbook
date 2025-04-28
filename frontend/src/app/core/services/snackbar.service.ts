import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {
  private readonly defaultConfig: MatSnackBarConfig = {
    duration: 3500,
    horizontalPosition: 'end',
    verticalPosition: 'top',
  };

  private snackBar = inject(MatSnackBar);



  public success(message: string): void {
    this.open(message, 'success');
  }

  public error(message: string): void {
    this.open(message, 'error');
  }

  public dismiss(): void {
    this.snackBar.dismiss();
  }

  private open(message: string, type: string): void {
    const finalConfig: MatSnackBarConfig = {
      ...this.defaultConfig,
      panelClass: `snackbar-${type}`,
    };

    this.snackBar.open(message, 'close', finalConfig);
  }
} 