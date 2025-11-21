import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-error',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error.html',
  styleUrls: ['./error.scss']
})


export class Error implements OnInit 
{ 
  message = 'An error occurred'; 
  code: number | null = null; 

  isLoggedIn = false;
  returnUrl:string | null = null;

  constructor(private route: ActivatedRoute, private router: Router, private auth:Auth) {} 
  ngOnInit(): void 
  { 
    this.route.queryParams.subscribe(params => 
      { 
        this.message = params['message'] || this.message; 
        this.code = params['code'] ? +params['code'] : null; 
        this.returnUrl=params['returnUrl'] || null;
      });
      
      this.isLoggedIn=this.auth.isLoggedIn();
  } 
  goBack() 
  { 
        if (this.isLoggedIn) {
      // ✅ Go to previous page or dashboard
      if (this.returnUrl) {
        this.router.navigateByUrl(this.returnUrl);
      } else {
        this.router.navigate(['/dashboard']); // adjust default route as needed
      }
    } else {
      this.router.navigate(['/login']);
    }
  
  }
}