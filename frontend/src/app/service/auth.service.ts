import { HttpClient } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { User } from '../model/user';

export interface IAuthModel {
  // success: boolean;
  accessToken: string;
  user: User;
}

export interface ILoginData {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  apiUrl: string = environment.apiUrl;
  loginUrl: string = '';

  user$: BehaviorSubject<User | null> =
    new BehaviorSubject<User | null>(null);

  access_token$: BehaviorSubject<string> = new BehaviorSubject<string>('');

  constructor(private http: HttpClient, private router: Router) {
    this.loginUrl = `${this.apiUrl}/login`;

    const loginInfo = sessionStorage.getItem('login');
    if (loginInfo) {
      const loginObject = JSON.parse(loginInfo);
      this.access_token$.next(loginObject.accessToken);
      this.user$.next(loginObject.user);
    }

    this.user$.subscribe({
      next: (user) => {
        if (!user && this.router.url.includes('/admin')) {
          this.router.navigate(['/login']);
          this.access_token$.next('');
          sessionStorage.removeItem('login');
        }
      },
    });
  }

  login(loginData: ILoginData): void {
    this.http.post<IAuthModel>(this.loginUrl, loginData).subscribe({
      next: (response: IAuthModel) => {
        this.user$.next(response.user);
        this.access_token$.next(response.accessToken);
        sessionStorage.setItem('login', JSON.stringify(response));
        if (response.accessToken) {
          sessionStorage.setItem('access_token', response.accessToken);
          this.router.navigate(['/admin']);
        }
      },
      error: (err) => console.error(err),
    });
  }

  logout(): void {
    sessionStorage.removeItem('login');
    sessionStorage.removeItem('access_token');
    this.user$.next(null);
    this.access_token$.next('');
  }

  getAccessToken(): string {
    return this.access_token$.getValue();
  }

  getUser(): any {
    return this.user$.getValue();
  }
}