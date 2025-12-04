import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent {
  code: string = '';

  constructor(private router: Router, private apiService: ApiService) {
    localStorage.removeItem('userCode');
  }

  handleSubmit(event: Event): void {
    event.preventDefault();
    if (this.code.trim().length === 3) {
      this.apiService.isValidUserCode(this.code).pipe(
        tap(response => {
          if (response.isValid) {
            localStorage.setItem('userCode', this.code);
          }}
          
      )).subscribe();
      this.apiService.isAdmin(this.code).pipe(
        tap(response => {
          console.log(response);
          if (response) {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/rating']);
          }
        }),
        catchError(error => {
          console.error('Error checking admin:', error);
          localStorage.setItem('userCode', this.code);
          this.router.navigate(['/rating']);
          return of(null);
        })
      ).subscribe();
    }
  }

  updateCode(value: string): void {
    this.code = value.toUpperCase();
  }
}