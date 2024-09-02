import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { User } from '../model/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenKey = 'authToken';
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.checkInitialLoginState());
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.isLoggedInSubject = new BehaviorSubject<boolean>(this.checkInitialLoginState());
    this.isLoggedIn$ = this.isLoggedInSubject.asObservable();
  }

  private checkInitialLoginState(): boolean {
    const token = this.getToken();
    return !!token && this.isTokenValid(token);
  }

  login(loginData: { username: string, password: string }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/login`, loginData);
  }

  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.isLoggedInSubject.next(true);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.isLoggedInSubject.next(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token || !this.isTokenValid(token)) {
      this.logout();
      return false;
    }
    return true;
  }

  private isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch (e) {
      console.error('Invalid token format', e);
      return false;
    }
  }

  getUser(): Observable<User> {
    if (!this.isLoggedIn()) {
      this.logout();
      throw new Error('User is not logged in or token has expired');
    }
    const token = this.getToken();
    return this.http.get<User>(`${environment.apiUrl}/user`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}