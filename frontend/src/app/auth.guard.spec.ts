import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';

import { AuthGuard } from './auth.guard';
import { ApiService } from './services/api.service';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => TestBed.inject(AuthGuard).canActivate(...guardParameters));

  beforeEach(() => {
    const mockApi = {} as Partial<ApiService>;
    const mockRouter = {} as Partial<Router>;

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: ApiService, useValue: mockApi },
        { provide: Router, useValue: mockRouter }
      ],
    });
  });

  it('should be created', () => {
    const guard = TestBed.inject(AuthGuard);
    expect(guard).toBeTruthy();
  });
});
