import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Login } from './components/login/login';
// import { Register } from './components/register/register';
import { Profile } from './components/profile/profile';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet, 
    MatDialogModule
    
    
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  // protected readonly title = signal('admin-panel');
}
