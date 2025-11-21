import { Component, OnDestroy, OnInit } from '@angular/core';
import { UsersService } from '../../services/users.service'; // optional, use your service
import { RolesService } from '../../services/roles.service'; // optional
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { debounceTime, Subject, takeUntil } from 'rxjs';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
  imports:[CommonModule, ReactiveFormsModule, RouterModule]
})
export class DashboardComponent implements OnInit, OnDestroy {
private destroy$ = new Subject<void>();
  totalUsers = 0;
  totalRoles = 0;
  constructor(private usersSvc: UsersService, private rolesSvc: RolesService, private auth:Auth) {}

  // ngOnInit(): void {
  //   // Replace with real service calls
  //   this.usersSvc.count().subscribe(n => this.totalUsers = +n, () => this.totalUsers = 0);
  //   this.rolesSvc.count().subscribe(n => this.totalRoles = +n, () => this.totalRoles = 0);
  // }

  ngOnInit(): void {
    this.loadCounts();

    this.auth.permissionChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe(() => this.loadCounts());
  }

  loadCounts() {
    this.usersSvc.count().subscribe(n => this.totalUsers = +n, () => this.totalUsers = 0);
    this.rolesSvc.count().subscribe(n => this.totalRoles = +n, () => this.totalRoles = 0);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
