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
  video$: Observable<Video> = of();
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
        if (videoId === '0' || videoId === undefined) {
          this.video = { id: 0, link: '', createdAt: new Date().toISOString() } as Video;
          this.createdAtString = this.toISODateTimeString(new Date(this.video.createdAt));
          return of(this.video);
        }
        return this.videoService.getVideoById(videoId).pipe(
          tap(video => {
            if (video) {
              this.video = video;
              this.createdAtString = this.toISODateTimeString(new Date(this.video.createdAt));
            }
          })
        );
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

    console.log('Updated Video Data:', updatedVideo);

    this.videoService.updateVideo(updatedVideo).subscribe({
      next: (response) => {
        console.log('Server response:', response);
        alert('The video has been updated successfully.');
        this.router.navigate(['/', 'admin']);
      },
      error: (err) => {
        console.error('Error updating video:', err);
        alert(`Error updating video: ${err.error?.error || err.message}`);
      }
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

  transformLink(link: string): void {
    const youtubeRegex = /^(https?:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+/;
    if (youtubeRegex.test(link)) {
      const videoId = link.split('v=')[1] || link.split('/').pop();
      this.video.link = `https://www.youtube.com/embed/${videoId}`;
    }
  }
}