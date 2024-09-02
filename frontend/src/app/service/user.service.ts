import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from '../model/user';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  constructor(private http: HttpClient, private authService: AuthService) {
    this.currentUserSubject = new BehaviorSubject<User | null>(null);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  // User műveletek kezelése egy metódusban
  handleUser(action: 'get' | 'create' | 'update' | 'delete', user?: User): Observable<any> {
    let url = `${environment.apiUrl}/user`;
    let request$: Observable<any>;

    switch (action) {
      case 'get':
        request$ = this.http.get<User[]>(url);
        break;
      case 'create':
        request$ = this.http.post<User>(url, user);
        break;
      case 'update':
        if (user) {
          request$ = this.http.put<User>(`${url}/${user.id}`, user);
        } else {
          throw new Error('User is undefined');
        }
        break;
      case 'delete':
        if (user) {
          request$ = this.http.delete<void>(`${url}/${user.id}`);
        } else {
          throw new Error('User is undefined');
        }
        break;
      default:
        throw new Error('Invalid action');
    }

    return request$;
  }

  // Új metódus az összes felhasználó lekérésére
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${environment.apiUrl}/user`);
  }

  // A jelenlegi felhasználó elérése
  getCurrentUser(): Observable<User | null> {
    return this.currentUser$;
  }

  // A jelenlegi felhasználó beállítása
  private setCurrentUser(user: User | null): void {
    this.currentUserSubject.next(user);
  }

  // Bejelentkezés
  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/login`, { username, password })
      .pipe(
        tap(response => {
          if (response && response.token) {
            this.authService.login(response.token);
            this.setCurrentUser(response.user);
          }
        })
      );
  }

  // Kijelentkezés
  logout(): void {
    localStorage.removeItem('currentUser');
    this.setCurrentUser(null);
  }

  // A jelenlegi felhasználó betöltése
  loadCurrentUser(): void {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.setCurrentUser(JSON.parse(storedUser));
    }
  }

  // Új metódus az egyes felhasználó lekérésére
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/user/${id}`);
  }
}