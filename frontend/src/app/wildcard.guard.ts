import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class WildcardGuard implements CanActivate {

  constructor(private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const currentUrl = state.url;

    // Engedélyezzük a gyökér és login oldalt
    if (currentUrl === '/' || currentUrl === '/login') {
      return true;
    }

    // Ha nem YouTube link és nem megengedett route, irányítsunk a login oldalra
    if (!currentUrl.includes('www.youtube.com')) {
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }
}