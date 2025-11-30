// welcome.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent {
  code: string = '';

  constructor(private router: Router) {}

  handleSubmit(event: Event): void {
    event.preventDefault();
    if (this.code.trim().length === 3) {
      this.router.navigate(['/rating'], { queryParams: { code: this.code } });

    }
  }

  updateCode(value: string): void {
    this.code = value.toUpperCase();
  }
}