import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class WelcomeComponent {
  code: string = '';
  errorMessage: string = '';
  isChecking = false;

  constructor(private router: Router, private apiService: ApiService) {
    localStorage.removeItem('userCode');
  }

  handleSubmit(event: Event): void {
    event.preventDefault();
    this.errorMessage = '';
    this.isChecking = true;

    if (this.code.trim().length !== 6) return;

    this.apiService.isValidUserCode(this.code).subscribe({
      next: (res) => {
        if (!res.isValid) {
          this.errorMessage = 'This code does not exist or has expired';
          this.isChecking = false;
          return;
        }

        localStorage.setItem('userCode', this.code);

        // Check if admin
        this.apiService.isAdmin(this.code).subscribe({
          next: (isAdmin) => {
            this.router.navigate([isAdmin ? '/admin' : '/rating']);
          },
          error: () => this.router.navigate(['/rating'])
        });
      },
      error: () => {
        this.errorMessage = 'Network error. Try again.';
        this.isChecking = false;
      }
    });
  }

  updateCode(value: string): void {
    this.code = value.toUpperCase().slice(0, 6);
    this.errorMessage = '';
  }
}