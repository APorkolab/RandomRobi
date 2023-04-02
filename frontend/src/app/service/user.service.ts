import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { User } from '../model/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  apiUrl: string = environment.apiUrl;
  entity: string = 'user';
  list$: BehaviorSubject<User[]> = new BehaviorSubject<User[]>([]);

  constructor(private http: HttpClient) { }

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/${this.entity}/all`);
  }

  getOne(id: string | number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${this.entity}/${id}`);
  }

  create(entity: User): Observable<User> {
    const newEntity = { ...entity, id: null };
    return this.http.post<User>(`${this.apiUrl}/${this.entity}`, newEntity);
  }

  update(entity: User): Observable<User> {
    return this.http.put<User>(
      `${this.apiUrl}/${this.entity}/${entity.id}`,
      entity
    );
  }

  delete(entity: User): Observable<User> {
    return this.http.delete<User>(`${this.apiUrl}/${this.entity}/${entity.id}`);
  }
}