// frontend/src/app/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { ApiService } from './services/api.service';
import { map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private apiService: ApiService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    const code = localStorage.getItem('userCode');

    // If navigating to '/', redirect to /rating if userCode exists
    if (state.url === '/' || state.url === '') {
      if (code) {
        this.router.navigate(['/rating'], { queryParams: { code } });
        return false;
      }
      return true; // Allow access to welcome page if no code
    }

    // For /admin, check if user is admin
    if (state.url.startsWith('/admin')) {
      if (!code) {
        this.router.navigate(['/']);
        return false;
      }
      return this.apiService.isAdmin(code).pipe(
        map(response => {
          if (response) {
            return true;
          } else {
            this.router.navigate(['/rating'], { queryParams: { code } });
            return false;
          }
        })
      );
    }

    // Allow access to other routes (e.g., /rating)
    return true;
  }
}