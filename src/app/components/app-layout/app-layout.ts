import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Auth, ProfileInfo } from '../../services/auth'; // adjust import path
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HasPermissionDirective } from '../../shared/has-permission';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-layout',
  templateUrl: './app-layout.html',
  styleUrls: ['./app-layout.scss'],
  imports:[CommonModule, ReactiveFormsModule, RouterModule, HasPermissionDirective]
})
export class AppLayoutComponent implements OnInit {
  // when collapsed true => narrow sidebar (icons only)
  collapsed = false;
  profile?: ProfileInfo;
  profileOpen = false;

  ngOnInit() {
  if (window.innerWidth < 768) {
    this.collapsed = true;
  }
}

@HostListener('window:resize', ['$event'])
onResize(event: Event) {
  const width = (event.target as Window).innerWidth;
  // collapse when screen is smaller than 768px
  if (width < 1000 && !this.collapsed) {
    this.collapsed = true;
  } else if (width >= 1000 && this.collapsed) {
    this.collapsed = false;
  }
}



  // constructor(private auth: Auth, private router: Router) {
  //   this.auth.getProfile().subscribe({
  //     next: p => this.profile = p,
  //     error: () => this.profile = undefined
  //   });
  // }
  constructor(private auth: Auth, private router: Router, private toastService:ToastService) {
  // reactive binding: always updates when profile changes
  this.auth.profile$.subscribe({
    next: p => this.profile = p || undefined
  });

  // fetch once on init to populate
  this.auth.getProfile().subscribe();
}


  toggleCollapse() {
    this.collapsed = !this.collapsed;
  }

  toggleProfile(e?: Event) {
    e?.stopPropagation();
    this.profileOpen = !this.profileOpen;
  }

  logout() {
    this.auth.logout().subscribe({
      next: () =>{
        this.toastService.showSuccess('Logged out successfully!');
        this.router.navigate(['/login']);
      },
      error: () => this.router.navigate(['/login'])
    });
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.profile-dropdown') && !target.closest('.profile-toggle')) {
      this.profileOpen = false;
    }
  }
}
