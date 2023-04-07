import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { User } from '../model/user';
import { BasicService } from './base.service';

@Injectable({
  providedIn: 'root'
})
export class UserService extends BasicService<User> {
  constructor(http: HttpClient) {
    super(http);
    this.entity = 'user';
  }
}