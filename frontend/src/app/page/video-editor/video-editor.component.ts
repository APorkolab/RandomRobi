import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { Video } from 'src/app/model/video';
import { VideoService } from 'src/app/service/video.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-video-editor',
  templateUrl: './video-editor.component.html',
  styleUrls: ['./video-editor.component.scss']
})
export class VideoEditorComponent implements OnInit {
  video$!: Observable<Video | undefined>;
  video: Video = new Video();
  createdAtString = '';

  constructor(
    private videoService: VideoService,
    private route: ActivatedRoute,
    private router: Router,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    this.initializeCreatedAtString();

    this.video$ = this.route.params.pipe(
      switchMap(params => {
        const videoId = params['id'];
        if (videoId === '0') {
          return of(new Video());
        }
        return this.videoService.getVideoById(videoId);
      }),
      tap(video => {
        if (video) {
          this.video = video;
          this.createdAtString = this.toISODateTimeString(new Date(this.video.createdAt));
        }
      })
    );

    this.video$.subscribe();
  }

  private initializeCreatedAtString(): void {
    const localTime = new Date();
    const utcTime = new Date(localTime.getTime() + (localTime.getTimezoneOffset() * 60000));
    this.createdAtString = this.datePipe.transform(utcTime, 'yyyy-MM-ddTHH:mm') || '';
  }

  onUpdate(video: Video): void {
    const updatedVideo = {
      ...video,
      link: this.video.link,
      createdAt: this.toISODateTimeString(new Date(this.createdAtString))
    };

    this.videoService.updateVideo(updatedVideo).subscribe({
      next: () => {
        alert('The video has been updated successfully.');
        this.router.navigate(['/', 'admin']);
      },
      error: (err) => console.error('Error updating video:', err)
    });
  }

  onCreate(video: Video): void {
    const newVideo = {
      ...video,
      createdAt: this.toISODateTimeString(new Date(this.createdAtString))
    };

    this.videoService.createVideo(newVideo).subscribe({
      next: () => {
        console.info('The new video has been created successfully.');
        this.router.navigate(['/', 'admin']);
      },
      error: (err) => console.error('Error creating video:', err)
    });
  }

  private toISODateTimeString(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-ddTHH:mm') || '';
  }
}