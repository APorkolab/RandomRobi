import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Video } from 'src/app/model/video';
import { VideoService } from 'src/app/service/video.service';

@Component({
  selector: 'app-video-editor',
  templateUrl: './video-editor.component.html',
  styleUrls: ['./video-editor.component.scss']
})
export class VideoEditorComponent implements OnInit {
  video$!: Observable<Video>;
  video: Video = new Video();
  createdAtString = '';

  constructor(
    private videoService: VideoService,
    private route: ActivatedRoute,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe({
      next: (param) => {
        if (param['id'] == '0') {
          return of(new Video());
        }
        this.video$ = this.videoService.getOne(param['id']);
        return this.videoService.getOne(param['id']);
      },
    });

    this.video$.subscribe({
      next: (video) => {
        this.video = video ? video : this.video;
        const createdAtDate = new Date(Date.parse(this.video.createdAt));
        this.createdAtString = createdAtDate.toISOString().substring(0, 16);
      },
    });

    return;
  }

  onUpdate(video: Video) {
    const date = new Date(this.createdAtString);
    const utcDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
    video.createdAt = utcDate.toISOString();
    this.videoService.update(video).subscribe({
      next: () => this.router.navigate(['/', 'admin']),
      error: (err) => console.error(err),
      complete: () => console.info("Update success"),
    });
  }

  onCreate(video: Video) {
    const now = new Date().toISOString().replace(/\..+/, '').replace('T', ' ');
    const date = new Date(this.createdAtString);
    const utcDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
    const formCreatedAt = this.createdAtString ? utcDate.toISOString().replace(/\..+/, '').replace('T', ' ') : now;
    const newVideo = { ...video, createdAt: formCreatedAt };
    this.videoService.create(newVideo).subscribe({
      next: () => {
        this.router.navigate(['/', 'admin']);
        console.info('The new video has been created successfully.');
      },
      error: (err) => console.error(err),
    });
  }


  private toISODateTimeString(date: Date): string {
    const year = date.getFullYear().toString().padStart(4, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

}
