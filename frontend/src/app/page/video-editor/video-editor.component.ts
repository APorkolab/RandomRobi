import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { Video } from 'src/app/model/video';
import { VideoService } from 'src/app/service/video.service';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-video-editor',
  templateUrl: './video-editor.component.html',
  styleUrls: ['./video-editor.component.scss']
})
export class VideoEditorComponent implements OnInit {
  video$!: Observable<Video>;
  video: Video = new Video();
  videoForm!: FormGroup;

  constructor(
    private videoService: VideoService,
    private route: ActivatedRoute,
    private router: Router,
    private datePipe: DatePipe,
    private fb: FormBuilder
  ) { }

  ngOnInit(): void {
    this.initForm();

    this.video$ = this.route.params.pipe(
      switchMap(params => {
        const videoId = params['id'];
        if (videoId === '0' || videoId === undefined) {
          const newVideo = { id: 0, link: '', createdAt: new Date().toISOString() } as Video;
          return of(newVideo);
        }
        return this.videoService.getVideoById(videoId);
      }),
      tap(video => {
        if (video) {
          this.video = video;
          this.videoForm.patchValue({
            ...video,
            createdAt: this.toISODateTimeString(new Date(video.createdAt))
          });
        }
      })
    );

    this.videoForm.get('link')?.valueChanges.subscribe(link => {
      this.transformLink(link);
    });
  }

  initForm(): void {
    this.videoForm = this.fb.group({
      id: [0],
      link: ['', [Validators.required, Validators.pattern(/^(https?:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+/)]],
      createdAt: [this.toISODateTimeString(new Date()), Validators.required]
    });
  }

  onSave(): void {
    if (this.videoForm.invalid) {
      return;
    }
    const formValue = this.videoForm.value;
    // Important: Keep the transformed embed link from the component property
    const videoData: Video = { ...this.video, ...formValue, link: this.video.link };

    if (videoData.id && videoData.id !== 0) {
      this.onUpdate(videoData);
    } else {
      this.onCreate(videoData);
    }
  }

  onUpdate(video: Video): void {
    this.videoService.updateVideo(video).subscribe({
      next: () => this.router.navigate(['/', 'admin']),
      error: (err) => console.error('Error updating video:', err)
    });
  }

  onCreate(video: Video): void {
    this.videoService.createVideo(video).subscribe({
      next: () => this.router.navigate(['/', 'admin']),
      error: (err) => console.error('Error creating video:', err)
    });
  }

  private toISODateTimeString(date: Date): string {
    return this.datePipe.transform(date, 'yyyy-MM-ddTHH:mm') || '';
  }

  transformLink(link: string): void {
    if (!link) return;
    const youtubeRegex = /^(https?:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+/;
    if (youtubeRegex.test(link)) {
      const videoId = link.split('v=')[1]?.split('&')[0] || link.split('/').pop();
      if (this.video.link !== `https://www.youtube.com/embed/${videoId}`) {
        this.video.link = `https://www.youtube.com/embed/${videoId}`;
      }
    }
  }
}