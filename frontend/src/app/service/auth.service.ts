import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { User } from '../model/user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly tokenKey = 'authToken';

  constructor(private http: HttpClient, private router: Router) { }

  login(loginData: { username: string, password: string }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/login`, loginData);
  }

  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUser(): Observable<User> {
    const token = this.getToken();
    return this.http.get<User>(`${environment.apiUrl}/user`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}
