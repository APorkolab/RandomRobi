import { Component, OnInit } from '@angular/core';
import { VideoService } from '../../service/video.service';
import { Video } from '../../model/video';

import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  videos$!: Observable<Video[]>;

  constructor(private videoService: VideoService, private router: Router) { }

  ngOnInit(): void {
    this.videos$ = this.videoService.getAll();
  }

  editVideo(video: Video): void {
    this.router.navigate(['/', 'edit', video.id]);
  }

  deleteVideo(video: Video): void {
    this.videoService.delete(video).subscribe(() => {
      this.videos$ = this.videoService.getAll();
    });
  }
}
