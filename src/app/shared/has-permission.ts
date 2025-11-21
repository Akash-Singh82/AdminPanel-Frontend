import { Directive, Input, TemplateRef, ViewContainerRef, OnDestroy, OnInit } from '@angular/core';
import { Auth } from '../services/auth';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Directive({
  selector: '[hasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private permissionInput!: string | string[];

  constructor(
    private tpl: TemplateRef<any>,
    private vcr: ViewContainerRef,
    private auth: Auth
  ) {}

  @Input() set hasPermission(permission: string | string[]) {
    this.permissionInput = permission;
    this.updateView(); // run immediately once
  }

  ngOnInit() {
    // Subscribe to permission changes from Auth service
    this.auth.permissionChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.updateView());
  }

  private updateView() {
    this.vcr.clear();

    const permission = this.permissionInput;
    if (!permission) return;

    if (Array.isArray(permission)) {
      const allowed = this.auth.hasAny(permission);
      if (allowed) this.vcr.createEmbeddedView(this.tpl);
    } else {
      const allowed = this.auth.hasPermission(permission);
      if (allowed) this.vcr.createEmbeddedView(this.tpl);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
