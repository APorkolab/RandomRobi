import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { WildcardGuard } from './wildcard.guard';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { HomeComponent } from './page/home/home.component';
import { LoginComponent } from './page/login/login.component';

describe('WildcardGuard', () => {
  let guard: WildcardGuard;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: 'home', component: HomeComponent },
          { path: 'login', component: LoginComponent }
        ]),
        HomeComponent,
        LoginComponent
      ],
      providers: [WildcardGuard]
    });
    guard = TestBed.inject(WildcardGuard);
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow navigation to /login', () => {
    const route = {} as ActivatedRouteSnapshot;
    const state = { url: '/login' } as RouterStateSnapshot;
    expect(guard.canActivate(route, state)).toBe(true);
  });

  it('should redirect a random path to /login', () => {
    const navigateSpy = spyOn(router, 'navigate');
    const route = {} as ActivatedRouteSnapshot;
    const state = { url: '/some/random/path' } as RouterStateSnapshot;

    const canActivate = guard.canActivate(route, state);

    expect(canActivate).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should allow a path containing www.youtube.com', () => {
    const route = {} as ActivatedRouteSnapshot;
    const state = { url: '/foo/www.youtube.com/bar' } as RouterStateSnapshot;
    expect(guard.canActivate(route, state)).toBe(true);
  });
});
