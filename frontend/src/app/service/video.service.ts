import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { Observable } from 'rxjs';
import { Video } from '../model/video';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VideoService extends BaseService {

  private readonly apiEndpoint = `${environment.apiUrl}/video`;

  // Összes videó lekérése
  getAllVideos(): Observable<Video[]> {
    return this.get<Video[]>(this.apiEndpoint);
  }

  getLatestVideo(): Observable<Video> {
    return this.http.get(`${this.apiEndpoint}/latest`);
  }

  // Egy videó lekérése ID alapján
  getVideoById(id: number): Observable<Video> {
    return this.get<Video>(`${this.apiEndpoint}/${id}`);
  }

  // Új videó létrehozása
  createVideo(video: Video): Observable<Video> {
    return this.post<Video>(this.apiEndpoint, video);
  }

  // Videó frissítése
  updateVideo(video: Video): Observable<Video> {
    return this.put<Video>(`${this.apiEndpoint}/${video.id}`, video);
  }

  // Videó törlése
  deleteVideo(id: number): Observable<void> {
    return this.delete<void>(`${this.apiEndpoint}/${id}`);
  }

  // Véletlenszerű videó lekérése
  getRandomVideo(): Observable<Video> {
    return this.get<Video>(`${this.apiEndpoint}/random`);
  }
}