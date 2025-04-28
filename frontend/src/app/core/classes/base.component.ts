import {Subject} from 'rxjs';
import {Component, OnDestroy} from '@angular/core';

@Component({
  standalone: true,
  template: '',
})
export class BaseComponent implements OnDestroy {
  protected destroy$: Subject<boolean> = new Subject<boolean>();
  public constructor() { }

  public ngOnDestroy(): void {
    this.destroy$.next(false);
    this.destroy$.unsubscribe();
    this.afterOnDestroy();
  }

  protected afterOnDestroy(): void {} // override this in base class
}
