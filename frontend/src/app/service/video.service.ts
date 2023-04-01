
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BasicService } from './base.service';
import { Video } from '../model/video';

@Injectable({
  providedIn: 'root',
})
export class VideoService extends BasicService<Video> {
  constructor(http: HttpClient) {
    super(http);
    this.entity = '';
  }
}