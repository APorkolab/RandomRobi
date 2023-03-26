import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root',
})
export class BasicService<
  T extends { id: string | number;[key: string]: any }
> {
  apiUrl: string = environment.apiUrl;
  entity: string = '';
  list$: BehaviorSubject<T[]> = new BehaviorSubject<T[]>([]);

  constructor(private http: HttpClient) { }

  getLatest(): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/`);
  }

  getAll(): Observable<T[]> {
    return this.http.get<T[]>(`${this.apiUrl}/all`);
  }

  getOne(id: string | number): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${id}`);
  }

  create(entity: T): Observable<T> {
    const newEntity = { ...entity, id: null };
    return this.http.post<T>(`${this.apiUrl}/}`, newEntity);
  }

  update(entity: T): Observable<T> {
    return this.http.patch<T>(
      `${this.apiUrl}/${this.entity}/${entity.id}`,
      entity
    );
  }

  delete(entity: T): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${entity.id}`);
  }
}