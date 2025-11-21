import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-confirm-email',
  imports: [],
  templateUrl: './confirm-email.html',
  styleUrl: './confirm-email.scss'
})
export class ConfirmEmail implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private auth: Auth,
    private router: Router
  ){}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const userId = params['userId'];
      const token= params['token'];
      if(!userId || !token){
        this.router.navigate(['/error'], { queryParams: { message: 'Invalid confirmation link' } });
        return;
      }

      
      this.auth.confirmEmail(userId, token).subscribe({
        next: () => {
          this.router.navigate(['/email-confirmed']);
        },
        error: (err) => {
          // ErrorInterceptor will redirect to /error, but we can also show fallback 
           this.router.navigate(['/error'], { queryParams: { message: 'Failed to confirm email', code: err.status || 500 } }); 
          }
      });
    });
    
  }
}


