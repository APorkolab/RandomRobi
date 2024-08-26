import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BaseService {
  constructor(protected http: HttpClient) { }

  protected get<T>(url: string) {
    return this.http.get<T>(url);
  }

  protected post<T>(url: string, data: any) {
    return this.http.post<T>(url, data);
  }

  protected put<T>(url: string, data: any) {
    return this.http.put<T>(url, data);
  }

  protected delete<T>(url: string) {
    return this.http.delete<T>(url);
  }
}