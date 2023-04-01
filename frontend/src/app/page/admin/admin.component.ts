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
  video: Video = new Video();
  constructor(private videoService: VideoService, private router: Router) { }

  ngOnInit(): void {
    this.videos$ = this.videoService.getAll();
  }

  editVideo(video: Video): void {
    this.router.navigate(['/', 'edit', video.id]);
  }

  deleteVideo(video: Video): void {
    if (confirm('Are you sure you want to delete this video?')) {
      this.videoService.delete(video).subscribe({
        next: () => {
          this.videos$ = this.videoService.getAll();
          console.log('Video deleted successfully.');
        },
        error: (err) => console.error(err),
        complete: () => alert('The video has been deleted successfully.'),
      });
    }
  }

  onCreate(video: Video) {
    this.videoService.create(video).subscribe({
      next: () => this.router.navigate(['/', 'admin']),
      error: (err) => console.log(err),
      complete: () => alert('The new video has been created successfully.'),
    });
  }
}
