import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
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
  entity = 'Family member';

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
      next: (video) =>
        (this.video = video ? video : this.video),
    });
  }

  onUpdate(video: Video) {
    this.videoService.update(video).subscribe({
      next: (category) => this.router.navigate(['/', 'admin']),
      error: (err) => console.log(err),
      complete: () => console.log('Successful operation.'),
    });
  }

  onCreate(video: Video) {
    this.videoService.create(video).subscribe({
      next: (category) => this.router.navigate(['/', 'admin']),
      error: (err) => console.log(err),
      complete: () => console.log('Successful operation.'),
    });
  }
}